import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  GoogleAuthProvider,
  UserCredential,
  authState,
  browserLocalPersistence,
  getRedirectResult,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { from, lastValueFrom, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from '../../app.config.model';
import { GoogleAuthService } from './google-auth.service';
import { ToastrService } from './toastr.service';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly auth: Auth = inject(Auth);
  private readonly firestore: Firestore = inject(Firestore);
  private readonly config: AppConfig = inject(APP_CONFIG);
  private readonly router: Router = inject(Router);
  private readonly googleAuthService = inject(GoogleAuthService);
  private readonly toastr = inject(ToastrService);

  private readonly SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24h inactivity logout
  private sessionCheckInterval?: ReturnType<typeof setInterval>;
  private tokenRefreshInterval?: ReturnType<typeof setInterval>;

  private readonly _isSigningIn = signal(false);
  private readonly _isSigningOut = signal(false);
  private readonly _lastActivity = signal<number>(Date.now());

  isSigningIn = this._isSigningIn.asReadonly();
  isSigningOut = this._isSigningOut.asReadonly();

  private user$ = authState(this.auth);
  user = toSignal(this.user$);

  isAllowed$ = this.user$.pipe(
    switchMap((user) => {
      if (!user?.email) {
        this.clearSessionTimers();
        return of(false);
      }
      this.startSessionManagement();
      return this.checkIfUserIsAllowed(user.email);
    }),
  );

  isAllowed = toSignal(this.isAllowed$, { initialValue: undefined });
  isAuthenticated = computed(() => !!this.user() && this.isAllowed() === true);

  constructor() {
    // Set persistence to LOCAL for better auth state management
    setPersistence(this.auth, browserLocalPersistence).catch((err) => {
      console.error('Failed to set auth persistence:', err);
    });

    if (typeof window !== 'undefined') {
      ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach((evt) => {
        window.addEventListener(evt, () => this.updateActivity(), {
          passive: true,
        });
      });

      // Check for redirect result on app load (only for production)
      if (!this.isLocalhost()) {
        this.handleRedirectResult();
      }
    }
  }

  private isLocalhost(): boolean {
    return (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '[::1]')
    );
  }

  // --- Activity & Session Management --------------------------------------------------
  private updateActivity(): void {
    this._lastActivity.set(Date.now());
  }

  private startSessionManagement(): void {
    if (!this.sessionCheckInterval) {
      this.sessionCheckInterval = setInterval(() => {
        const inactive = Date.now() - this._lastActivity();
        if (inactive > this.SESSION_TIMEOUT_MS) {
          this.toastr.warning(
            'Sessie verlopen door inactiviteit',
            'Automatisch uitgelogd',
          );
          void this.signOut();
        }
      }, 60_000);
    }
    if (!this.tokenRefreshInterval) {
      this.tokenRefreshInterval = setInterval(() => {
        void this.refreshToken();
      }, 50 * 60_000); // ~50m
    }
  }

  private clearSessionTimers(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = undefined;
    }
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = undefined;
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (user) {
        await user.getIdToken(true);
      }
    } catch (err) {
      console.error('Token refresh failed', err);
      this.toastr.error('Kon sessie niet vernieuwen', 'Authenticatie');
      await this.signOut();
    }
  }

  // --- Sign In / Out ------------------------------------------------------------------
  private async handleRedirectResult(): Promise<void> {
    try {
      const result = await getRedirectResult(this.auth);
      if (!result) return; // No redirect happened

      await this.handleAuthResult(result);
    } catch (error: unknown) {
      console.error('Redirect result error:', error);
      const code = (error as { code?: string })?.code;
      switch (code) {
        case 'auth/network-request-failed':
          this.toastr.error('Netwerkfout', 'Geen verbinding');
          break;
        default:
          this.toastr.error(
            'Er ging iets mis. Probeer opnieuw.',
            'Inloggen mislukt',
          );
      }
      if (this.auth.currentUser) await signOut(this.auth);
    }
  }

  async signIn(): Promise<boolean> {
    if (this._isSigningIn()) return false;
    this._isSigningIn.set(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope(this.config.googleAuth.scope);
      provider.setCustomParameters({ prompt: 'select_account' });

      // Use popup for localhost (redirect doesn't work due to browser security)
      // Use redirect for production (better UX, mobile-friendly)
      const isLocal = this.isLocalhost();

      if (isLocal) {
        // POPUP flow for localhost
        const userCredential = await signInWithPopup(this.auth, provider);
        return await this.handleAuthResult(userCredential);
      } else {
        // REDIRECT flow for production
        await signInWithRedirect(this.auth, provider);
        // Result handled in handleRedirectResult() after redirect back
        return true;
      }
    } catch (error: unknown) {
      console.error('Sign-in error:', error);
      const code = (error as { code?: string })?.code;
      switch (code) {
        case 'auth/popup-closed-by-user':
          this.toastr.info('Inloggen geannuleerd', 'Authenticatie');
          break;
        case 'auth/network-request-failed':
          this.toastr.error('Netwerkfout', 'Geen verbinding');
          break;
        case 'auth/popup-blocked':
          this.toastr.error(
            'Pop-up geblokkeerd. Sta pop-ups toe.',
            'Inloggen geblokkeerd',
          );
          break;
        default:
          this.toastr.error(
            'Er ging iets mis. Probeer opnieuw.',
            'Inloggen mislukt',
          );
      }
      if (this.auth.currentUser) await signOut(this.auth);
      return false;
    } finally {
      this._isSigningIn.set(false);
    }
  }

  // Shared logic for handling auth result (used by both popup and redirect)
  private async handleAuthResult(
    result: UserCredential,
  ): Promise<boolean> {
    const email = result.user?.email;
    if (!email) {
      this.toastr.error('Geen e-mailadres gevonden', 'Inloggen mislukt');
      return false;
    }

    const isAllowed = await lastValueFrom(this.checkIfUserIsAllowed(email));
    if (!isAllowed) {
      await signOut(this.auth);
      this.toastr.error(
        'Je hebt geen toegang. Neem contact op met de beheerder.',
        'Toegang geweigerd',
      );
      this.router.navigate(['/forbidden']);
      return false;
    }

    const uid = result.user?.uid;
    if (!uid) {
      this.toastr.error('Geen gebruikers-ID gevonden', 'Inloggen mislukt');
      return false;
    }

    // Optional Calendar authorization
    try {
      this.googleAuthService.getAuthCode(uid);
    } catch (calendarErr) {
      console.warn('Calendar auth code failed', calendarErr);
      this.toastr.warning('Agenda toegang kon niet worden ingesteld', 'Agenda');
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      sessionStorage.setItem(
        'auth_token_expiration',
        (Date.now() + 3_600_000).toString(),
      );
    }

    this.toastr.success(
      `Welkom ${result.user.displayName || email}!`,
      'Succesvol ingelogd',
    );
    this.updateActivity();

    // Navigate to returnUrl from sessionStorage or default
    const returnUrl =
      sessionStorage.getItem('auth_return_url') || '/appointments';
    sessionStorage.removeItem('auth_return_url');
    this.router.navigate([returnUrl]);

    return true;
  }

  async signOut(): Promise<void> {
    if (this._isSigningOut()) return;
    this._isSigningOut.set(true);
    try {
      this.clearSessionTimers();
      sessionStorage.clear();
      localStorage.removeItem('google_oauth_token');
      await signOut(this.auth);
      this.toastr.info('Je bent uitgelogd', 'Tot ziens!');
    } catch (err) {
      console.error('Sign-out error', err);
      this.toastr.error('Fout bij uitloggen', 'Authenticatie');
    } finally {
      this._isSigningOut.set(false);
    }
  }

  // --- Accessors ---------------------------------------------------------------------
  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  async getCurrentUserToken(): Promise<string | null> {
    try {
      return this.auth.currentUser
        ? await this.auth.currentUser.getIdToken()
        : null;
    } catch {
      return null;
    }
  }

  getUserEmail(): string | null {
    return this.auth.currentUser?.email ?? null;
  }

  getUserDisplayName(): string | null {
    return this.auth.currentUser?.displayName ?? null;
  }

  // --- Authorization -----------------------------------------------------------------
  private checkIfUserIsAllowed(email: string) {
    const ref = doc(this.firestore, 'allowed-users', email.toLowerCase());
    return from(getDoc(ref)).pipe(
      map((snap) => snap.exists()),
      catchError((err) => {
        console.error('Allowed user check failed', err);
        this.toastr.error('Kon toegang niet controleren', 'Database fout');
        return of(false);
      }),
    );
  }
}

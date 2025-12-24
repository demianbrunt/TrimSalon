import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  GoogleAuthProvider,
  UserCredential,
  authState,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { from, lastValueFrom, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from '../../app.config.model';
import { FirebaseAuthService } from './firebase-auth.service';
import { SessionService } from './session.service';
import { ToastrService } from './toastr.service';

/**
 * AuthenticationService
 *
 * Beheert volledige authenticatie flow voor de applicatie:
 * - Google Sign-In (popup voor localhost, redirect voor productie)
 * - Autorisatie check via Firestore 'allowed-users' collection
 * - Session management (24u inactivity timeout)
 * - Token refresh (elke 50 minuten)
 * - Activity tracking (mouse, keyboard, scroll events)
 *
 * BELANGRIJK:
 * - Gebruik `isAuthenticated` signal voor UI auth checks
 * - Gebruik `isAllowed$` observable voor route guards
 * - Dev mode (devMode: true) ALLEEN voor development!
 *
 * @example
 * // In component
 * constructor(private auth: AuthenticationService) {}
 *
 * // Check auth status
 * if (this.auth.isAuthenticated()) {
 *   // User is logged in and allowed
 * }
 *
 * // Login
 * await this.auth.signIn();
 *
 * // Logout
 * await this.auth.signOut();
 */
@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private static readonly ADMIN_HISTORY_STORAGE_KEY =
    'trimsalon_admin_ever_logged_in_v1';

  private readonly auth: Auth = inject(Auth);
  private readonly firestore: Firestore = inject(Firestore);
  private readonly config: AppConfig = inject(APP_CONFIG);
  private readonly router: Router = inject(Router);
  private readonly firebaseAuth = inject(FirebaseAuthService);
  private readonly sessionService = inject(SessionService);
  private readonly toastr = inject(ToastrService);

  private readonly _isSigningIn = signal(false);
  private readonly _isSigningOut = signal(false);

  private readonly _adminEverLoggedIn = signal(this.readAdminHistory());
  adminEverLoggedIn = computed(() =>
    this.config.devMode ? true : this._adminEverLoggedIn(),
  );

  isSigningIn = this._isSigningIn.asReadonly();
  isSigningOut = this._isSigningOut.asReadonly();

  private user$ = authState(this.auth);
  user = toSignal(this.user$);

  isAllowed$ = this.user$.pipe(
    switchMap((user) => {
      // DEV MODE: Bypass authentication check
      if (this.config.devMode) {
        this.sessionService.start({ onTimeout: () => this.signOut() });
        return of(true);
      }

      if (!user?.email) {
        this.sessionService.stop();
        return of(false);
      }
      this.sessionService.start({ onTimeout: () => this.signOut() });
      return this.checkIfUserIsAllowed(user.email);
    }),
  );

  isAllowed = toSignal(this.isAllowed$, { initialValue: undefined });
  isAuthenticated = computed(() => {
    // DEV MODE: Always return true if in dev mode
    if (this.config.devMode) {
      return true;
    }
    return !!this.user() && this.isAllowed() === true;
  });

  constructor() {
    // Set persistence to LOCAL for better auth state management
    this.firebaseAuth.setLocalPersistence(this.auth).catch((err) => {
      console.error('Failed to set auth persistence:', err);
    });

    // Check for redirect result on app load (only for production)
    if (typeof window !== 'undefined' && !this.isLocalhost()) {
      this.handleRedirectResult();
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

  // --- Sign In / Out ------------------------------------------------------------------
  private async handleRedirectResult(): Promise<void> {
    try {
      const result = await this.firebaseAuth.getRedirectResult(this.auth);
      if (!result) return; // No redirect happened

      await this.handleAuthResult(result);
    } catch (error: unknown) {
      console.error('Redirect result error:', error);
      const code = (error as { code?: string })?.code;
      switch (code) {
        case 'auth/api-key-expired':
          this.toastr.error(
            'Firebase API key is verlopen. Update je FIREBASE_API_KEY en genereer runtime-config opnieuw.',
            'Inloggen mislukt',
          );
          break;
        case 'auth/network-request-failed':
          this.toastr.error('Netwerkfout', 'Geen verbinding');
          break;
        default:
          this.toastr.error(
            'Er ging iets mis. Probeer opnieuw.',
            'Inloggen mislukt',
          );
      }
      if (this.auth.currentUser) await this.firebaseAuth.signOut(this.auth);
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
        const userCredential = await this.firebaseAuth.signInWithPopup(
          this.auth,
          provider,
        );
        return await this.handleAuthResult(userCredential);
      } else {
        // REDIRECT flow for production
        await this.firebaseAuth.signInWithRedirect(this.auth, provider);
        // Result handled in handleRedirectResult() after redirect back
        return true;
      }
    } catch (error: unknown) {
      console.error('Sign-in error:', error);
      const code = (error as { code?: string })?.code;
      switch (code) {
        case 'auth/api-key-expired':
          this.toastr.error(
            'Firebase API key is verlopen. Update je FIREBASE_API_KEY en genereer runtime-config opnieuw.',
            'Inloggen mislukt',
          );
          break;
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
      if (this.auth.currentUser) await this.firebaseAuth.signOut(this.auth);
      return false;
    } finally {
      this._isSigningIn.set(false);
    }
  }

  // Shared logic for handling auth result (used by both popup and redirect)
  private async handleAuthResult(result: UserCredential): Promise<boolean> {
    const email = result.user?.email;
    if (!email) {
      this.toastr.error('Geen e-mailadres gevonden', 'Inloggen mislukt');
      return false;
    }

    const isAllowed = await lastValueFrom(this.checkIfUserIsAllowed(email));
    if (!isAllowed) {
      await this.firebaseAuth.signOut(this.auth);
      this.toastr.error(
        'Je hebt geen toegang. Neem contact op met de beheerder.',
        'Toegang geweigerd',
      );
      this.router.navigate(['/forbidden']);
      return false;
    }

    this.markAdminHistory();

    const uid = result.user?.uid;
    if (!uid) {
      this.toastr.error('Geen gebruikers-ID gevonden', 'Inloggen mislukt');
      return false;
    }

    // Calendar authorization is now handled separately via sync dialog
    // No automatic popup on login

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
    this.sessionService.updateActivity();

    // Navigate to returnUrl from sessionStorage or default
    const returnUrl =
      sessionStorage.getItem('auth_return_url') || '/appointments';
    sessionStorage.removeItem('auth_return_url');
    this.router.navigate([returnUrl]);

    return true;
  }

  private readAdminHistory(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      return (
        window.localStorage.getItem(
          AuthenticationService.ADMIN_HISTORY_STORAGE_KEY,
        ) === '1'
      );
    } catch {
      return false;
    }
  }

  private markAdminHistory(): void {
    this._adminEverLoggedIn.set(true);

    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(
        AuthenticationService.ADMIN_HISTORY_STORAGE_KEY,
        '1',
      );
    } catch {
      // Ignore storage errors (private mode / blocked storage)
    }
  }

  async signOut(): Promise<void> {
    if (this._isSigningOut()) return;
    this._isSigningOut.set(true);
    try {
      this.sessionService.stop();
      sessionStorage.clear();
      localStorage.removeItem('google_oauth_token');
      await this.firebaseAuth.signOut(this.auth);
      this.toastr.info('Je bent uitgelogd', 'Tot ziens!');
      // Navigate to signout page after successful logout
      await this.router.navigate(['/signedout']);
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

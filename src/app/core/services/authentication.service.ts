import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  GoogleAuthProvider,
  authState,
  signInWithPopup,
  signOut,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { from, lastValueFrom, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from '../../app.config.model';
import { GoogleAuthService } from './google-auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private readonly auth: Auth = inject(Auth);
  private readonly firestore: Firestore = inject(Firestore);
  private readonly config: AppConfig = inject(APP_CONFIG);
  private readonly router: Router = inject(Router);
  private readonly googleAuthService = inject(GoogleAuthService);

  private readonly _isSigningIn = signal(false);
  isSigningIn = this._isSigningIn.asReadonly();

  private user$ = authState(this.auth);
  user = toSignal(this.user$);

  isAllowed$ = this.user$.pipe(
    switchMap((user) => {
      if (!user || !user.email) {
        return of(false);
      }
      return this.checkIfUserIsAllowed(user.email);
    }),
  );

  isAllowed = toSignal(this.isAllowed$, { initialValue: undefined });
  isAuthenticated = computed(() => !!this.user() && this.isAllowed() === true);

  async signIn(): Promise<boolean> {
    this._isSigningIn.set(true);
    const provider = new GoogleAuthProvider();
    provider.addScope(this.config.googleAuth.scope);

    try {
      const userCredential = await signInWithPopup(this.auth, provider);
      if (!userCredential?.user?.email) {
        throw new Error('Sign-in failed: No user email found.');
      }

      const isAllowed = await lastValueFrom(
        this.checkIfUserIsAllowed(userCredential.user.email),
      );

      if (!isAllowed) {
        await signOut(this.auth);
        this.router.navigate(['/forbidden']);
        throw new Error('User is not allowed.');
      }

      if (!userCredential.user.uid) {
        throw new Error('Sign-in failed: No user uid found.');
      }
      this.googleAuthService.getAuthCode(userCredential.user.uid);

      const credential =
        GoogleAuthProvider.credentialFromResult(userCredential);
      if (credential?.accessToken) {
        localStorage.setItem('google_oauth_token', credential.accessToken);
      }

      return true;
    } catch (error) {
      console.error('Sign-in error:', error);
      // Ensure user is signed out in case of any error during the process
      if (this.auth.currentUser) {
        await signOut(this.auth);
      }
      return false;
    } finally {
      this._isSigningIn.set(false);
    }
  }

  signOut(): void {
    signOut(this.auth);
  }

  getCurrentUserId(): string | null {
    return this.auth.currentUser ? this.auth.currentUser.uid : null;
  }

  private checkIfUserIsAllowed(email: string) {
    const userDocRef = doc(
      this.firestore,
      'allowed-users',
      email.toLowerCase(),
    );
    return from(getDoc(userDocRef)).pipe(
      map((documentSnapshot) => documentSnapshot.exists()),
      catchError((err) => {
        console.error('Error checking for allowed user in Firestore', err);
        return of(false);
      }),
    );
  }
}

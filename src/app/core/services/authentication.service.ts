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
import { firstValueFrom, from, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private readonly auth: Auth = inject(Auth);
  private readonly firestore: Firestore = inject(Firestore);

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

  signIn(): Promise<boolean> {
    this._isSigningIn.set(true);
    const provider = new GoogleAuthProvider();
    return firstValueFrom(
      from(signInWithPopup(this.auth, provider)).pipe(
        switchMap((userCredential) => {
          if (!userCredential?.user?.email) {
            return of(false);
          }
          return this.checkIfUserIsAllowed(userCredential.user.email);
        }),
        catchError((err) => {
          console.error('Popup sign-in error', err);
          return of(false);
        }),
        finalize(() => this._isSigningIn.set(false)),
      ),
    );
  }

  signOut(): void {
    signOut(this.auth);
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

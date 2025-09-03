import { Injectable, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  User,
  authState,
  signInWithPopup,
  signOut,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private readonly auth: Auth = inject(Auth);
  private readonly router: Router = inject(Router);
  private readonly firestore: Firestore = inject(Firestore);

  readonly user$ = authState(this.auth);
  readonly isLoggedIn$: Observable<boolean>;
  readonly isAllowedUser$: Observable<boolean>;

  constructor() {
    this.isLoggedIn$ = this.user$.pipe(map((user) => !!user));
    this.isAllowedUser$ = this.user$.pipe(
      switchMap((user) => {
        if (!user?.email) {
          return of(false);
        }
        return this.checkIfUserIsAllowed(user.email);
      }),
      shareReplay(1),
    );
  }

  loginWithGoogle(): Observable<User | null> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(({ user }) => {
        if (!user.email) {
          this.signOutUser().subscribe(() =>
            this.router.navigate(['/forbidden']),
          );
          return of(null);
        }
        return this.checkIfUserIsAllowed(user.email).pipe(
          map((isAllowed) => {
            if (isAllowed) {
              return user;
            }
            this.signOutUser().subscribe(() =>
              this.router.navigate(['/forbidden']),
            );
            return null;
          }),
        );
      }),
      catchError((err) => {
        console.error('Popup sign-in error', err);
        return of(null);
      }),
    );
  }

  logout(): Observable<boolean> {
    return this.signOutUser().pipe(
      switchMap(() => this.router.navigate(['/'])),
      take(1),
    );
  }

  private checkIfUserIsAllowed(email: string): Observable<boolean> {
    const allowedUsersCollection = collection(this.firestore, 'allowed-users');
    const q = query(
      allowedUsersCollection,
      where('email', '==', email.toLowerCase()),
    );
    return from(getDocs(q)).pipe(
      map((querySnapshot) => !querySnapshot.empty),
      catchError((err) => {
        console.error('Error checking for allowed user in Firestore', err);
        return of(false);
      }),
    );
  }

  private signOutUser(): Observable<void> {
    return from(signOut(this.auth));
  }
}

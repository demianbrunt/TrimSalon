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
  RemoteConfig,
  fetchAndActivate,
  getString,
} from '@angular/fire/remote-config';
import { Router } from '@angular/router';
import { Observable, combineLatest, from, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private readonly auth: Auth = inject(Auth);
  private readonly router: Router = inject(Router);
  private readonly remoteConfig: RemoteConfig = inject(RemoteConfig);

  private readonly allowedEmailsCache$: Observable<string[]>;

  readonly user$ = authState(this.auth);
  readonly isLoggedIn$: Observable<boolean>;
  readonly isAllowedUser$: Observable<boolean>;

  constructor() {
    this.allowedEmailsCache$ = from(fetchAndActivate(this.remoteConfig)).pipe(
      map(() => getString(this.remoteConfig, 'allowed_emails')),
      map((emailsString) =>
        emailsString.split(',').map((e) => e.trim().toLowerCase()),
      ),
      catchError((err) => {
        console.error('Failed to load remote config for allowed emails', err);
        return of([]);
      }),
      shareReplay(1),
    );

    this.isLoggedIn$ = this.user$.pipe(map((user) => !!user));
    this.isAllowedUser$ = combineLatest([
      this.user$,
      this.allowedEmailsCache$,
    ]).pipe(
      map(([user, allowedEmails]) => {
        if (!user || !user.email) {
          return false;
        }
        return allowedEmails.includes(user.email.toLowerCase());
      }),
      shareReplay(1),
    );
  }

  loginWithGoogle(): Observable<User | null> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(({ user }) =>
        this.allowedEmailsCache$.pipe(
          map((allowedEmails) => {
            if (
              user.email &&
              allowedEmails.includes(user.email.toLowerCase())
            ) {
              return user;
            }
            this.signOutUser().subscribe(() =>
              this.router.navigate(['/forbidden']),
            );
            return null;
          }),
        ),
      ),
      catchError((err) => {
        console.error('Popup sign-in error', err);
        return of(null);
      }),
    );
  }

  signOutUser(): Observable<void> {
    return from(signOut(this.auth));
  }

  logout(): Observable<boolean> {
    return this.signOutUser().pipe(
      switchMap(() => this.router.navigate(['/'])),
      take(1),
    );
  }

  checkUserIsAllowed(): Observable<boolean> {
    return this.isAllowedUser$;
  }
}

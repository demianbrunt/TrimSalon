import {
  EnvironmentInjector,
  Injectable,
  inject,
  runInInjectionContext,
} from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  UserCredential,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from '@angular/fire/auth';
import {
  browserLocalPersistence as firebaseBrowserLocalPersistence,
  setPersistence as firebaseSetPersistence,
} from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private readonly environmentInjector = inject(EnvironmentInjector);

  private inContext<T>(fn: () => T): T {
    return runInInjectionContext(this.environmentInjector, fn);
  }

  setLocalPersistence(auth: Auth): Promise<void> {
    return firebaseSetPersistence(auth, firebaseBrowserLocalPersistence);
  }

  getRedirectResult(auth: Auth): Promise<UserCredential | null> {
    return this.inContext(() => getRedirectResult(auth));
  }

  signInWithPopup(
    auth: Auth,
    provider: GoogleAuthProvider,
  ): Promise<UserCredential> {
    return this.inContext(() => signInWithPopup(auth, provider));
  }

  signInWithRedirect(auth: Auth, provider: GoogleAuthProvider): Promise<void> {
    return this.inContext(() => signInWithRedirect(auth, provider));
  }

  signOut(auth: Auth): Promise<void> {
    return this.inContext(() => signOut(auth));
  }
}

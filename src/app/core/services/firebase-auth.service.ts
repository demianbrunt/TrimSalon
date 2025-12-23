import { Injectable } from '@angular/core';
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
  setLocalPersistence(auth: Auth): Promise<void> {
    return firebaseSetPersistence(auth, firebaseBrowserLocalPersistence);
  }

  getRedirectResult(auth: Auth): Promise<UserCredential | null> {
    return getRedirectResult(auth);
  }

  signInWithPopup(
    auth: Auth,
    provider: GoogleAuthProvider,
  ): Promise<UserCredential> {
    return signInWithPopup(auth, provider);
  }

  signInWithRedirect(auth: Auth, provider: GoogleAuthProvider): Promise<void> {
    return signInWithRedirect(auth, provider);
  }

  signOut(auth: Auth): Promise<void> {
    return signOut(auth);
  }
}

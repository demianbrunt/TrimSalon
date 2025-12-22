import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { BehaviorSubject, from, map, Subject } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../app.config.model';
import { isMockGoogleEnabled } from '../utils/dev-flags';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any;

interface CodeResponse {
  code: string;
}

interface CodeErrorResponse {
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private readonly config: AppConfig = inject(APP_CONFIG);
  private readonly functions: Functions = inject(Functions);
  private userId: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private codeClient: any;

  private readonly _gapiInitialized = new BehaviorSubject<boolean>(false);
  gapiInitialized$ = this._gapiInitialized.asObservable();

  private readonly _authorizationComplete = new Subject<void>();
  authorizationComplete$ = this._authorizationComplete.asObservable();

  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      if (isMockGoogleEnabled()) {
        // Dev-only: allow the app to proceed without loading GIS.
        this._gapiInitialized.next(true);
        return;
      }

      this.ensureGisLoaded().then(() => {
        this.initializeCodeClient();
      });
    }
  }

  private ensureGisLoaded(): Promise<void> {
    return new Promise((resolve) => {
      const checkGoogle = () => {
        if (typeof google !== 'undefined') {
          resolve();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();
    });
  }

  private initializeCodeClient(): void {
    if (isMockGoogleEnabled()) {
      this._gapiInitialized.next(true);
      return;
    }

    this.codeClient = google.accounts.oauth2.initCodeClient({
      client_id: this.config.googleAuth.clientId,
      scope: this.config.googleAuth.scope,
      callback: (response: CodeResponse) => {
        if (response.code) {
          this.sendCodeToBackend(response.code);
        }
      },
      error_callback: (error: CodeErrorResponse) => {
        console.error('Error getting auth code', error);
      },
    });
    this._gapiInitialized.next(true);
  }

  public getAuthCode(userId: string): void {
    this.userId = userId;

    if (isMockGoogleEnabled()) {
      // Dev-only: simulate successful authorization.
      setTimeout(() => this._authorizationComplete.next(), 0);
      return;
    }

    if (!this.codeClient) {
      console.error('Google Identity Services not initialized');
      return;
    }

    this.codeClient.requestCode();
  }

  private sendCodeToBackend(code: string): void {
    if (isMockGoogleEnabled()) {
      // Dev-only: no backend token exchange.
      this._authorizationComplete.next();
      return;
    }

    if (!this.userId) {
      console.error('User not logged in');
      return;
    }
    const callable = httpsCallable(this.functions, 'exchangeAuthCode');
    from(callable({ code, userId: this.userId }))
      .pipe(map((result) => result.data))
      .subscribe({
        next: () => {
          // Emit event to notify that authorization is complete
          this._authorizationComplete.next();
        },
        error: (err) => console.error('Error exchanging code for tokens', err),
      });
  }
}

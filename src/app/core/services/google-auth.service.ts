import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { BehaviorSubject, from, map, Subject } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../app.config.model';

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
    this.codeClient.requestCode();
  }

  private sendCodeToBackend(code: string): void {
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

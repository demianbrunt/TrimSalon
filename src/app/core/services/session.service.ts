import { Injectable, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';

import { ToastrService } from './toastr.service';

export interface SessionOptions {
  sessionTimeoutMs?: number;
  tokenRefreshIntervalMs?: number;
  onTimeout: () => void | Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly auth: Auth = inject(Auth);
  private readonly toastr = inject(ToastrService);

  private readonly _lastActivity = signal<number>(Date.now());
  readonly lastActivity = this._lastActivity.asReadonly();

  private readonly defaultSessionTimeoutMs = 24 * 60 * 60 * 1000; // 24h
  private readonly defaultTokenRefreshIntervalMs = 50 * 60 * 1000; // ~50m

  private sessionCheckInterval?: ReturnType<typeof setInterval>;
  private tokenRefreshInterval?: ReturnType<typeof setInterval>;

  private activityListenerAttached = false;

  constructor() {
    this.attachActivityListeners();
  }

  updateActivity(): void {
    this._lastActivity.set(Date.now());
  }

  start(options: SessionOptions): void {
    this.attachActivityListeners();

    const sessionTimeoutMs =
      options.sessionTimeoutMs ?? this.defaultSessionTimeoutMs;

    const tokenRefreshIntervalMs =
      options.tokenRefreshIntervalMs ?? this.defaultTokenRefreshIntervalMs;

    if (!this.sessionCheckInterval) {
      this.sessionCheckInterval = setInterval(() => {
        const inactive = Date.now() - this._lastActivity();
        if (inactive > sessionTimeoutMs) {
          this.toastr.warning(
            'Sessie verlopen door inactiviteit',
            'Automatisch uitgelogd',
          );
          void Promise.resolve(options.onTimeout());
        }
      }, 60_000);
    }

    if (!this.tokenRefreshInterval) {
      this.tokenRefreshInterval = setInterval(() => {
        void this.refreshToken(options.onTimeout);
      }, tokenRefreshIntervalMs);
    }
  }

  stop(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = undefined;
    }

    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = undefined;
    }
  }

  private attachActivityListeners(): void {
    if (this.activityListenerAttached) return;

    if (typeof window === 'undefined') {
      return;
    }

    this.activityListenerAttached = true;

    const handler = () => this.updateActivity();

    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach((evt) => {
      window.addEventListener(evt, handler, { passive: true });
    });
  }

  private async refreshToken(onRefreshFailure: () => void | Promise<void>) {
    try {
      const user = this.auth.currentUser;
      if (user) {
        await user.getIdToken(true);
      }
    } catch (err) {
      console.error('Token refresh failed', err);
      this.toastr.error('Kon sessie niet vernieuwen', 'Authenticatie');
      await Promise.resolve(onRefreshFailure());
    }
  }
}

import { ErrorHandler, Injectable, inject, isDevMode } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { ToastrService } from './toastr.service';

/**
 * Global Error Handler
 *
 * Catches all unhandled errors in the application.
 * - In development: logs full error to console
 * - In production: logs minimal info, could be extended to send to error tracking service
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private readonly toastr = inject(ToastrService, { optional: true });

  private readonly isKarma =
    typeof window !== 'undefined' &&
    !!(window as unknown as { __karma__?: unknown }).__karma__;

  private lastForcedReloadAtMs = 0;

  handleError(error: unknown): void {
    // Extract error details
    const errorMessage = this.extractErrorMessage(error);
    const stack = error instanceof Error ? error.stack : undefined;

    // If App Check is enforced and an older cached client (or a bot) hits the app,
    // Firebase can reject requests without a token. For real users this often means
    // their PWA is still running an old cached build. Try to self-heal by forcing
    // a SW update + reload.
    if (!this.isKarma && this.isLikelyAppCheckError(errorMessage)) {
      if (this.isRecaptchaAppCheckError(errorMessage)) {
        this.toastr?.error(
          'reCAPTCHA mislukt. Controleer je Firebase App Check reCAPTCHA site key en domein-instellingen.',
          'Beveiligingscheck mislukt',
        );
      } else {
        this.tryForceReloadForAppCheck();
      }
    }

    if (isDevMode()) {
      // Development: full error logging
      console.error('=== UNHANDLED ERROR ===');
      console.error('Message:', errorMessage);
      if (stack) {
        console.error('Stack:', stack);
      }
      console.error('Full error:', error);
    } else {
      // Production: minimal logging
      // In a real app, you would send this to an error tracking service like Sentry
      console.error(`Error: ${errorMessage}`);

      // TODO: Send to error tracking service
      // this.sendToErrorTracking(errorMessage, stack);
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'Unknown error occurred';
  }

  private isLikelyAppCheckError(message: string): boolean {
    const m = message.toLowerCase();
    return (
      m.includes('app check') ||
      m.includes('appcheck') ||
      m.includes('app-check') ||
      m.includes('app-check-token') ||
      (m.includes('missing') && m.includes('app') && m.includes('check'))
    );
  }

  private isRecaptchaAppCheckError(message: string): boolean {
    const m = message.toLowerCase();
    return m.includes('recaptcha') || m.includes('appcheck/recaptcha-error');
  }

  private tryForceReloadForAppCheck(): void {
    const now = Date.now();
    const minIntervalMs = 60_000;
    if (now - this.lastForcedReloadAtMs < minIntervalMs) {
      return;
    }
    this.lastForcedReloadAtMs = now;

    this.toastr?.warning(
      'Je app is verouderd. We laden de nieuwste versie…',
      'Update nodig',
    );

    const doReload = () => {
      if (typeof document !== 'undefined') {
        document.location.reload();
      }
    };

    const sw = this.swUpdate;
    if (!sw || !sw.isEnabled) {
      doReload();
      return;
    }

    sw.checkForUpdate()
      .then(() => sw.activateUpdate())
      .finally(doReload);
  }
}

import { InjectionToken } from '@angular/core';

export interface AppConfig {
  googleAuth: {
    clientId: string;
    scope: string;
  };
  reCaptchaSiteKey?: string;
  /**
   * App Check provider backing the site key.
   * - 'v3': reCAPTCHA v3 (classic)
   * - 'enterprise': reCAPTCHA Enterprise
   */
  reCaptchaProvider?: 'v3' | 'enterprise';
  devMode?: boolean; // Development mode flag to bypass authentication
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

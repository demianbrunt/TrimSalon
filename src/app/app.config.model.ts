import { InjectionToken } from '@angular/core';

export interface AppConfig {
  googleAuth: {
    clientId: string;
    scope: string;
  };
  devMode?: boolean; // Development mode flag to bypass authentication
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

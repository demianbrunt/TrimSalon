import { InjectionToken } from '@angular/core';

export interface AppConfig {
  googleAuth: {
    clientId: string;
    scope: string;
  };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

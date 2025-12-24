import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import localeNl from '@angular/common/locales/nl';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  ErrorHandler,
  inject,
  isDevMode,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { ConfirmationDialogService } from './core/services/confirmation-dialog.service';
import { GlobalErrorHandler } from './core/services/global-error-handler.service';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { provideAnimations } from '@angular/platform-browser/animations';

import Aura from '@primeuix/themes/aura';

import { provideServiceWorker } from '@angular/service-worker';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { DialogService } from 'primeng/dynamicdialog';
import { APP_CONFIG, AppConfig } from './app.config.model';
import { routes } from './app.routes';
import { GoogleAuthService } from './core/services/google-auth.service';
import { RuntimeConfigService } from './core/services/runtime-config.service';

const DEFAULT_APP_CONFIG: AppConfig = {
  googleAuth: {
    clientId: '',
    scope: 'https://www.googleapis.com/auth/calendar',
  },
  // DEV MODE: Disabled - always require proper authentication
  devMode: false,
};

registerLocaleData(localeNl);

export const commonProviders = [
  provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes),
  { provide: ErrorHandler, useClass: GlobalErrorHandler },
  {
    provide: APP_INITIALIZER,
    multi: true,
    useFactory: () => {
      const runtimeConfig = inject(RuntimeConfigService);
      return () => runtimeConfig.load();
    },
  },
  providePrimeNG({
    ripple: true,
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: false,
        cssLayer: {
          name: 'primeng',
          order: 'tailwind-base, primeng, tailwind-utilities',
        },
      },
    },
  }),
  provideFirebaseApp(() => {
    const runtimeConfig = inject(RuntimeConfigService);
    return initializeApp(runtimeConfig.getFirebaseConfigOrThrow());
  }),
  provideAuth(() => {
    const auth = getAuth();
    return auth;
  }),
  provideFirestore(() => {
    const firestore = getFirestore();
    return firestore;
  }),
  provideFunctions(() => {
    const functions = getFunctions(undefined, 'europe-west1');
    return functions;
  }),
  provideHttpClient(withFetch()),
  provideAnimations(),
  {
    provide: APP_CONFIG,
    useFactory: (): AppConfig => {
      const runtimeConfig = inject(RuntimeConfigService);
      const app = runtimeConfig.getAppConfigOrDefault();
      return {
        googleAuth: {
          clientId:
            app.googleAuth.clientId || DEFAULT_APP_CONFIG.googleAuth.clientId,
          scope: app.googleAuth.scope || DEFAULT_APP_CONFIG.googleAuth.scope,
        },
        devMode: app.devMode ?? DEFAULT_APP_CONFIG.devMode,
      };
    },
  },
  { provide: LOCALE_ID, useValue: 'nl' },
];

export const browserProviders = [
  MessageService,
  ConfirmationService,
  GoogleAuthService,
  DialogService,
  ConfirmationDialogService,
];

export const appConfig: ApplicationConfig = {
  providers: [
    ...commonProviders,
    ...browserProviders,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:5000',
    }),
  ],
};

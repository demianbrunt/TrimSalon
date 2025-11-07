import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import localeNl from '@angular/common/locales/nl';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { ConfirmationDialogService } from './core/services/confirmation-dialog.service';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import {
  getRemoteConfig,
  provideRemoteConfig,
} from '@angular/fire/remote-config';
import { provideAnimations } from '@angular/platform-browser/animations';

import { getFunctions, provideFunctions } from '@angular/fire/functions';

import Aura from '@primeuix/themes/aura';

import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { DialogService } from 'primeng/dynamicdialog';
import { APP_CONFIG, AppConfig } from './app.config.model';
import { routes } from './app.routes';
import { GoogleAuthService } from './core/services/google-auth.service';

const firebaseConfig = {
  apiKey: 'AIzaSyApnb2vrrWaiewHEMzn73LbyPoBaPt4FUQ',
  authDomain: 'trim.demianbrunt.nl',
  projectId: 'trimsalon-9b823',
  storageBucket: 'trimsalon-9b823.firebasestorage.app',
  messagingSenderId: '495690826928',
  appId: '1:495690826928:web:b787b6ce8d5dce8d09e775',
  measurementId: 'G-KJC34PCNNY',
};

const appSettings: AppConfig = {
  googleAuth: {
    clientId:
      '495690826928-k7jfduihumi360hkiitfupla794qpe99.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/calendar',
  },
  // DEV MODE: Disabled - always require proper authentication
  devMode: false,
};

registerLocaleData(localeNl);

export const commonProviders = [
  provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes),
  providePrimeNG({
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
  provideFirebaseApp(() => initializeApp(firebaseConfig)),
  provideAuth(() => getAuth()),
  provideRemoteConfig(() => getRemoteConfig()),
  provideFirestore(() => getFirestore()),
  provideFunctions(() => getFunctions()),
  provideHttpClient(withFetch()),
  provideAnimations(),
  { provide: APP_CONFIG, useValue: appSettings },
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
  providers: [...commonProviders, ...browserProviders],
};

import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import localeNl from '@angular/common/locales/nl';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import {
  getRemoteConfig,
  provideRemoteConfig,
} from '@angular/fire/remote-config';

import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { APP_CONFIG, AppConfig } from './app.config.model';
import { routes } from './app.routes';
import { GoogleAuthService } from './core/services/google-auth.service';

import Aura from '@primeuix/themes/aura';

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
      },
    },
  }),
  provideFirebaseApp(() => initializeApp(firebaseConfig)),
  provideAuth(() => getAuth()),
  provideRemoteConfig(() => getRemoteConfig()),
  provideFirestore(() => getFirestore()),
  provideFunctions(() => getFunctions()),
  provideHttpClient(withFetch()),
  { provide: APP_CONFIG, useValue: appSettings },
  { provide: LOCALE_ID, useValue: 'nl' },
];

export const browserProviders = [
  MessageService,
  ConfirmationService,
  GoogleAuthService,
];

export const appConfig: ApplicationConfig = {
  providers: [...commonProviders, ...browserProviders],
};

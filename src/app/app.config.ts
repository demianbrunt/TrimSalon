import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { routes } from './app.routes';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import {
  getRemoteConfig,
  provideRemoteConfig,
} from '@angular/fire/remote-config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationDialogService } from './core/services/confirmation-dialog.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
        },
      },
    }),
    provideFirebaseApp(() =>
      initializeApp({
        apiKey: 'AIzaSyApnb2vrrWaiewHEMzn73LbyPoBaPt4FUQ',
        authDomain: 'trim.demianbrunt.nl',
        projectId: 'trimsalon-9b823',
        storageBucket: 'trimsalon-9b823.firebasestorage.app',
        messagingSenderId: '495690826928',
        appId: '1:495690826928:web:b787b6ce8d5dce8d09e775',
        measurementId: 'G-KJC34PCNNY',
      }),
    ),
    provideAuth(() => getAuth()),
    provideRemoteConfig(() => getRemoteConfig()),
    provideFirestore(() => getFirestore()),
    MessageService,
    ConfirmationService,
    ConfirmationDialogService,
  ],
};

import { ApplicationConfig } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { ConfirmationService, MessageService } from 'primeng/api';
import { commonProviders } from './app.config';
import { serverRoutes } from './app.routes.server';
import { GoogleAuthService } from './core/services/google-auth.service';

class MockConfirmationService {
  confirm() {
    return;
  }
}

class MockMessageService {
  add() {
    return;
  }
  addAll() {
    return;
  }
  clear() {
    return;
  }
}

class MockGoogleAuthService {}

export const config: ApplicationConfig = {
  providers: [
    ...commonProviders,
    provideServerRendering(withRoutes(serverRoutes)),
    provideNoopAnimations(),
    { provide: ConfirmationService, useClass: MockConfirmationService },
    { provide: MessageService, useClass: MockMessageService },
    { provide: GoogleAuthService, useClass: MockGoogleAuthService },
  ],
};

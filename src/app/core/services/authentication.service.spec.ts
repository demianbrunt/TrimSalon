import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { AuthenticationService } from './authentication.service';
import { GoogleAuthService } from './google-auth.service';
import { ToastrService } from './toastr.service';
import { APP_CONFIG } from '../../app.config.model';
import {
  MockAuth,
  createMockFirestore,
} from '../../../test-helpers/firebase-mocks';
import { MockRouter } from '../../../test-helpers/angular-mocks';

describe('AuthenticationService', () => {
  const mockConfig = {
    googleAuth: {
      clientId: 'test-client-id',
      scope: 'https://www.googleapis.com/auth/calendar',
    },
    devMode: false,
  };

  beforeEach(() => {
    const mockAuth = new MockAuth();
    const mockFirestore = createMockFirestore();
    const router = new MockRouter();
    const mockGoogleAuthService = jasmine.createSpy('GoogleAuthService');
    const mockToastr = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning',
      'info',
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthenticationService,
        { provide: Auth, useValue: mockAuth },
        { provide: Firestore, useValue: mockFirestore },
        { provide: Router, useValue: router },
        { provide: GoogleAuthService, useValue: mockGoogleAuthService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: APP_CONFIG, useValue: mockConfig },
      ],
    });
  });

  it('should be defined', () => {
    expect(AuthenticationService).toBeDefined();
  });

  // Note: Testing the authentication service properly requires:
  // 1. Mocking Firebase Auth state changes
  // 2. Mocking Firestore queries for allowed users
  // 3. Complex async flow testing
  //
  // These tests are better suited for E2E testing or require
  // Firebase Emulator. The service is tested indirectly through
  // integration and E2E tests.
});

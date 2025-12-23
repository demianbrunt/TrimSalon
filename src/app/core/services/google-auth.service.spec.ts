import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Functions } from '@angular/fire/functions';
import { MockFunctions } from '../../../test-helpers/firebase-mocks';
import { APP_CONFIG } from '../../app.config.model';
import { GoogleAuthService } from './google-auth.service';

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  let mockFunctions: MockFunctions;

  const mockConfig = {
    googleAuth: {
      clientId: 'test-client-id',
      scope: 'https://www.googleapis.com/auth/calendar',
    },
    devMode: false,
  };

  beforeEach(() => {
    mockFunctions = new MockFunctions();

    TestBed.configureTestingModule({
      providers: [
        GoogleAuthService,
        { provide: Functions, useValue: mockFunctions },
        { provide: APP_CONFIG, useValue: mockConfig },
        { provide: PLATFORM_ID, useValue: 'server' }, // Run as SSR to avoid browser-specific code
      ],
    });

    service = TestBed.inject(GoogleAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have gapiInitialized$ observable', (done) => {
    service.gapiInitialized$.subscribe((initialized) => {
      expect(typeof initialized).toBe('boolean');
      done();
    });
  });

  // Note: Browser-specific tests (getAuthCode, etc.) are difficult to test
  // in a headless environment without mocking the global google object
  // These would be better suited for E2E tests
});

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
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
  let service: AuthenticationService;
  let mockAuth: MockAuth;
  let mockFirestore: any;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockGoogleAuthService: jasmine.SpyObj<GoogleAuthService>;
  let mockToastr: jasmine.SpyObj<ToastrService>;

  const mockConfig = {
    googleAuth: {
      clientId: 'test-client-id',
      scope: 'https://www.googleapis.com/auth/calendar',
    },
    devMode: false,
  };

  beforeEach(() => {
    mockAuth = new MockAuth();
    mockFirestore = createMockFirestore();
    const router = new MockRouter();

    mockGoogleAuthService = jasmine.createSpyObj('GoogleAuthService', [
      'getAuthCode',
    ]);
    mockToastr = jasmine.createSpyObj('ToastrService', [
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

    // Mock authState
    spyOn<any>(authState as any, 'call').and.returnValue(of(null));

    service = TestBed.inject(AuthenticationService);
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isAuthenticated', () => {
    it('should return false when user is not authenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true in dev mode', () => {
      TestBed.resetTestingModule();
      const devConfig = { ...mockConfig, devMode: true };

      TestBed.configureTestingModule({
        providers: [
          AuthenticationService,
          { provide: Auth, useValue: mockAuth },
          { provide: Firestore, useValue: mockFirestore },
          { provide: Router, useValue: new MockRouter() },
          { provide: GoogleAuthService, useValue: mockGoogleAuthService },
          { provide: ToastrService, useValue: mockToastr },
          { provide: APP_CONFIG, useValue: devConfig },
        ],
      });

      const devService = TestBed.inject(AuthenticationService);
      expect(devService.isAuthenticated()).toBe(true);
    });
  });

  describe('signOut', () => {
    it('should sign out user and navigate to signout page', fakeAsync(() => {
      mockAuth.signOut.and.returnValue(Promise.resolve());

      service.signOut();
      tick();

      expect(mockAuth.signOut).toHaveBeenCalled();
      expect(mockToastr.info).toHaveBeenCalledWith(
        'Je bent uitgelogd',
        'Tot ziens!',
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/signedout']);
    }));

    it('should handle sign out errors', fakeAsync(() => {
      const error = new Error('Sign out failed');
      mockAuth.signOut.and.returnValue(Promise.reject(error));

      service.signOut();
      tick();

      expect(mockToastr.error).toHaveBeenCalledWith(
        'Fout bij uitloggen',
        'Authenticatie',
      );
    }));

    it('should clear session storage on sign out', fakeAsync(() => {
      mockAuth.signOut.and.returnValue(Promise.resolve());
      spyOn(sessionStorage, 'clear');
      spyOn(localStorage, 'removeItem');

      service.signOut();
      tick();

      expect(sessionStorage.clear).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'google_oauth_token',
      );
    }));
  });

  describe('getCurrentUserId', () => {
    it('should return null when no user is logged in', () => {
      mockAuth.currentUser = null;
      expect(service.getCurrentUserId()).toBeNull();
    });

    it('should return user id when user is logged in', () => {
      mockAuth.currentUser = { uid: 'test-uid' };
      expect(service.getCurrentUserId()).toBe('test-uid');
    });
  });

  describe('getUserEmail', () => {
    it('should return null when no user is logged in', () => {
      mockAuth.currentUser = null;
      expect(service.getUserEmail()).toBeNull();
    });

    it('should return user email when user is logged in', () => {
      mockAuth.currentUser = { email: 'test@example.com' };
      expect(service.getUserEmail()).toBe('test@example.com');
    });
  });

  describe('getUserDisplayName', () => {
    it('should return null when no user is logged in', () => {
      mockAuth.currentUser = null;
      expect(service.getUserDisplayName()).toBeNull();
    });

    it('should return user display name when user is logged in', () => {
      mockAuth.currentUser = { displayName: 'Test User' };
      expect(service.getUserDisplayName()).toBe('Test User');
    });
  });

  describe('getCurrentUserToken', () => {
    it('should return null when no user is logged in', async () => {
      mockAuth.currentUser = null;
      const token = await service.getCurrentUserToken();
      expect(token).toBeNull();
    });

    it('should return token when user is logged in', async () => {
      mockAuth.currentUser = {
        getIdToken: jasmine
          .createSpy('getIdToken')
          .and.returnValue(Promise.resolve('test-token')),
      };
      const token = await service.getCurrentUserToken();
      expect(token).toBe('test-token');
    });

    it('should return null on token retrieval error', async () => {
      mockAuth.currentUser = {
        getIdToken: jasmine
          .createSpy('getIdToken')
          .and.returnValue(Promise.reject(new Error())),
      };
      const token = await service.getCurrentUserToken();
      expect(token).toBeNull();
    });
  });

  describe('isSigningIn signal', () => {
    it('should be false initially', () => {
      expect(service.isSigningIn()).toBe(false);
    });
  });

  describe('isSigningOut signal', () => {
    it('should be false initially', () => {
      expect(service.isSigningOut()).toBe(false);
    });
  });
});

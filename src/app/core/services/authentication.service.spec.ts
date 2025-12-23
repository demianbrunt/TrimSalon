import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { MockRouter } from '../../../test-helpers/angular-mocks';
import { createMockFirestore } from '../../../test-helpers/firebase-mocks';
import { APP_CONFIG } from '../../app.config.model';
import { AuthenticationService } from './authentication.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { SessionService } from './session.service';
import { ToastrService } from './toastr.service';

describe('AuthenticationService', () => {
  const mockConfig = {
    googleAuth: {
      clientId: 'test-client-id',
      scope: 'https://www.googleapis.com/auth/calendar',
    },
    devMode: false,
  };

  let service: AuthenticationService;
  let router: MockRouter;
  let firebaseAuth: jasmine.SpyObj<FirebaseAuthService>;
  let sessionService: jasmine.SpyObj<SessionService>;
  let toastr: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    const mockAuth = {
      currentUser: null,
    };
    const mockFirestore = createMockFirestore();

    router = new MockRouter();

    firebaseAuth = jasmine.createSpyObj<FirebaseAuthService>(
      'FirebaseAuthService',
      [
        'setLocalPersistence',
        'getRedirectResult',
        'signInWithPopup',
        'signInWithRedirect',
        'signOut',
      ],
    );
    firebaseAuth.setLocalPersistence.and.resolveTo();
    firebaseAuth.signOut.and.resolveTo();

    sessionService = jasmine.createSpyObj<SessionService>('SessionService', [
      'start',
      'stop',
      'updateActivity',
    ]);

    toastr = jasmine.createSpyObj('ToastrService', [
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
        { provide: FirebaseAuthService, useValue: firebaseAuth },
        { provide: SessionService, useValue: sessionService },
        { provide: ToastrService, useValue: toastr },
        { provide: APP_CONFIG, useValue: mockConfig },
      ],
    });

    service = TestBed.inject(AuthenticationService);
  });

  it('initializes auth persistence', () => {
    expect(firebaseAuth.setLocalPersistence).toHaveBeenCalled();
  });

  it('signOut stops session and navigates to signedout', async () => {
    await service.signOut();

    expect(sessionService.stop).toHaveBeenCalled();
    expect(firebaseAuth.signOut).toHaveBeenCalled();
    expect(toastr.info).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/signedout']);
  });

  it('signIn uses popup on localhost and navigates on success', async () => {
    sessionStorage.clear();

    const userCredential = {
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      },
    };

    firebaseAuth.signInWithPopup.and.resolveTo(userCredential as never);

    const privateApi = service as unknown as {
      checkIfUserIsAllowed: (email: string) => unknown;
    };
    spyOn(privateApi, 'checkIfUserIsAllowed').and.returnValue(of(true));

    const ok = await service.signIn();

    expect(ok).toBeTrue();
    expect(firebaseAuth.signInWithPopup).toHaveBeenCalled();
    expect(sessionService.updateActivity).toHaveBeenCalled();
    expect(toastr.success).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/appointments']);
  });

  it('signIn signs out and redirects to forbidden when user is not allowed', async () => {
    sessionStorage.clear();

    const userCredential = {
      user: {
        uid: 'test-uid',
        email: 'blocked@example.com',
        displayName: 'Blocked User',
      },
    };

    firebaseAuth.signInWithPopup.and.resolveTo(userCredential as never);

    const privateApi = service as unknown as {
      checkIfUserIsAllowed: (email: string) => unknown;
    };
    spyOn(privateApi, 'checkIfUserIsAllowed').and.returnValue(of(false));

    const ok = await service.signIn();

    expect(ok).toBeFalse();
    expect(firebaseAuth.signOut).toHaveBeenCalled();
    expect(toastr.error).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);
  });
});

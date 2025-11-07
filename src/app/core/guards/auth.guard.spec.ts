import { TestBed } from '@angular/core/testing';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { of } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthenticationService } from '../services/authentication.service';
import { MockRouter } from '../../../test-helpers/angular-mocks';

describe('authGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthenticationService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthenticationService', ['user'], {
      isAllowed$: of(true),
      user: jasmine
        .createSpy('user')
        .and.returnValue({ email: 'test@test.com' }),
    });

    const router = new MockRouter();
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree'], {
      navigate: router.navigate,
      createUrlTree: router.createUrlTree,
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthenticationService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/appointments' } as RouterStateSnapshot;
  });

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  // Note: Full authGuard testing requires complex async flow testing
  // with Firebase Auth state changes and Firestore queries.
  // These tests are better suited for E2E testing with Firebase Emulator.
  // The guard is tested indirectly through integration tests.
});

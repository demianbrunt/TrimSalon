import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
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
      isAllowed$: of(undefined),
      user: jasmine.createSpy('user'),
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

  it('should allow access when user is allowed', (done) => {
    mockAuthService.isAllowed$ = of(true);
    mockAuthService.user.and.returnValue({ email: 'test@example.com' } as any);

    const guard = authGuard(mockRoute, mockState);

    if (guard instanceof Promise) {
      fail('Guard should return Observable');
    } else if (typeof guard === 'boolean') {
      expect(guard).toBe(true);
      done();
    } else {
      guard.subscribe((result) => {
        expect(result).toBe(true);
        done();
      });
    }
  });

  it('should redirect to signin when user is not authenticated', (done) => {
    mockAuthService.isAllowed$ = of(false);
    mockAuthService.user.and.returnValue(null);
    mockRouter.createUrlTree.and.returnValue({ toString: () => '/signin' } as any);

    const guard = authGuard(mockRoute, mockState);

    if (guard instanceof Promise) {
      fail('Guard should return Observable');
    } else if (typeof guard === 'boolean') {
      fail('Guard should redirect');
    } else {
      guard.subscribe((result) => {
        expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/signin'], {
          queryParams: { returnUrl: '/appointments' },
        });
        done();
      });
    }
  });

  it('should redirect to forbidden when user is authenticated but not allowed', (done) => {
    mockAuthService.isAllowed$ = of(false);
    mockAuthService.user.and.returnValue({ email: 'test@example.com' } as any);
    mockRouter.createUrlTree.and.returnValue({ toString: () => '/forbidden' } as any);

    const guard = authGuard(mockRoute, mockState);

    if (guard instanceof Promise) {
      fail('Guard should return Observable');
    } else if (typeof guard === 'boolean') {
      fail('Guard should redirect');
    } else {
      guard.subscribe((result) => {
        expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/forbidden']);
        done();
      });
    }
  });
});

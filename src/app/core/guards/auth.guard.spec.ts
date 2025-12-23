import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  type UrlTree,
} from '@angular/router';
import { type Observable, concat, lastValueFrom, of } from 'rxjs';
import { MockRouter } from '../../../test-helpers/angular-mocks';
import { AuthenticationService } from '../services/authentication.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let mockAuthService: {
    isAllowed$: Observable<boolean | undefined>;
    user: jasmine.Spy;
  };

  let mockRouter: jasmine.SpyObj<Router>;

  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/clients' } as RouterStateSnapshot;

  beforeEach(() => {
    const router = new MockRouter();

    mockAuthService = {
      isAllowed$: of(true),
      user: jasmine
        .createSpy('user')
        .and.returnValue({ email: 'test@test.com' }),
    };

    mockRouter = jasmine.createSpyObj<Router>('Router', ['createUrlTree'], {
      navigate: router.navigate,
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
    });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthenticationService,
          useValue: mockAuthService as unknown as AuthenticationService,
        },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('allows navigation when user is allowed', async () => {
    mockAuthService.isAllowed$ = of(true);
    mockAuthService.user.and.returnValue({ email: 'test@test.com' });

    const result$ = TestBed.runInInjectionContext(() =>
      authGuard(route, state),
    ) as Observable<boolean | UrlTree>;
    const result = await lastValueFrom(result$);

    expect(result).toBeTrue();
  });

  it('redirects unauthenticated users to signin with returnUrl', async () => {
    const expectedTree = {} as UrlTree;
    mockRouter.createUrlTree.and.returnValue(expectedTree);

    mockAuthService.isAllowed$ = concat(of(undefined), of(false));
    mockAuthService.user.and.returnValue(null);

    const result$ = TestBed.runInInjectionContext(() =>
      authGuard(route, state),
    ) as Observable<boolean | UrlTree>;
    const result = await lastValueFrom(result$);

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/signin'], {
      queryParams: { returnUrl: '/clients' },
    });
    expect(result).toBe(expectedTree);
  });

  it('redirects authenticated but disallowed users to forbidden', async () => {
    const expectedTree = {} as UrlTree;
    mockRouter.createUrlTree.and.returnValue(expectedTree);

    mockAuthService.isAllowed$ = of(false);
    mockAuthService.user.and.returnValue({ email: 'test@test.com' });

    const result$ = TestBed.runInInjectionContext(() =>
      authGuard(route, state),
    ) as Observable<boolean | UrlTree>;
    const result = await lastValueFrom(result$);

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/forbidden']);
    expect(result).toBe(expectedTree);
  });
});

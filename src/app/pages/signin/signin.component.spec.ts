import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { MockRouter } from '../../../test-helpers/angular-mocks';
import { APP_CONFIG } from '../../app.config.model';
import { AuthenticationService } from '../../core/services/authentication.service';
import { SignInComponent } from './signin.component';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;

  let router: MockRouter;
  let isAuthenticated = false;
  let returnUrl: string | null = null;

  let authService: {
    isSigningIn: () => boolean;
    isAuthenticated: () => boolean;
    signIn: jasmine.Spy;
  };

  const activatedRoute = {
    snapshot: {
      queryParamMap: {
        get: (key: string) => (key === 'returnUrl' ? returnUrl : null),
      },
      paramMap: {
        get: () => null,
      },
      data: {},
    },
  } as unknown as ActivatedRoute;

  beforeEach(async () => {
    router = new MockRouter();
    isAuthenticated = false;
    returnUrl = null;
    authService = {
      isSigningIn: () => false,
      isAuthenticated: () => isAuthenticated,
      signIn: jasmine.createSpy('signIn').and.resolveTo(true),
    };

    await TestBed.configureTestingModule({
      imports: [SignInComponent],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: AuthenticationService, useValue: authService },
        {
          provide: APP_CONFIG,
          useValue: { googleAuth: { clientId: 'test' }, devMode: false },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('stores returnUrl and triggers sign-in', () => {
    sessionStorage.clear();

    returnUrl = '/clients';

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.signIn();

    expect(sessionStorage.getItem('auth_return_url')).toBe('/clients');
    expect(authService.signIn).toHaveBeenCalled();
  });

  it('redirects immediately when already authenticated', () => {
    isAuthenticated = true;
    returnUrl = '/expenses';

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/expenses']);
  });
});

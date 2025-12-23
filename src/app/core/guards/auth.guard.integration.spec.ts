import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { authGuard } from './auth.guard';

@Component({
  standalone: true,
  template: 'clients',
})
class ClientsStubComponent {}

@Component({
  standalone: true,
  template: 'signin',
})
class SigninStubComponent {}

@Component({
  standalone: true,
  template: 'forbidden',
})
class ForbiddenStubComponent {}

describe('authGuard (integration)', () => {
  it('allows navigation when user is allowed', async () => {
    const mockAuthService = {
      isAllowed$: of(true),
      user: () => ({ email: 'test@test.com' }),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'clients',
            component: ClientsStubComponent,
            canActivate: [authGuard],
          },
          { path: 'signin', component: SigninStubComponent },
          { path: 'forbidden', component: ForbiddenStubComponent },
        ]),
        { provide: AuthenticationService, useValue: mockAuthService },
      ],
    }).compileComponents();

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/clients');

    const router = TestBed.inject(Router);
    expect(router.url).toBe('/clients');
  });

  it('redirects to /forbidden when navigating to a guarded route while authenticated but not allowed', async () => {
    const mockAuthService = {
      isAllowed$: of(false),
      user: () => ({ email: 'blocked@test.com' }),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'clients',
            component: ClientsStubComponent,
            canActivate: [authGuard],
          },
          { path: 'signin', component: SigninStubComponent },
          { path: 'forbidden', component: ForbiddenStubComponent },
        ]),
        { provide: AuthenticationService, useValue: mockAuthService },
      ],
    }).compileComponents();

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/clients');

    const router = TestBed.inject(Router);
    expect(router.url).toBe('/forbidden');
  });

  it('redirects to /signin with returnUrl when navigating to a guarded route while unauthenticated', async () => {
    const mockAuthService = {
      isAllowed$: of(false),
      user: () => null,
    };

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'clients',
            component: ClientsStubComponent,
            canActivate: [authGuard],
          },
          { path: 'signin', component: SigninStubComponent },
          { path: 'forbidden', component: ForbiddenStubComponent },
        ]),
        { provide: AuthenticationService, useValue: mockAuthService },
      ],
    }).compileComponents();

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/clients');

    const router = TestBed.inject(Router);
    expect(router.url).toBe('/signin?returnUrl=%2Fclients');
  });
});

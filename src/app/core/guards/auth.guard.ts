import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  if (router.url.startsWith('/signin')) {
    return true;
  }

  console.log('Triggered: forbidden guard');

  return router.createUrlTree(['/forbidden']);
};

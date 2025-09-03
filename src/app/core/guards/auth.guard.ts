import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  return authService.isLoggedIn$.pipe(
    take(1),
    switchMap((isLoggedIn) => {
      if (!isLoggedIn) {
        return of(router.createUrlTree(['/signin']));
      }
      return authService.isAllowedUser$.pipe(
        map((isAllowed) => {
          if (isAllowed) {
            return true;
          }
          return router.createUrlTree(['/forbidden']);
        }),
      );
    }),
  );
};

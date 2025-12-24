import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  return authService.isAllowed$.pipe(
    filter((isAllowed) => isAllowed !== undefined),
    take(1),
    map((isAllowed) => {
      if (isAllowed) return true;
      if (authService.user() === null) {
        return router.createUrlTree(['/admin', 'signin'], {
          queryParams: { returnUrl: state.url },
        });
      }
      return router.createUrlTree(['/admin', 'forbidden']);
    }),
  );
};

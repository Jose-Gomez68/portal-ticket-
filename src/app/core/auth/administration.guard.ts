import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';

export const administrationGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  const role = authSession.user()?.role;

  return role === 'ADMIN' || role === 'SUPERVISOR'
    ? true
    : router.createUrlTree(['/dashboard']);
};

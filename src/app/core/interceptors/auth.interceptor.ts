import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthSessionService } from '../auth/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  const isAuthRequest = /\/auth\/(login|refresh)(?:$|[?#])/.test(req.url);
  const credentialedRequest = req.clone({ withCredentials: true });

  return next(credentialedRequest).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isAuthRequest ||
        !authSession.isAuthenticated()
      ) {
        return throwError(() => error);
      }

      return authSession.refreshSession().pipe(
        catchError((refreshError: unknown) => {
          if (
            refreshError instanceof HttpErrorResponse &&
            (refreshError.status === 401 || refreshError.status === 403)
          ) {
            authSession.logout();
            void router.navigateByUrl('/login');
          }
          return throwError(() => refreshError);
        }),
        switchMap(() =>
          next(credentialedRequest).pipe(
            catchError((retryError: unknown) => {
              if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
                authSession.logout();
                void router.navigateByUrl('/login');
              }
              return throwError(() => retryError);
            }),
          ),
        ),
      );
    }),
  );
};

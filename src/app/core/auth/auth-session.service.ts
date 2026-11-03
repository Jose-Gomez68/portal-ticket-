import { Injectable, computed, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import type { AuthStatus, AuthUser, LoginRequest } from './auth.model';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly userState = signal<AuthUser | null>(null);
  private readonly authStatusState = signal<AuthStatus>('loading');
  readonly user = this.userState.asReadonly();
  readonly authStatus = this.authStatusState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  private refreshRequest$: Observable<AuthUser> | null = null;
  private initializationRequest$: Observable<boolean> | null = null;
  private sessionRevision = 0;

  constructor(private readonly authApi: AuthApiService) {}

  login(request: LoginRequest): Observable<AuthUser> {
    return this.authApi.login(request).pipe(tap((user) => this.setUser(user)));
  }

  initializeSession(): Observable<boolean> {
    if (this.authStatus() !== 'loading') {
      return of(this.isAuthenticated());
    }
    if (this.initializationRequest$) {
      return this.initializationRequest$;
    }

    let initializationRequest$: Observable<boolean>;
    initializationRequest$ = this.refreshSession().pipe(
      map(() => true),
      catchError(() => {
        if (this.authStatus() === 'loading') {
          this.logout();
        }
        return of(this.isAuthenticated());
      }),
      finalize(() => {
        if (this.initializationRequest$ === initializationRequest$) {
          this.initializationRequest$ = null;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.initializationRequest$ = initializationRequest$;

    return initializationRequest$;
  }

  refreshSession(): Observable<AuthUser> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const revisionAtRefresh = this.sessionRevision;
    let refreshRequest$: Observable<AuthUser>;
    refreshRequest$ = this.authApi.refresh().pipe(
      tap((user) => {
        if (this.sessionRevision !== revisionAtRefresh) {
          throw new Error('La sesión cambió durante la renovación.');
        }
        this.setUser(user);
      }),
      catchError((error: unknown) => {
        if (
          this.sessionRevision === revisionAtRefresh &&
          isUnauthorized(error)
        ) {
          this.logout();
        }
        return throwError(() => error);
      }),
      finalize(() => {
        if (this.refreshRequest$ === refreshRequest$) {
          this.refreshRequest$ = null;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.refreshRequest$ = refreshRequest$;

    return refreshRequest$;
  }

  logout(): void {
    this.userState.set(null);
    this.authStatusState.set('unauthenticated');
    this.sessionRevision += 1;
  }

  private setUser(user: AuthUser): void {
    this.userState.set(user);
    this.authStatusState.set('authenticated');
    this.sessionRevision += 1;
  }
}

function isUnauthorized(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error.status === 401 || error.status === 403)
  );
}

import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import type { AuthUser, LoginRequest } from './auth.model';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  const initialUser: AuthUser = {
    userID: 1,
    userName: 'user',
    name: 'User Example',
    email: 'user@example.com',
    role: 'REQUESTER',
    areaID: 1,
    areaName: 'Support',
  };
  const refreshedUser: AuthUser = { ...initialUser, name: 'Updated User' };

  let service: AuthSessionService;
  let authApi: {
    login: (request: LoginRequest) => Observable<AuthUser>;
    refresh: () => Observable<AuthUser>;
  };

  beforeEach(() => {
    authApi = {
      login: vi.fn((_request: LoginRequest) => of(initialUser)),
      refresh: vi.fn(() => of(refreshedUser)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AuthApiService, useValue: authApi }],
    });
    service = TestBed.inject(AuthSessionService);
  });

  it('keeps only user data in the in-memory session after login', () => {
    service.login({ email: initialUser.email, password: 'password' }).subscribe();

    expect(service.user()).toEqual(initialUser);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.authStatus()).toBe('authenticated');
    expect('token' in service.user()!).toBe(false);
  });

  it('restores a session through the refresh endpoint', () => {
    service.initializeSession().subscribe((restored) => {
      expect(restored).toBe(true);
    });

    expect(authApi.refresh).toHaveBeenCalledOnce();
    expect(service.user()).toEqual(refreshedUser);
    expect(service.authStatus()).toBe('authenticated');
  });

  it('clears local state when the refresh cookie is rejected', () => {
    authApi.refresh = vi.fn(() =>
      new Observable<AuthUser>((subscriber) => {
        subscriber.error(new HttpErrorResponse({ status: 401 }));
      }),
    );

    service.initializeSession().subscribe((restored) => {
      expect(restored).toBe(false);
    });

    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.authStatus()).toBe('unauthenticated');
  });

  it('finishes initialization as unauthenticated when the network is unavailable', () => {
    authApi.refresh = vi.fn(() =>
      new Observable<AuthUser>((subscriber) => {
        subscriber.error(new HttpErrorResponse({ status: 0 }));
      }),
    );

    service.initializeSession().subscribe((restored) => {
      expect(restored).toBe(false);
    });

    expect(service.authStatus()).toBe('unauthenticated');
  });

  it('clears the in-memory user on logout', () => {
    service.login({ email: initialUser.email, password: 'password' }).subscribe();

    service.logout();

    expect(service.user()).toBeNull();
    expect(service.authStatus()).toBe('unauthenticated');
  });
});

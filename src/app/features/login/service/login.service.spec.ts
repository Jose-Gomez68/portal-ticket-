import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { AuthUser, LoginRequest } from '../../../core/auth/auth.model';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { LoginService } from './login.service';

describe('LoginService', () => {
  let service: LoginService;
  let authSession: { login: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authSession = {
      login: vi.fn((_request: LoginRequest) =>
        of({
          userID: 1,
          userName: 'user',
          name: 'User Example',
          email: 'user@example.com',
          role: 'REQUESTER',
          areaID: 1,
          areaName: null,
        } satisfies AuthUser),
      ),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AuthSessionService, useValue: authSession }],
    });
    service = TestBed.inject(LoginService);
  });

  it('delegates login to the auth session', () => {
    const request = { email: 'user@example.com', password: 'password' };

    service.login(request).subscribe();

    expect(authSession.login).toHaveBeenCalledWith(request);
  });
});

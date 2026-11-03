import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthApiService } from './auth-api.service';
import type { AuthUser } from './auth.model';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpTesting: HttpTestingController;

  const authUser: AuthUser = {
    userID: 3,
    userName: 'user',
    name: 'User Example',
    email: 'user@example.com',
    role: 'AGENT',
    areaID: null,
    areaName: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('sends refresh without a token body and includes cookies', () => {
    service.refresh().subscribe((response) => {
      expect(response).toEqual(authUser);
    });

    const request = httpTesting.expectOne('http://localhost:8080/api/auth/refresh');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    expect(request.request.withCredentials).toBe(true);
    request.flush({ success: true, message: 'Token renovado', data: authUser });
  });

  it('sends login credentials and accepts a user-only response', () => {
    const credentials = { email: authUser.email, password: 'password' };

    service.login(credentials).subscribe((response) => {
      expect(response).toEqual(authUser);
    });

    const request = httpTesting.expectOne('http://localhost:8080/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);
    expect(request.request.withCredentials).toBe(true);
    request.flush({ success: true, message: 'Inicio de sesión correcto', data: authUser });
  });
});

import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '../auth/auth-session.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let refreshSession: ReturnType<typeof vi.fn>;
  let isAuthenticated: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    refreshSession = vi.fn(() => of({ userID: 1 }));
    isAuthenticated = vi.fn(() => true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthSessionService,
          useValue: { refreshSession, isAuthenticated, logout: vi.fn() },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('sends cookies without an Authorization header and retries once after refresh', () => {
    http.get('/api/tickets').subscribe();

    const request = httpTesting.expectOne('/api/tickets');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(refreshSession).toHaveBeenCalledOnce();
    const retry = httpTesting.expectOne('/api/tickets');
    expect(retry.request.withCredentials).toBe(true);
    expect(retry.request.headers.has('Authorization')).toBe(false);
    retry.flush([]);
  });

  it('does not refresh recursively for an auth endpoint', () => {
    http.post('/api/auth/refresh?source=restore', null).subscribe({
      error: (error: unknown) => {
        expect(error).toBeInstanceOf(HttpErrorResponse);
      },
    });

    const request = httpTesting.expectOne('/api/auth/refresh?source=restore');
    expect(request.request.withCredentials).toBe(true);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(refreshSession).not.toHaveBeenCalled();
  });
});

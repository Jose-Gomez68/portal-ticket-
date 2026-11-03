import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import type { LoginRequest, LoginResponse } from '../model/login.model';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(private readonly authSession: AuthSessionService) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.authSession.login(request);
  }
}

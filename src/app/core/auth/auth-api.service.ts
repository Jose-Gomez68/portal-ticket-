import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../service/api.service';
import type { ApiResponse, AuthUser, LoginRequest } from './auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly endpoint = 'auth';

  constructor(private readonly api: ApiService) {}

  login(request: LoginRequest): Observable<AuthUser> {
    return this.api.postWithCredentials<ApiResponse<AuthUser>>(`${this.endpoint}/login`, request).pipe(
      map((response) => unwrapData(response, isAuthUser)),
    );
  }

  refresh(): Observable<AuthUser> {
    return this.api
      .postWithCredentials<ApiResponse<AuthUser>>(`${this.endpoint}/refresh`, null)
      .pipe(map((response) => unwrapData(response, isAuthUser)));
  }
}

function unwrapData<T>(
  response: unknown,
  isExpectedData: (data: unknown) => data is T,
): T {
  if (typeof response !== 'object' || response === null) {
    throw new Error('La respuesta de la API tiene un formato inválido.');
  }

  const envelope = response as Record<string, unknown>;
  if (envelope['success'] !== true) {
    const message =
      typeof envelope['message'] === 'string'
        ? envelope['message']
        : 'La API indicó que la operación no fue exitosa.';
    throw new Error(message);
  }

  if (
    typeof envelope['message'] !== 'string' ||
    !isExpectedData(envelope['data'])
  ) {
    throw new Error('La respuesta de la API no contiene los datos esperados.');
  }

  return envelope['data'];
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;
  return (
    typeof response['userID'] === 'number' &&
    typeof response['userName'] === 'string' &&
    typeof response['name'] === 'string' &&
    typeof response['email'] === 'string' &&
    typeof response['role'] === 'string' &&
    (typeof response['areaID'] === 'number' || response['areaID'] === null) &&
    (typeof response['areaName'] === 'string' || response['areaName'] === null)
  );
}

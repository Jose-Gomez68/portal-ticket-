import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/service/api.service';
import type { NewUserModel, UpdateUserModel, UserModel } from '../model/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly endpoint = 'user';

  constructor(private readonly api: ApiService) {}

  getAllUsers(): Observable<UserModel[]> {
    return this.api.get<unknown>(`${this.endpoint}/getAllUsers`).pipe(
      map((response) =>
        unwrapData(response, (data): data is UserModel[] =>
          Array.isArray(data) && data.every(isUserModel),
        ),
      ),
    );
  }

  createUser(user: NewUserModel): Observable<UserModel> {
    return this.api.post<unknown>(`${this.endpoint}/createUser`, user).pipe(
      map((response) => unwrapData(response, isUserModel)),
    );
  }

  updateUser(user: UpdateUserModel): Observable<UserModel> {
    return this.api.put<unknown>(`${this.endpoint}/UpdateUser`, user).pipe(
      map((response) => unwrapData(response, isUserModel)),
    );
  }

  deleteUser(userID: number): Observable<void> {
    return this.api.delete<unknown>(`${this.endpoint}/DeleteUser/${userID}`).pipe(
      map((response) => unwrapDeleteResponse(response)),
    );
  }
}

function unwrapDeleteResponse(response: unknown): void {
  if (typeof response !== 'object' || response === null) {
    throw new Error('La respuesta de la API tiene un formato inválido.');
  }

  const envelope = response as Record<string, unknown>;
  if (envelope['success'] !== true) {
    const message = typeof envelope['message'] === 'string'
      ? envelope['message']
      : 'La API indicó que la operación no fue exitosa.';
    throw new Error(message);
  }
}

function unwrapData<T>(response: unknown, isExpectedData: (data: unknown) => data is T): T {
  if (typeof response !== 'object' || response === null) {
    throw new Error('La respuesta de la API tiene un formato inválido.');
  }

  const envelope = response as Record<string, unknown>;
  if (envelope['success'] !== true) {
    const message = typeof envelope['message'] === 'string'
      ? envelope['message']
      : 'La API indicó que la operación no fue exitosa.';
    throw new Error(message);
  }

  if (!isExpectedData(envelope['data'])) {
    throw new Error('La respuesta de la API no contiene los datos esperados.');
  }

  return envelope['data'];
}

function isUserModel(value: unknown): value is UserModel {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;
  return (
    typeof user['userID'] === 'number' &&
    typeof user['userName'] === 'string' &&
    typeof user['name'] === 'string' &&
    typeof user['apPaterno'] === 'string' &&
    typeof user['apMaterno'] === 'string' &&
    typeof user['email'] === 'string' &&
    isUserRole(user['role']) &&
    (typeof user['areaID'] === 'number' || user['areaID'] === null) &&
    (typeof user['areaName'] === 'string' || user['areaName'] === null) &&
    (typeof user['active'] === 'boolean' || user['active'] === null) &&
    (typeof user['createBy'] === 'string' || user['createBy'] === null) &&
    (typeof user['createDate'] === 'string' || user['createDate'] === null) &&
    (typeof user['updatedBy'] === 'string' || user['updatedBy'] === null) &&
    (typeof user['updatedDate'] === 'string' || user['updatedDate'] === null) &&
    (typeof user['deletedBy'] === 'string' || user['deletedBy'] === null) &&
    (typeof user['deletedDate'] === 'string' || user['deletedDate'] === null)
  );
}

function isUserRole(value: unknown): value is UserModel['role'] {
  return (
    value === 'ADMIN' ||
    value === 'SUPERVISOR' ||
    value === 'AGENT' ||
    value === 'REQUESTER'
  );
}

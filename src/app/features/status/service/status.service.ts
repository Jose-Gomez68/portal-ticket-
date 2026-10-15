import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/service/api.service';
import type { NewStatusModel, StatusModel, UpdateStatusModel } from '../model/status.model';

@Injectable({
  providedIn: 'root',
})
export class StatusService {
  private readonly endpoint = 'status';

  constructor(private readonly api: ApiService) {}

  getAllStatuses(): Observable<StatusModel[]> {
    return this.api.get<unknown>(`${this.endpoint}/getAllStatus`).pipe(
      map((response) =>
        unwrapData(response, (data): data is StatusModel[] =>
          Array.isArray(data) && data.every(isStatusModel),
        ),
      ),
    );
  }

  createStatus(status: NewStatusModel): Observable<StatusModel> {
    return this.api.post<unknown>(`${this.endpoint}/createStatus`, status).pipe(
      map((response) => unwrapData(response, isStatusModel)),
    );
  }

  updateStatus(status: UpdateStatusModel): Observable<StatusModel> {
    return this.api.put<unknown>(`${this.endpoint}/UpdateStatus`, status).pipe(
      map((response) => unwrapData(response, isStatusModel)),
    );
  }

  deleteStatus(statusID: number): Observable<void> {
    return this.api.delete<unknown>(`${this.endpoint}/DeleteStatus/${statusID}`).pipe(
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
    throw new Error('La propiedad data de la respuesta tiene un formato inválido.');
  }

  return envelope['data'];
}

function isStatusModel(value: unknown): value is StatusModel {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const status = value as Record<string, unknown>;
  return (
    typeof status['statusID'] === 'number' &&
    typeof status['name'] === 'string' &&
    typeof status['descrip'] === 'string' &&
    typeof status['backgroundColor'] === 'string' &&
    typeof status['dotColor'] === 'string'
  );
}

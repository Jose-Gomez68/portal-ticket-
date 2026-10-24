import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/service/api.service';
import type { KindModel, NewKindModel, UpdateKindModel } from '../model/kind.model';

@Injectable({
  providedIn: 'root',
})
export class KindService {
  private readonly endpoint = 'kind';

  constructor(private readonly api: ApiService) {}

  getAllKinds(): Observable<KindModel[]> {
    return this.api.get<unknown>(`${this.endpoint}/getAllKind`).pipe(
      map((response) =>
        unwrapData(response, (data): data is KindModel[] =>
          Array.isArray(data) && data.every(isKindModel),
        ),
      ),
    );
  }

  createKind(kind: NewKindModel): Observable<KindModel> {
    return this.api.post<unknown>(`${this.endpoint}/createKind`, kind).pipe(
      map((response) => unwrapData(response, isKindModel)),
    );
  }

  updateKind(kind: UpdateKindModel): Observable<KindModel> {
    return this.api.put<unknown>(`${this.endpoint}/UpdateKind`, kind).pipe(
      map((response) => unwrapData(response, isKindModel)),
    );
  }

  deleteKind(kindID: number): Observable<void> {
    return this.api.delete<unknown>(`${this.endpoint}/DeleteKind/${kindID}`).pipe(
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

function isKindModel(value: unknown): value is KindModel {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const kind = value as Record<string, unknown>;
  return (
    typeof kind['kindID'] === 'number' &&
    typeof kind['name'] === 'string' &&
    (typeof kind['active'] === 'boolean' || kind['active'] === null) &&
    (typeof kind['createdBy'] === 'string' || kind['createdBy'] === null) &&
    (typeof kind['createdDate'] === 'string' || kind['createdDate'] === null) &&
    (typeof kind['updatedBy'] === 'string' || kind['updatedBy'] === null) &&
    (typeof kind['updatedDate'] === 'string' || kind['updatedDate'] === null) &&
    (typeof kind['deletedBy'] === 'string' || kind['deletedBy'] === null) &&
    (typeof kind['deletedDate'] === 'string' || kind['deletedDate'] === null)
  );
}

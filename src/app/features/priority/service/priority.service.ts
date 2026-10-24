import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/service/api.service';
import type {
  NewPriorityModel,
  PriorityModel,
  UpdatePriorityModel,
} from '../model/priority.model';

@Injectable({
  providedIn: 'root',
})
export class PriorityService {
  private readonly endpoint = 'priority';

  constructor(private readonly api: ApiService) {}

  getAllPriorities(): Observable<PriorityModel[]> {
    return this.api.get<unknown>(`${this.endpoint}/getAllPriority`).pipe(
      map((response) =>
        unwrapData(response, (data): data is PriorityModel[] =>
          Array.isArray(data) && data.every(isPriorityModel),
        ),
      ),
    );
  }

  createPriority(priority: NewPriorityModel): Observable<PriorityModel> {
    return this.api.post<unknown>(`${this.endpoint}/createPriority`, priority).pipe(
      map((response) => unwrapData(response, isPriorityModel)),
    );
  }

  updatePriority(priority: UpdatePriorityModel): Observable<PriorityModel> {
    return this.api.put<unknown>(`${this.endpoint}/UpdatePriority`, priority).pipe(
      map((response) => unwrapData(response, isPriorityModel)),
    );
  }

  deletePriority(priorityID: number): Observable<void> {
    return this.api.delete<unknown>(`${this.endpoint}/DeletePriority/${priorityID}`).pipe(
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

function isPriorityModel(value: unknown): value is PriorityModel {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const priority = value as Record<string, unknown>;
  return (
    typeof priority['priorityID'] === 'number' &&
    typeof priority['name'] === 'string' &&
    (typeof priority['backgroundColor'] === 'string' || priority['backgroundColor'] === null) &&
    (typeof priority['dotColor'] === 'string' || priority['dotColor'] === null) &&
    (typeof priority['active'] === 'boolean' || priority['active'] === null) &&
    (typeof priority['createdBy'] === 'string' || priority['createdBy'] === null) &&
    (typeof priority['createdDate'] === 'string' || priority['createdDate'] === null) &&
    (typeof priority['updatedBy'] === 'string' || priority['updatedBy'] === null) &&
    (typeof priority['updatedDate'] === 'string' || priority['updatedDate'] === null)
  );
}

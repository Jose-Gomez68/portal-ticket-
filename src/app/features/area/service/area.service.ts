import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/service/api.service';
import type { AreaModel, NewAreaModel, UpdateAreaModel } from '../model/area.model';

@Injectable({
  providedIn: 'root',
})
export class AreaService {
  private readonly endpoint = 'area';

  constructor(private readonly api: ApiService) {}

  getAll(): Observable<AreaModel[]> {
    return this.api.get<unknown>(`${this.endpoint}/getAllArea`).pipe(
      map((response) =>
        unwrapData(response, (data): data is AreaModel[] =>
          Array.isArray(data) && data.every(isAreaModel),
        ),
      ),
    );
  }

  create(area: NewAreaModel): Observable<AreaModel> {
    return this.api.post<unknown>(`${this.endpoint}/createArea`, area).pipe(
      map((response) => unwrapData(response, isAreaModel)),
    );
  }

  update(area: UpdateAreaModel): Observable<AreaModel> {
    return this.api.put<unknown>(`${this.endpoint}/UpdateArea`, area).pipe(
      map((response) => unwrapData(response, isAreaModel)),
    );
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

function isAreaModel(value: unknown): value is AreaModel {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const area = value as Record<string, unknown>;
  return (
    typeof area['areaID'] === 'number' &&
    typeof area['name'] === 'string' &&
    typeof area['descrip'] === 'string' &&
    typeof area['active'] === 'boolean'
  );
}

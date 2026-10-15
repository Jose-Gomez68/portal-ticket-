import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/service/api.service';
import type {
  NewProjectModel,
  ProjectModel,
  ProjectPageModel,
  UpdateProjectModel,
} from '../model/project.model';

@Injectable({
  providedIn: 'root',
})

export class ProjectService {

  private readonly endpoint = 'project';
  constructor(private readonly api: ApiService) {}

  getAllProjects(page: number, size: number): Observable<ProjectPageModel> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.api.get<unknown>(`${this.endpoint}/getAllProjectPage`, params).pipe(
      map((response) => unwrapData(response, isProjectPageModel)),
    );
  }

  createProject(project: NewProjectModel): Observable<ProjectModel> {
    return this.api.post<unknown>(`${this.endpoint}/createProject`, project).pipe(
      map((response) => unwrapData(response, isProjectModel)),
    );
  }

  updateProject(project: UpdateProjectModel): Observable<ProjectModel> {
    return this.api.put<unknown>(`${this.endpoint}/UpdateProject`, project).pipe(
      map((response) => unwrapData(response, isProjectModel)),
    );
  }

  deleteProject(projectID: number): Observable<void> {
    return this.api.delete<unknown>(`${this.endpoint}/DeleteProject/${projectID}`).pipe(
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

function isProjectModel(value: unknown): value is ProjectModel {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const project = value as Record<string, unknown>;
  return (
    typeof project['projectID'] === 'number' &&
    typeof project['name'] === 'string' &&
    typeof project['description'] === 'string' &&
    typeof project['active'] === 'boolean' &&
    (typeof project['createdBy'] === 'string' || project['createdBy'] === null) &&
    (typeof project['createdDate'] === 'string' || project['createdDate'] === null) &&
    (typeof project['updatedBy'] === 'string' || project['updatedBy'] === null) &&
    (typeof project['updatedDate'] === 'string' || project['updatedDate'] === null)
  );
}

function isProjectPageModel(value: unknown): value is ProjectPageModel {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const page = value as Record<string, unknown>;
  return (
    typeof page['totalItems'] === 'number' &&
    Number.isFinite(page['totalItems']) &&
    page['totalItems'] >= 0 &&
    typeof page['page'] === 'number' &&
    Number.isInteger(page['page']) &&
    page['page'] >= 0 &&
    typeof page['size'] === 'number' &&
    Number.isInteger(page['size']) &&
    page['size'] > 0 &&
    Array.isArray(page['response']) &&
    page['response'].every(isProjectModel)
  );
}

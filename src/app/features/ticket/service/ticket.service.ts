import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/service/api.service';
import type {
  NewTicketCommentModel,
  NewTicketModel,
  TicketCommentModel,
  TicketModel,
  TicketPageModel,
  UpdateTicketModel,
} from '../model/ticket.model';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly endpoint = 'ticket';
  private readonly commentEndpoint = 'ticketComment';

  constructor(private readonly api: ApiService) {}

  getAllActiveTickets(page: number, size: number): Observable<TicketPageModel> {
    const params = new HttpParams().set('page', page).set('size', size);

    return this.api
      .get<unknown>(`${this.endpoint}/getAllTicketActive`, params)
      .pipe(map((response) => unwrapData(response, isTicketPageModel)));
  }

  getTicketByID(ticketID: number): Observable<TicketModel> {
    return this.api
      .get<unknown>(`${this.endpoint}/${ticketID}`)
      .pipe(map((response) => unwrapData(response, isTicketModel)));
  }

  createTicket(ticket: NewTicketModel): Observable<TicketModel> {
    return this.api
      .post<unknown>(`${this.endpoint}/createTicket`, ticket)
      .pipe(map((response) => unwrapData(response, isTicketModel)));
  }

  updateTicket(ticket: UpdateTicketModel): Observable<TicketModel> {
    return this.api
      .put<unknown>(`${this.endpoint}/UpdateTicket`, ticket)
      .pipe(map((response) => unwrapData(response, isTicketModel)));
  }

  deleteTicket(ticketID: number): Observable<TicketModel> {
    return this.api
      .delete<unknown>(`${this.endpoint}/DeleteTicket/${ticketID}`)
      .pipe(map((response) => unwrapData(response, isTicketModel)));
  }

  createTicketComment(comment: NewTicketCommentModel): Observable<TicketCommentModel> {
    return this.api
      .post<unknown>(`${this.commentEndpoint}/createTicketComment`, comment)
      .pipe(map((response) => unwrapData(response, isTicketCommentModel)));
  }
}

function unwrapData<T>(response: unknown, isExpectedData: (data: unknown) => data is T): T {
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

  if (!isExpectedData(envelope['data'])) {
    throw new Error('La respuesta de la API no contiene los datos esperados.');
  }

  return envelope['data'];
}

function isTicketModel(value: unknown): value is TicketModel {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const ticket = value as Record<string, unknown>;
  return (
    typeof ticket['ticketID'] === 'number' &&
    typeof ticket['title'] === 'string' &&
    (typeof ticket['description'] === 'string' || ticket['description'] === null) &&
    (typeof ticket['active'] === 'boolean' || ticket['active'] === null) &&
    (typeof ticket['createdDate'] === 'string' || ticket['createdDate'] === null) &&
    (typeof ticket['updatedDate'] === 'string' || ticket['updatedDate'] === null) &&
    isObjectOrNull(ticket['kind']) &&
    isObjectOrNull(ticket['user']) &&
    isObjectOrNull(ticket['assignedID']) &&
    isObjectOrNull(ticket['project']) &&
    isObjectOrNull(ticket['areaID']) &&
    isObjectOrNull(ticket['priorityID']) &&
    isObjectOrNull(ticket['statusID']) &&
    Array.isArray(ticket['comments'])
  );
}

function isTicketPageModel(value: unknown): value is TicketPageModel {
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
    page['response'].every(isTicketModel)
  );
}

function isTicketCommentModel(value: unknown): value is TicketCommentModel {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const comment = value as Record<string, unknown>;
  return (
    typeof comment['commentID'] === 'number' &&
    typeof comment['message'] === 'string' &&
    typeof comment['ticket'] === 'number' &&
    (typeof comment['user'] === 'number' || comment['user'] === null) &&
    (typeof comment['createdDate'] === 'string' || comment['createdDate'] === null) &&
    (typeof comment['updatedDate'] === 'string' || comment['updatedDate'] === null)
  );
}

function isObjectOrNull(value: unknown): value is object | null {
  return typeof value === 'object';
}

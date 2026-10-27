import { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../../core/service/api.service';
import { TicketService } from './ticket.service';
import type { NewTicketModel } from '../model/ticket.model';

describe('TicketService', () => {
  it('requests the active tickets page with pagination parameters', () => {
    const api = {
      get: vi.fn(() =>
        of({
          success: true,
          message: 'tickets encontrados.',
          data: {
            totalItems: 1,
            page: 0,
            size: 10,
            response: [createTicket()],
          },
        }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [TicketService, { provide: ApiService, useValue: api }],
    });

    let result: unknown;
    TestBed.inject(TicketService).getAllActiveTickets(0, 10).subscribe((page) => {
      result = page;
    });

    expect(api.get).toHaveBeenCalledWith(
      'ticket/getAllTicketActive',
      new HttpParams().set('page', 0).set('size', 10),
    );
    expect(result).toEqual({
      totalItems: 1,
      page: 0,
      size: 10,
      response: [createTicket()],
    });
  });

  it('returns the deleted ticket from the API response', () => {
    const ticket = createTicket();
    const api = {
      delete: vi.fn(() =>
        of({
          success: true,
          message: 'Ticket eliminada correctamente.',
          data: ticket,
        }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [TicketService, { provide: ApiService, useValue: api }],
    });

    let result: unknown;
    TestBed.inject(TicketService).deleteTicket(ticket.ticketID).subscribe((deleted) => {
      result = deleted;
    });

    expect(api.delete).toHaveBeenCalledWith('ticket/DeleteTicket/7');
    expect(result).toEqual(ticket);
  });

  it('sends ticket relationship IDs using the API field names', () => {
    const ticket = createTicket();
    const request: NewTicketModel = {
      title: ticket.title,
      description: ticket.description,
      kind: 4,
      user: 9,
      assignedID: 2,
      project: 6,
      areaID: 2,
      priorityID: 2,
      statusID: 3,
    };
    const api = {
      post: vi.fn(() => of({
        success: true,
        message: 'ticket creado correctamente.',
        data: ticket,
      })),
    };
    TestBed.configureTestingModule({
      providers: [TicketService, { provide: ApiService, useValue: api }],
    });

    TestBed.inject(TicketService).createTicket(request).subscribe();

    expect(api.post).toHaveBeenCalledWith('ticket/createTicket', {
      title: 'No puedo iniciar sesión',
      description: 'La página muestra un error.',
      kind: 4,
      user: 9,
      assignedID: 2,
      project: 6,
      areaID: 2,
      priorityID: 2,
      statusID: 3,
    });
  });

  it('creates a ticket comment using the ticketComment endpoint', () => {
    const comment = {
      commentID: 12,
      message: 'Se está revisando el problema.',
      ticket: 7,
      user: 9,
      createdDate: '2026-10-24T11:00:00.000Z',
      updatedDate: null,
    };
    const api = {
      post: vi.fn(() => of({
        success: true,
        message: 'ticketComment creado correctamente.',
        data: comment,
      })),
    };
    TestBed.configureTestingModule({
      providers: [TicketService, { provide: ApiService, useValue: api }],
    });

    let result: unknown;
    TestBed.inject(TicketService)
      .createTicketComment({ message: comment.message, ticket: comment.ticket, user: comment.user })
      .subscribe((createdComment) => {
        result = createdComment;
      });

    expect(api.post).toHaveBeenCalledWith('ticketComment/createTicketComment', {
      message: comment.message,
      ticket: comment.ticket,
      user: comment.user,
    });
    expect(result).toEqual(comment);
  });
});

function createTicket() {
  return {
    ticketID: 7,
    title: 'No puedo iniciar sesión',
    description: 'La página muestra un error.',
    active: true,
    createdDate: '2026-10-24T10:00:00.000Z',
    updatedDate: null,
    kind: null,
    user: null,
    assignedID: null,
    project: null,
    areaID: null,
    priorityID: null,
    statusID: null,
    comments: [],
  };
}

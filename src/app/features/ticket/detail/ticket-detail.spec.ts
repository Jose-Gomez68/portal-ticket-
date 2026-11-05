import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { TicketService } from '../service/ticket.service';
import { UserService } from '../../user/service/user.service';
import { TicketDetail } from './ticket-detail';

describe('TicketDetail', () => {
  let fixture: ComponentFixture<TicketDetail>;
  const ticketService = {
    getTicketByID: vi.fn(() => of({
      ticketID: 7,
      title: 'No puedo iniciar sesión',
      description: 'La página muestra un error al ingresar.',
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
      comments: [{
        commentID: 11,
        message: 'Estoy revisando el caso.',
        ticket: 7,
        user: 15,
        createdDate: '2026-10-24T10:30:00.000Z',
        updatedDate: null,
      }],
    })),
    createTicketComment: vi.fn((comment: { message: string; ticket: number; user: number }) =>
      of({
        commentID: 12,
        ...comment,
        createdDate: '2026-10-24T11:00:00.000Z',
        updatedDate: null,
      }),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [TicketDetail],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ ticketID: '7' })) } },
        {
          provide: AuthSessionService,
          useValue: {
            user: () => ({
              userID: 9,
              userName: 'pedro',
              name: 'Pedro',
              email: 'pedro@example.test',
              role: 'ADMIN',
              areaID: null,
              areaName: null,
            }),
          },
        },
        { provide: TicketService, useValue: ticketService },
        {
          provide: UserService,
          useValue: {
            getUserByID: vi.fn((userID: number) => of({
              userID,
              userName: userID === 15 ? 'maria' : 'pedro',
              name: userID === 15 ? 'María' : 'Pedro',
              apPaterno: userID === 15 ? 'López' : 'Gómez',
              apMaterno: userID === 15 ? 'Ruiz' : 'López',
              email: userID === 15 ? 'maria@example.test' : 'pedro@example.test',
              active: true,
              role: userID === 15 ? 'AGENT' : 'ADMIN',
              areaID: userID === 15 ? 1 : null,
              areaName: userID === 15 ? 'Soporte' : null,
              createBy: null,
              createDate: null,
              updatedBy: null,
              updatedDate: null,
              deletedBy: null,
              deletedDate: null,
            })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetail);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads and displays ticket information in the detail page', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(ticketService.getTicketByID).toHaveBeenCalledWith(7);
    expect(compiled.querySelector('h1')?.textContent).toContain('No puedo iniciar sesión');
    expect(compiled.textContent).toContain('#TK-000007');
    expect(compiled.textContent).toContain('La página muestra un error al ingresar.');
    expect(compiled.textContent).toContain('María López Ruiz');
    expect(TestBed.inject(UserService).getUserByID).toHaveBeenCalledWith(15);
    expect(compiled.textContent).not.toContain('Evidencias adjuntas');
  });

  it('creates and displays a follow-up comment', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const textarea = compiled.querySelector('textarea[name="comment"]') as HTMLTextAreaElement;
    textarea.value = 'Se está revisando el problema.';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(ticketService.createTicketComment).toHaveBeenCalledWith({
      message: 'Se está revisando el problema.',
      ticket: 7,
      user: 9,
    });
    expect(compiled.textContent).toContain('Se está revisando el problema.');
    expect(compiled.textContent).toContain('Atención');
    expect(compiled.textContent).toContain('Pedro Gómez López');
  });

  it('loads the comment author by userID through UserService', () => {
    const userService = TestBed.inject(UserService);
    fixture.componentInstance['loadCommentUsers']([{
      message: 'Estoy revisando el caso.',
      user: { userID: 15 },
    }]);

    expect(userService.getUserByID).toHaveBeenCalledWith(15);
    expect(fixture.componentInstance['commentAuthor']({
      message: 'Estoy revisando el caso.',
      user: 15,
    })).toBe('María López Ruiz');
  });

  it('does not use the session user as a comment author when comment user data is unresolved', () => {
    expect(fixture.componentInstance['commentAuthor']({
      message: 'Comentario sin datos de usuario',
      user: 9,
    })).toBe('Usuario #9');
  });

  it('renders formatted ticket descriptions as safe rich text', () => {
    fixture.componentInstance['ticket'].update((ticket) =>
      ticket
        ? {
            ...ticket,
            description: '<p><strong>Texto importante</strong><img src=x onerror=alert(1)></p>',
          }
        : ticket,
    );
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.ticket-rich-text strong')?.textContent).toBe('Texto importante');
    expect(compiled.querySelector('.ticket-rich-text img')).toBeNull();
  });

  it('provides a link back to the ticket list', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('a[routerLink="/ticket"]')).not.toBeNull();
  });
});

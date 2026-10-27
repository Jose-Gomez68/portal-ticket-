import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AreaService } from '../area/service/area.service';
import { PriorityService } from '../priority/service/priority.service';
import { ProjectService } from '../project/service/project.service';
import { StatusService } from '../status/service/status.service';
import { KindService } from '../type/service/kind.service';
import { UserService } from '../user/service/user.service';
import { TicketService } from './service/ticket.service';
import { Ticket } from './ticket';

describe('Ticket', () => {
  let fixture: ComponentFixture<Ticket>;
  const ticketService = {
    getAllActiveTickets: vi.fn(() =>
      of({
        totalItems: 11,
        page: 0,
        size: 10,
        response: [{
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
        }],
      }),
    ),
    createTicket: vi.fn(() => of({ ticketID: 8, title: 'Nuevo ticket' })),
    updateTicket: vi.fn(() => of({ ticketID: 7, title: 'Ticket actualizado' })),
  };
  const router = { navigate: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const activeCommands = new Set<string>();
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn((command: string) => {
        if (
          [
            'bold',
            'italic',
            'underline',
            'insertUnorderedList',
            'insertOrderedList',
            'justifyLeft',
            'justifyCenter',
            'justifyRight',
            'justifyFull',
          ].includes(command)
        ) {
          if (activeCommands.has(command)) {
            activeCommands.delete(command);
          } else {
            activeCommands.add(command);
          }
        }
        return true;
      }),
    });
    Object.defineProperty(document, 'queryCommandState', {
      configurable: true,
      value: vi.fn((command: string) => activeCommands.has(command)),
    });
    await TestBed.configureTestingModule({
      imports: [Ticket],
      providers: [
        { provide: TicketService, useValue: ticketService },
        { provide: Router, useValue: router },
        {
          provide: ProjectService,
          useValue: { getAllProjects: () => of({ totalItems: 0, page: 0, size: 100, response: [] }) },
        },
        { provide: AreaService, useValue: { getAll: () => of([]) } },
        { provide: KindService, useValue: { getAllKinds: () => of([]) } },
        { provide: PriorityService, useValue: { getAllPriorities: () => of([]) } },
        {
          provide: StatusService,
          useValue: {
            getAllStatuses: () => of([{
              statusID: 3,
              name: 'Pendiente',
              descrip: 'Ticket pendiente',
              backgroundColor: '#fef3c7',
              dotColor: '#b45309',
            }]),
          },
        },
        { provide: UserService, useValue: { getAllUsers: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Ticket);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders the active ticket table with pagination', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Tickets');
    expect(compiled.querySelector('tbody')?.textContent).toContain('No puedo iniciar sesión');
    expect(compiled.querySelector('app-pagination')).not.toBeNull();
    expect(compiled.textContent).toContain('11 activos');
  });

  it('loads the first page of tickets using the default page size', () => {
    expect(ticketService.getAllActiveTickets).toHaveBeenCalledWith(0, 10);
  });

  it('includes tickets on the selected local end date regardless of their UTC date', () => {
    const createdAt = new Date(2026, 9, 26, 23, 30).toISOString();
    const localDate = new Date(createdAt);
    const selectedDate = [
      localDate.getFullYear(),
      String(localDate.getMonth() + 1).padStart(2, '0'),
      String(localDate.getDate()).padStart(2, '0'),
    ].join('-');
    const component = fixture.componentInstance;

    component['tickets'].update((tickets) =>
      tickets.map((ticket) => ({ ...ticket, createdDate: createdAt })),
    );
    component['startDate'].set(selectedDate);
    component['endDate'].set(selectedDate);

    expect(component['filteredTickets']().map((ticket) => ticket.ticketID)).toEqual([7]);
  });

  it('requests the next page when the pagination control changes pages', () => {
    const nextButton = fixture.nativeElement.querySelector(
      'button[aria-label="Página siguiente"]',
    ) as HTMLButtonElement;

    nextButton.click();

    expect(ticketService.getAllActiveTickets).toHaveBeenLastCalledWith(1, 10);
  });

  it('navigates to the standalone detail route when opening a ticket', () => {
    fixture.componentInstance['viewTicket']({
      ticketID: 7,
      title: 'No puedo iniciar sesión',
      description: null,
      active: true,
      createdDate: null,
      updatedDate: null,
      kind: null,
      user: null,
      assignedID: null,
      project: null,
      areaID: null,
      priorityID: null,
      statusID: null,
      comments: [],
    });

    expect(router.navigate).toHaveBeenCalledWith(['/ticket', 7]);
  });

  it('selects Pendiente by default when creating a ticket', () => {
    fixture.componentInstance['openCreateModal']();

    expect(fixture.componentInstance['newTicket'].statusID).toBe(3);
  });

  it('defaults an unassigned ticket status to Pendiente when editing', () => {
    fixture.componentInstance['editTicket']({
      ticketID: 7,
      title: 'Ticket sin estado',
      description: null,
      active: true,
      createdDate: null,
      updatedDate: null,
      kind: null,
      user: null,
      assignedID: null,
      project: null,
      areaID: null,
      priorityID: null,
      statusID: null,
      comments: [],
    });

    expect(fixture.componentInstance['newTicket'].statusID).toBe(3);
  });

  it('keeps the current status when editing a ticket that already has one', () => {
    fixture.componentInstance['editTicket']({
      ticketID: 7,
      title: 'Ticket existente',
      description: null,
      active: true,
      createdDate: null,
      updatedDate: null,
      kind: null,
      user: null,
      assignedID: null,
      project: null,
      areaID: null,
      priorityID: null,
      statusID: {
        statusID: 8,
        name: 'En proceso',
        descrip: 'En atención',
        backgroundColor: '#eef2ff',
        dotColor: '#4f46e5',
      },
      comments: [],
    });

    expect(fixture.componentInstance['newTicket'].statusID).toBe(8);
  });

  it('maps form relationship IDs to the API ticket fields when creating', () => {
    fixture.componentInstance['openCreateModal']();
    fixture.componentInstance['newTicket'] = {
      title: 'Nuevo ticket',
      description: 'Detalle',
      kindID: 4,
      userID: 9,
      assignedID: 2,
      projectID: 6,
      areaID: 2,
      priorityID: 2,
      statusID: 3,
    };
    fixture.componentInstance['saveTicket']();

    expect(ticketService.createTicket).toHaveBeenCalledWith({
      title: 'Nuevo ticket',
      description: 'Detalle',
      kind: 4,
      user: 9,
      assignedID: 2,
      project: 6,
      areaID: 2,
      priorityID: 2,
      statusID: 3,
    });
  });

  it('uses native formatting commands and reflects their toggled state', () => {
    fixture.componentInstance['openCreateModal']();
    fixture.detectChanges();

    const boldButton = fixture.nativeElement.querySelector(
      'button[aria-label="Negrita"]',
    ) as HTMLButtonElement;
    boldButton.click();
    fixture.detectChanges();

    expect(document.execCommand).toHaveBeenCalledWith('bold', false);
    expect(boldButton.getAttribute('aria-pressed')).toBe('true');

    boldButton.click();
    fixture.detectChanges();

    expect(document.execCommand).toHaveBeenCalledTimes(3);
    expect(document.execCommand).toHaveBeenLastCalledWith('bold', false);
    expect(boldButton.getAttribute('aria-pressed')).toBe('false');
  });

  it('does not turn a normal editor click into a formatting command', () => {
    fixture.componentInstance['openCreateModal']();
    fixture.detectChanges();
    const editor = fixture.nativeElement.querySelector(
      '.ticket-description-editor',
    ) as HTMLDivElement;
    editor.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.execCommand).not.toHaveBeenCalledWith('bold', false);
  });

  it('uses the native numbered-list command', () => {
    fixture.componentInstance['openCreateModal']();
    fixture.detectChanges();

    const listButton = fixture.nativeElement.querySelector(
      'button[aria-label="Lista numerada"]',
    ) as HTMLButtonElement;
    listButton.click();
    fixture.detectChanges();

    expect(document.execCommand).toHaveBeenCalledWith('insertOrderedList', false);
    expect(listButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('provides a native full-justification command', () => {
    fixture.componentInstance['openCreateModal']();
    fixture.detectChanges();

    const justifyButton = fixture.nativeElement.querySelector(
      'button[aria-label="Justificar"]',
    ) as HTMLButtonElement;
    justifyButton.click();
    fixture.detectChanges();

    expect(document.execCommand).toHaveBeenCalledWith('justifyFull', false);
    expect(justifyButton.getAttribute('aria-pressed')).toBe('true');
  });
});

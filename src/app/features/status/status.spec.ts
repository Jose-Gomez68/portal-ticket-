import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Status } from './status';
import { StatusService } from './service/status.service';

const createStatus = (statusID: number, name: string) => ({
  statusID,
  name,
  descrip: `Descripción de ${name}`,
  backgroundColor: '#e0f2fe',
  dotColor: '#0284c7',
});

describe('Status', () => {
  let component: Status;
  let fixture: ComponentFixture<Status>;
  const statusService = {
    getAllStatuses: vi.fn(() => of([createStatus(1, 'Abierto')])),
    createStatus: vi.fn((status) => of({ ...createStatus(2, status.name), ...status })),
    updateStatus: vi.fn((status) => of({ ...createStatus(status.statusID, status.name), ...status })),
    deleteStatus: vi.fn(() => of(undefined)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [Status],
      providers: [{ provide: StatusService, useValue: statusService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Status);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('loads and displays statuses', () => {
    expect(component['statuses']()[0].name).toBe('Abierto');
    expect(fixture.nativeElement.textContent).toContain('Estados');
  });

  it('creates a status and displays a success notification', () => {
    component['openCreateModal']();
    component['newStatus'] = {
      name: '  En progreso  ',
      descrip: '  Trabajo iniciado  ',
      backgroundColor: '#fef3c7',
      dotColor: '#92400e',
    };

    component['saveStatus']();

    expect(statusService.createStatus).toHaveBeenCalledWith({
      name: 'En progreso',
      descrip: 'Trabajo iniciado',
      backgroundColor: '#fef3c7',
      dotColor: '#92400e',
    });
    expect(component['statuses']()[0].name).toBe('En progreso');
    expect(component['toastMessage']()?.title).toBe('Estado creado');
  });

  it('updates an existing status', () => {
    const status = createStatus(1, 'Abierto');
    component['editStatus'](status);
    component['newStatus'] = {
      name: 'En espera',
      descrip: 'Pendiente de respuesta',
      backgroundColor: '#fef3c7',
      dotColor: '#92400e',
    };

    component['saveStatus']();

    expect(statusService.updateStatus).toHaveBeenCalledWith({
      statusID: 1,
      name: 'En espera',
      descrip: 'Pendiente de respuesta',
      backgroundColor: '#fef3c7',
      dotColor: '#92400e',
    });
    expect(component['statuses']()[0].name).toBe('En espera');
  });

  it('deletes a status after confirmation', () => {
    const status = createStatus(1, 'Abierto');
    component['openDeleteConfirmation'](status);
    component['deleteStatus']();

    expect(statusService.deleteStatus).toHaveBeenCalledWith(1);
    expect(component['statuses']()).toEqual([]);
    expect(component['toastMessage']()?.title).toBe('Estado eliminado');
  });

  it('filters statuses by name', () => {
    component['statuses'].set([createStatus(1, 'Abierto'), createStatus(2, 'Cerrado')]);
    component['updateSearch']({ target: { value: 'cerr' } } as unknown as Event);

    expect(component['filteredStatuses']().map((status) => status.name)).toEqual(['Cerrado']);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Priority } from './priority';
import { PriorityService } from './service/priority.service';

const createPriority = (
  priorityID: number,
  name: string,
  active = true,
  backgroundColor: string | null = '#fff1f2',
  dotColor: string | null = '#e11d48',
) => ({
  priorityID,
  name,
  backgroundColor,
  dotColor,
  active,
  createdBy: null,
  createdDate: '2026-10-13T00:00:00Z',
  updatedBy: null,
  updatedDate: null,
});

describe('Priority', () => {
  let component: Priority;
  let fixture: ComponentFixture<Priority>;
  const priorityService = {
    getAllPriorities: vi.fn(() => of([createPriority(1, 'Crítica')])),
    createPriority: vi.fn((priority) => of({ ...createPriority(2, priority.name), ...priority })),
    updatePriority: vi.fn((priority) =>
      of({ ...createPriority(priority.priorityID, priority.name), ...priority }),
    ),
    deletePriority: vi.fn(() => of(undefined)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [Priority],
      providers: [{ provide: PriorityService, useValue: priorityService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Priority);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('loads and displays priorities', () => {
    expect(priorityService.getAllPriorities).toHaveBeenCalled();
    expect(component['priorities']()[0].name).toBe('Crítica');
    expect(fixture.nativeElement.textContent).toContain('Prioridades');
  });

  it('displays priorities with null colors using the default palette', () => {
    component['priorities'].set([createPriority(1, 'Baja', true, null, null)]);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('tbody tr td:nth-child(2) span');
    expect(badge.style.backgroundColor).toBe('rgb(255, 241, 242)');
    expect(badge.style.color).toBe('rgb(225, 29, 72)');
    expect(component['getColorLabel'](component['priorities']()[0])).toBe('Rojo');
  });

  it('creates a priority with only its name and selected colors', () => {
    component['openCreateModal']();
    component['newPriority'] = {
      name: '  Urgente  ',
      backgroundColor: '#fff7ed',
      dotColor: '#f97316',
    };

    component['savePriority']();

    expect(priorityService.createPriority).toHaveBeenCalledWith({
      name: 'Urgente',
      backgroundColor: '#fff7ed',
      dotColor: '#f97316',
    });
    expect(component['priorities']()[0].name).toBe('Urgente');
  });

  it('shows the API message when the priority name already exists', () => {
    priorityService.createPriority.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({
        status: 409,
        error: { success: false, message: 'Ya existe una priority con el nombre: Crítica' },
      })),
    );
    component['openCreateModal']();
    component['newPriority'] = {
      name: 'Crítica',
      backgroundColor: '#fff1f2',
      dotColor: '#e11d48',
    };

    component['savePriority']();
    fixture.detectChanges();

    expect(component['errorMessage']()).toContain(
      'Ya existe una priority con el nombre: Crítica',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Ya existe una priority con el nombre: Crítica',
    );
  });

  it('updates a priority without sending active', () => {
    component['editPriority'](createPriority(1, 'Crítica'));
    component['newPriority'] = {
      name: 'Urgente',
      backgroundColor: '#eff6ff',
      dotColor: '#2563eb',
    };

    component['savePriority']();

    expect(priorityService.updatePriority).toHaveBeenCalledWith({
      priorityID: 1,
      name: 'Urgente',
      backgroundColor: '#eff6ff',
      dotColor: '#2563eb',
    });
  });

  it('offers only a name and color selection in the form', () => {
    component['openCreateModal']();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('form input')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('button[aria-pressed]')).toHaveLength(5);
    expect(fixture.nativeElement.textContent).not.toContain('Estado inicial');
    expect(fixture.nativeElement.textContent).not.toContain('SLA');
  });

  it('deactivates a priority after calling the API', () => {
    const priority = createPriority(1, 'Crítica');
    component['openDeleteConfirmation'](priority);
    component['deletePriority']();

    expect(priorityService.deletePriority).toHaveBeenCalledWith(1);
    expect(component['priorities']()[0].active).toBe(false);
    expect(component['inactiveCount']()).toBe(1);
  });

  it('filters priorities by name and status', () => {
    component['priorities'].set([
      createPriority(1, 'Crítica'),
      createPriority(2, 'Media', false),
    ]);
    component['updateSearch']({ target: { value: 'med' } } as unknown as Event);
    component['selectedStatus'].set('inactive');

    expect(component['filteredPriorities']().map((priority) => priority.name)).toEqual(['Media']);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Type } from './type';
import { KindService } from './service/kind.service';

const createKind = (kindID: number, name: string, active: boolean | null = true) => ({
  kindID,
  name,
  active,
  createdDate: '2026-10-13T00:00:00Z',
  createdBy: null,
  updatedDate: null,
  updatedBy: null,
  deletedBy: null,
  deletedDate: null,
});

describe('Type', () => {
  let component: Type;
  let fixture: ComponentFixture<Type>;
  const kindService = {
    getAllKinds: vi.fn(() => of([createKind(1, 'Incidencia')])),
    createKind: vi.fn((kind) => of({ ...createKind(2, kind.name), ...kind })),
    updateKind: vi.fn((kind) => of({ ...createKind(kind.kindID, kind.name), ...kind })),
    deleteKind: vi.fn(() => of(undefined)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [Type],
      providers: [{ provide: KindService, useValue: kindService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Type);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads and displays types with active counts', () => {
    expect(kindService.getAllKinds).toHaveBeenCalled();
    expect(component['totalCount']()).toBe(1);
    expect(component['activeCount']()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Tipos de incidencia');
  });

  it('creates a type and displays a success notification', () => {
    component['openCreateModal']();
    component['newType'] = { name: '  Solicitud de servicio  ' };

    component['saveType']();

    expect(kindService.createKind).toHaveBeenCalledWith({
      name: 'Solicitud de servicio',
    });
    expect(component['types']()[0].name).toBe('Solicitud de servicio');
    expect(component['toastMessage']()?.title).toBe('Tipo creado');
  });

  it('updates a type', () => {
    component['editType'](createKind(1, 'Incidencia'));
    component['newType'] = { name: 'Problema' };

    component['saveType']();

    expect(kindService.updateKind).toHaveBeenCalledWith({
      kindID: 1,
      name: 'Problema',
    });
    expect(component['types']()[0].name).toBe('Problema');
  });

  it('does not offer an active status option in the create or edit form', () => {
    component['openCreateModal']();

    expect(fixture.nativeElement.querySelectorAll('input[name="typeActive"]')).toHaveLength(0);
    expect(fixture.nativeElement.textContent).not.toContain('Estado inicial / disponibilidad');

    component['editType'](createKind(1, 'Incidencia'));

    expect(fixture.nativeElement.querySelectorAll('input[name="typeActive"]')).toHaveLength(0);
    expect(fixture.nativeElement.textContent).not.toContain('Estado inicial / disponibilidad');
  });

  it('filters types by name and status', () => {
    component['types'].set([
      createKind(1, 'Incidencia'),
      createKind(2, 'Solicitud', false),
    ]);
    component['updateSearch']({ target: { value: 'solic' } } as unknown as Event);
    component['selectedStatus'].set('inactive');

    expect(component['filteredTypes']().map((type) => type.name)).toEqual(['Solicitud']);
  });

  it('omits the tickets column and hides actions for inactive types', () => {
    component['types'].set([
      createKind(1, 'Incidencia'),
      createKind(2, 'Solicitud', false),
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('thead')?.textContent).not.toContain('Tickets');
    expect(fixture.nativeElement.querySelector('[aria-label="Acciones para Incidencia"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Acciones para Solicitud"]')).toBeNull();
  });

  it('deletes a type after confirmation', () => {
    const type = createKind(1, 'Incidencia');
    component['openDeleteConfirmation'](type);
    component['deleteType']();

    expect(kindService.deleteKind).toHaveBeenCalledWith(1);
    expect(component['types']()).toEqual([]);
    expect(component['toastMessage']()?.title).toBe('Tipo eliminado');
  });
});

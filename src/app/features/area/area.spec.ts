import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Area } from './area';
import { AreaService } from './service/area.service';

const createArea = (areaID: number, name: string) => ({
  areaID,
  name,
  descrip: 'Descripción de prueba',
  active: true,
  createdDate: '2026-10-13T00:00:00Z',
  createBy: null,
  updatedDate: null,
  updatedBy: null,
});

describe('Area', () => {
  let component: Area;
  let fixture: ComponentFixture<Area>;
  const areaService = {
    getAll: vi.fn(() => of([createArea(1, 'Área inicial')])),
    create: vi.fn((area) => of({ ...createArea(2, area.name), ...area })),
    update: vi.fn((area) => of({ ...createArea(area.areaID, area.name), ...area })),
    delete: vi.fn(() => of(undefined)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [Area],
      providers: [{ provide: AreaService, useValue: areaService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Area);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the new-area dialog', () => {
    component['openModal']();

    expect(component['isModalOpen']()).toBe(true);
  });

  it('adds a new area and closes the dialog when saved', () => {
    component['openModal']();
    component['newArea'] = {
      name: 'Aplicaciones móviles',
      descrip: 'Soporte para la app',
      active: true,
    };

    component['saveArea']();

    expect(areaService.create).toHaveBeenCalledWith({
      name: 'Aplicaciones móviles',
      descrip: 'Soporte para la app',
      active: true,
    });
    expect(component['areas']()[0].name).toBe('Aplicaciones móviles');
    expect(component['isModalOpen']()).toBe(false);
    expect(component['toastMessage']()?.title).toBe('Área creada');
  });

  it('updates an area without sending generated dates or audit fields', () => {
    const firstArea = createArea(1, 'Área inicial');
    component['areas'].set([firstArea]);
    component['editArea'](firstArea);
    component['newArea'] = {
      name: 'Área editada',
      descrip: 'Descripción actualizada',
      active: false,
    };
    component['saveArea']();

    expect(areaService.update).toHaveBeenCalledWith({
      areaID: 1,
      name: 'Área editada',
      descrip: 'Descripción actualizada',
      active: false,
    });
    expect(component['areas']()[0].name).toBe('Área editada');
    expect(component['isModalOpen']()).toBe(false);
    expect(component['toastMessage']()?.title).toBe('Área actualizada');
  });

  it('deletes an area after confirmation and updates the list', () => {
    const area = createArea(1, 'Área inicial');
    component['areas'].set([area]);
    component['openDeleteConfirmation'](area);

    component['deleteArea']();

    expect(areaService.delete).toHaveBeenCalledWith(1);
    expect(component['areas']()).toEqual([]);
    expect(component['areaToDelete']()).toBeNull();
    expect(component['toastMessage']()?.title).toBe('Área eliminada');
  });

  it('does not delete an area when confirmation is canceled', () => {
    const area = createArea(1, 'Área inicial');
    component['areas'].set([area]);
    component['openDeleteConfirmation'](area);

    component['closeDeleteConfirmation']();

    expect(areaService.delete).not.toHaveBeenCalled();
    expect(component['areas']()).toEqual([area]);
    expect(component['areaToDelete']()).toBeNull();
  });

  it('paginates the filtered areas and reports the visible range', () => {
    component['areas'].set(
      Array.from({ length: 15 }, (_, index) => ({
        ...createArea(index + 8, `Área ${index + 8}`),
        name: `Área ${index + 8}`,
      })),
    );

    expect(component['visibleAreas']()).toHaveLength(10);
    expect(component['totalPages']()).toBe(2);

    component['goToPage'](2);

    expect(component['visibleAreas']()).toHaveLength(5);
  });

  it('resets to the first page when filters change', () => {
    const uniqueName = 'Área de búsqueda única';
    component['areas'].update((areas) => [
      { ...areas[0], areaID: 100, name: uniqueName, descrip: 'Texto de prueba' },
      ...areas,
    ]);
    component['currentPage'].set(2);
    component['updateSearch']({
      target: { value: uniqueName },
    } as unknown as Event);

    expect(component['currentPage']()).toBe(1);
    expect(component['filteredAreas']()).toHaveLength(1);
    expect(component['visibleAreas']()[0].name).toBe(uniqueName);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Area } from './area';

describe('Area', () => {
  let component: Area;
  let fixture: ComponentFixture<Area>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Area],
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
      description: 'Soporte para la app',
      project: 'Visión',
      active: true,
    };

    component['saveArea']();

    expect(component['areas']()[0].name).toBe('Aplicaciones móviles');
    expect(component['isModalOpen']()).toBe(false);
  });

  it('paginates the filtered areas and reports the visible range', () => {
    const firstArea = component['areas']()[0];
    component['areas'].set(
      Array.from({ length: 15 }, (_, index) => ({
        ...firstArea,
        id: index + 8,
        name: `Área ${index + 8}`,
      })),
    );

    expect(component['visibleAreas']()).toHaveLength(10);
    expect(component['firstVisibleItem']()).toBe(1);
    expect(component['lastVisibleItem']()).toBe(10);
    expect(component['totalPages']()).toBe(2);

    component['goToPage'](2);

    expect(component['visibleAreas']()).toHaveLength(5);
    expect(component['firstVisibleItem']()).toBe(11);
    expect(component['lastVisibleItem']()).toBe(15);
  });

  it('resets to the first page when filters change', () => {
    const uniqueName = 'Área de búsqueda única';
    component['areas'].update((areas) => [
      { ...areas[0], id: 100, name: uniqueName, description: 'Texto de prueba' },
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

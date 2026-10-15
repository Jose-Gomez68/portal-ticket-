import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Project } from './project';
import { ProjectService } from './service/project.service';

const createProject = (projectID: number, name: string, active = true) => ({
  projectID,
  name,
  description: `Descripción de ${name}`,
  active,
  createdBy: null,
  createdDate: '2026-10-13T00:00:00Z',
  updatedBy: null,
  updatedDate: null,
});

const createProjectPage = (response: ReturnType<typeof createProject>[], page: number, size: number, totalItems = response.length) => ({
  totalItems,
  page,
  size,
  response,
});

describe('Project', () => {
  let component: Project;
  let fixture: ComponentFixture<Project>;
  const projectService = {
    getAllProjects: vi.fn((page = 0, size = 10) => of(createProjectPage([
      createProject(1, 'Proyecto activo'),
      createProject(2, 'Proyecto inactivo', false),
    ], page, size))),
    createProject: vi.fn((project) =>
      of({ ...createProject(3, project.name, project.active), description: project.description }),
    ),
    updateProject: vi.fn((project) =>
      of({
        ...createProject(project.projectID, project.name, project.active),
        description: project.description,
      }),
    ),
    deleteProject: vi.fn(() => of(undefined)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [Project],
      providers: [{ provide: ProjectService, useValue: projectService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Project);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads projects and calculates status counts', () => {
    expect(projectService.getAllProjects).toHaveBeenCalledWith(0, 10);
    expect(component['totalCount']()).toBe(2);
    expect(component['activeCount']()).toBe(1);
    expect(component['inactiveCount']()).toBe(1);
    expect(component['isLoading']()).toBe(false);
  });

  it('filters projects by the search term', () => {
    component['selectedStatus'].set('');
    component['updateSearch']({
      target: { value: 'inactivo' },
    } as unknown as Event);

    expect(component['filteredProjects']()).toHaveLength(1);
    expect(component['filteredProjects']()[0].name).toBe('Proyecto inactivo');
  });

  it('paginates the same projects in card and table views', () => {
    const allProjects = Array.from({ length: 15 }, (_, index) =>
      createProject(index + 1, `Proyecto ${index + 1}`),
    );
    projectService.getAllProjects.mockImplementation((page = 0, size = 10) =>
      of(createProjectPage(
        allProjects.slice(page * size, (page + 1) * size),
        page,
        size,
        allProjects.length,
      )),
    );
    component['selectedStatus'].set('');
    component['loadProjects']();
    fixture.detectChanges();

    expect(component['visibleProjects']()).toHaveLength(10);
    expect(component['totalPages']()).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Mostrando 1-10 de 15 proyectos');
    expect(
      fixture.nativeElement.querySelectorAll('section[aria-label="Proyectos"] article'),
    ).toHaveLength(10);

    component['goToPage'](2);
    fixture.detectChanges();

    expect(projectService.getAllProjects).toHaveBeenLastCalledWith(1, 10);
    expect(component['visibleProjects']()).toHaveLength(5);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mostrando 11-15 de 15 proyectos');

    component['setViewMode']('table');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('section[aria-label="Proyectos"] tbody tr'),
    ).toHaveLength(5);
  });

  it('resets pagination when search, status, or page size changes', () => {
    component['projects'].set(
      Array.from({ length: 15 }, (_, index) =>
        createProject(index + 1, `Proyecto ${index + 1}`),
      ),
    );
    component['totalItems'].set(15);
    projectService.getAllProjects.mockImplementation((page = 0, size = 10) =>
      of(createProjectPage([], page, size, 15)),
    );
    component['selectedStatus'].set('');
    component['goToPage'](2);

    component['updateSearch']({
      target: { value: 'Proyecto 1' },
    } as unknown as Event);
    expect(component['currentPage']()).toBe(1);
    expect(component['searchTerm']()).toBe('Proyecto 1');

    component['goToPage'](2);
    component['updateStatusFilter']({
      target: { value: 'active' },
    } as unknown as Event);
    expect(component['currentPage']()).toBe(1);

    component['goToPage'](2);
    component['updatePageSize'](5);
    expect(component['currentPage']()).toBe(1);
    expect(component['pageSize']()).toBe(5);
    expect(projectService.getAllProjects).toHaveBeenLastCalledWith(0, 5);
  });

  it('shows the registration toast when opening the new-project modal', () => {
    component['openCreateModal']();

    expect(component['isModalOpen']()).toBe(true);
    expect(component['toastMessage']()).toEqual({
      title: 'Listo para registrar',
      message: 'Completa los campos para dar de alta el proyecto.',
    });
  });

  it('creates a project and displays a success toast', () => {
    const createdProject = {
      ...createProject(3, 'Nuevo sistema'),
      description: 'Descripción del nuevo sistema',
    };
    projectService.getAllProjects.mockReturnValueOnce(
      of(createProjectPage([createdProject], 0, 10, 3)),
    );
    component['openCreateModal']();
    component['newProject'] = {
      name: '  Nuevo sistema  ',
      description: '  Descripción del nuevo sistema  ',
      active: true,
    };

    component['saveProject']();

    expect(projectService.createProject).toHaveBeenCalledWith({
      name: 'Nuevo sistema',
      description: 'Descripción del nuevo sistema',
      active: true,
    });
    expect(component['projects']()[0].name).toBe('Nuevo sistema');
    expect(component['isModalOpen']()).toBe(false);
    expect(component['toastMessage']()?.message).toContain('Nuevo sistema');
  });

  it('opens the edit modal with the selected project and updates it', () => {
    const project = createProject(7, 'Proyecto original');
    const updatedProject = {
      ...createProject(7, 'Proyecto editado', false),
      description: 'Descripción editada',
    };
    projectService.getAllProjects.mockReturnValueOnce(
      of(createProjectPage([updatedProject], 0, 10, 1)),
    );
    component['projects'].set([project]);
    component['editProject'](project);
    component['newProject'] = {
      name: 'Proyecto editado',
      description: 'Descripción editada',
      active: false,
    };

    component['saveProject']();

    expect(component['editingProjectID']()).toBeNull();
    expect(projectService.updateProject).toHaveBeenCalledWith({
      projectID: 7,
      name: 'Proyecto editado',
      description: 'Descripción editada',
      active: false,
    });
    expect(component['projects']()[0].name).toBe('Proyecto editado');
    expect(component['isModalOpen']()).toBe(false);
    expect(component['toastMessage']()?.title).toBe('Proyecto actualizado');
  });

  it('deletes a project after confirmation and updates the list', () => {
    const project = createProject(5, 'Proyecto a eliminar');
    component['projects'].set([project]);
    component['totalItems'].set(1);
    projectService.getAllProjects.mockReturnValueOnce(
      of(createProjectPage([], 0, 10, 0)),
    );
    component['openDeleteConfirmation'](project);

    component['deleteProject']();

    expect(projectService.deleteProject).toHaveBeenCalledWith(5);
    expect(component['projects']()).toEqual([]);
    expect(component['projectToDelete']()).toBeNull();
    expect(component['toastMessage']()?.title).toBe('Proyecto eliminado');
  });

  it('automatically dismisses success notifications after five seconds', () => {
    vi.useFakeTimers();
    try {
      component['showToast']({
        title: 'Proyecto creado',
        message: 'El proyecto se creó correctamente.',
      });
      expect(component['toastMessage']()).not.toBeNull();

      vi.advanceTimersByTime(5000);

      expect(component['toastMessage']()).toBeNull();
    } finally {
      component['dismissToast']();
      vi.useRealTimers();
    }
  });
});

import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Subscription } from 'rxjs';
import { ErrorAlert } from '../../shared/ui/error-alert/error-alert';
import { FeedbackToast } from '../../shared/ui/feedback-toast/feedback-toast';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { ProjectService } from './service/project.service';
import type { NewProjectModel, ProjectModel } from './model/project.model';

@Component({
  imports: [DatePipe, ErrorAlert, FeedbackToast, FormsModule, Pagination],
  selector: 'app-project',
  templateUrl: './project.html',
  styleUrl: './project.css',
})
export class Project implements OnDestroy, OnInit {
  private readonly projectService = inject(ProjectService);
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;
  private projectPageRequest: Subscription | null = null;

  protected readonly projects = signal<ProjectModel[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly searchTerm = signal('');
  protected readonly selectedStatus = signal('active');
  protected readonly viewMode = signal<'cards' | 'table'>('cards');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly isModalOpen = signal(false);
  protected readonly editingProjectID = signal<number | null>(null);
  protected readonly openActionsMenuProjectID = signal<number | null>(null);
  protected readonly projectToDelete = signal<ProjectModel | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly toastMessage = signal<{ title: string; message: string } | null>(null);
  protected newProject: NewProjectModel = this.createEmptyProject();
  protected readonly totalCount = computed(() => this.totalItems());
  protected readonly activeCount = computed(
    () => this.projects().filter((project) => project.active).length,
  );
  protected readonly inactiveCount = computed(
    () => this.projects().filter((project) => !project.active).length,
  );

  ngOnDestroy(): void {
    this.clearToastTimeout();
    this.projectPageRequest?.unsubscribe();
  }
  protected readonly filteredProjects = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const status = this.selectedStatus();

    return this.projects().filter((project) => {
      const matchesQuery =
        !query ||
        project.name.toLocaleLowerCase().includes(query) ||
        project.description.toLocaleLowerCase().includes(query);
      const matchesStatus =
        !status || (status === 'active' ? project.active : !project.active);

      return matchesQuery && matchesStatus;
    });
  });
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize())),
  );
  protected readonly visibleProjects = computed(() => this.filteredProjects());
  ngOnInit(): void {
    this.loadProjects();
  }

  protected loadProjects(): void {
    this.projectPageRequest?.unsubscribe();
    this.errorMessage.set('');
    this.isLoading.set(true);
    this.projectPageRequest = this.projectService
      .getAllProjects(this.currentPage() - 1, this.pageSize())
      .subscribe({
        next: (result) => {
          const totalPages = Math.max(1, Math.ceil(result.totalItems / this.pageSize()));
          if (this.currentPage() > totalPages) {
            this.currentPage.set(totalPages);
            this.loadProjects();
            return;
          }

          this.projects.set(result.response);
          this.totalItems.set(result.totalItems);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('No se pudieron cargar los proyectos. Intenta nuevamente.');
          this.isLoading.set(false);
        },
      });
  }

  protected updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.resetPageForLocalFilter();
  }

  protected updateStatusFilter(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
    this.resetPageForLocalFilter();
  }

  protected updatePageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.loadProjects();
  }

  protected goToPage(page: number): void {
    const nextPage = Math.max(1, Math.min(page, this.totalPages()));
    if (nextPage !== this.currentPage()) {
      this.currentPage.set(nextPage);
      this.loadProjects();
    }
  }

  protected setViewMode(mode: 'cards' | 'table'): void {
    this.closeActionsMenu();
    this.viewMode.set(mode);
  }

  protected toggleActionsMenu(projectID: number, event: Event): void {
    event.stopPropagation();
    this.openActionsMenuProjectID.update((openProjectID) =>
      openProjectID === projectID ? null : projectID,
    );
  }

  protected closeActionsMenu(): void {
    this.openActionsMenuProjectID.set(null);
  }

  protected openCreateModal(): void {
    this.editingProjectID.set(null);
    this.newProject = this.createEmptyProject();
    this.errorMessage.set('');
    this.isModalOpen.set(true);
    this.clearToastTimeout();
    this.toastMessage.set({
      title: 'Listo para registrar',
      message: 'Completa los campos para dar de alta el proyecto.',
    });
  }

  protected editProject(project: ProjectModel): void {
    this.closeActionsMenu();
    this.editingProjectID.set(project.projectID);
    this.newProject = {
      name: project.name,
      description: project.description,
      active: project.active,
    };
    this.errorMessage.set('');
    this.isModalOpen.set(true);
  }

  protected closeCreateModal(): void {
    if (!this.isSaving()) {
      this.isModalOpen.set(false);
      this.editingProjectID.set(null);
      if (this.toastMessage()?.title === 'Listo para registrar') {
        this.dismissToast();
      }
    }
  }

  protected saveProject(): void {
    const project: NewProjectModel = {
      name: this.newProject.name.trim(),
      description: this.newProject.description.trim(),
      active: this.newProject.active,
    };

    if (!project.name || !project.description || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    const editingProjectID = this.editingProjectID();
    const saveRequest = editingProjectID === null
      ? this.projectService.createProject(project)
      : this.projectService.updateProject({ ...project, projectID: editingProjectID });

    this.projectServiceRequest(saveRequest, editingProjectID);
  }

  private projectServiceRequest(
    request: ReturnType<ProjectService['createProject']>,
    editingProjectID: number | null,
  ): void {
    request.subscribe({
      next: (createdProject) => {
        if (editingProjectID === null) {
          this.currentPage.set(1);
        }
        this.isSaving.set(false);
        this.isModalOpen.set(false);
        this.editingProjectID.set(null);
        this.loadProjects();
        this.showToast({
          title: editingProjectID === null ? 'Proyecto creado' : 'Proyecto actualizado',
          message: editingProjectID === null
            ? `El proyecto “${createdProject.name}” se creó correctamente.`
            : `El proyecto “${createdProject.name}” se actualizó correctamente.`,
        });
      },
      error: (error: unknown) => {
        this.errorMessage.set(
          `No se pudo ${editingProjectID === null ? 'crear' : 'actualizar'} el proyecto: ${getProjectErrorMessage(error)}`,
        );
        this.isSaving.set(false);
      },
    });
  }

  protected openDeleteConfirmation(project: ProjectModel): void {
    this.closeActionsMenu();
    this.errorMessage.set('');
    this.projectToDelete.set(project);
  }

  protected closeDeleteConfirmation(): void {
    if (!this.isDeleting()) {
      this.projectToDelete.set(null);
    }
  }

  protected deleteProject(): void {
    const project = this.projectToDelete();
    if (!project || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.projectService.deleteProject(project.projectID).subscribe({
      next: () => {
        const nextTotalItems = Math.max(0, this.totalItems() - 1);
        this.totalItems.set(nextTotalItems);
        this.isDeleting.set(false);
        this.projectToDelete.set(null);
        const lastPage = Math.max(1, Math.ceil(nextTotalItems / this.pageSize()));
        this.currentPage.set(Math.min(this.currentPage(), lastPage));
        this.loadProjects();
        this.showToast({
          title: 'Proyecto eliminado',
          message: `El proyecto “${project.name}” se eliminó correctamente.`,
        });
      },
      error: (error: unknown) => {
        this.errorMessage.set(
          `No se pudo eliminar el proyecto: ${getProjectErrorMessage(error)}`,
        );
        this.isDeleting.set(false);
      },
    });
  }

  protected dismissToast(): void {
    this.clearToastTimeout();
    this.toastMessage.set(null);
  }

  private showToast(toast: { title: string; message: string }): void {
    this.clearToastTimeout();
    this.toastMessage.set(toast);
    this.toastTimeout = setTimeout(() => this.dismissToast(), 5000);
  }

  private clearToastTimeout(): void {
    if (this.toastTimeout !== null) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }

  private createEmptyProject(): NewProjectModel {
    return {
      name: '',
      description: '',
      active: true,
    };
  }

  private resetPageForLocalFilter(): void {
    if (this.currentPage() !== 1) {
      this.currentPage.set(1);
      this.loadProjects();
    }
  }
}

function getProjectErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const errorObject = error as Record<string, unknown>;
    const responseBody = errorObject['error'];
    if (typeof responseBody === 'object' && responseBody !== null) {
      const message = (responseBody as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message) {
        return message;
      }
    }
  }

  return 'Intenta nuevamente.';
}

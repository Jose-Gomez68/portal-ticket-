import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ErrorAlert } from '../../shared/ui/error-alert/error-alert';
import { FeedbackToast } from '../../shared/ui/feedback-toast/feedback-toast';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { PriorityService } from './service/priority.service';
import type {
  NewPriorityModel,
  PriorityModel,
  UpdatePriorityModel,
} from './model/priority.model';

const PRIORITY_COLORS = [
  { label: 'Rojo', meaning: 'Crítico', backgroundColor: '#fff1f2', dotColor: '#e11d48' },
  { label: 'Naranja', meaning: 'Alto', backgroundColor: '#fff7ed', dotColor: '#f97316' },
  { label: 'Azul', meaning: 'Medio', backgroundColor: '#eff6ff', dotColor: '#2563eb' },
  { label: 'Gris', meaning: 'Bajo', backgroundColor: '#f1f5f9', dotColor: '#64748b' },
  { label: 'Amarillo', meaning: 'Alerta', backgroundColor: '#fffbeb', dotColor: '#f59e0b' },
] as const;

@Component({
  imports: [DatePipe, ErrorAlert, FeedbackToast, FormsModule, Pagination],
  selector: 'app-priority',
  styleUrl: './priority.css',
  templateUrl: './priority.html',
})
export class Priority implements OnDestroy, OnInit {
  private readonly priorityService = inject(PriorityService);
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly colorOptions = PRIORITY_COLORS;
  protected readonly priorities = signal<PriorityModel[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly selectedStatus = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly isModalOpen = signal(false);
  protected readonly editingPriorityID = signal<number | null>(null);
  protected readonly openActionsMenuPriorityID = signal<number | null>(null);
  protected readonly priorityToDelete = signal<PriorityModel | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly toastMessage = signal<{ title: string; message: string } | null>(null);
  protected readonly totalCount = computed(() => this.priorities().length);
  protected readonly activeCount = computed(
    () => this.priorities().filter((priority) => priority.active).length,
  );
  protected readonly inactiveCount = computed(
    () => this.priorities().filter((priority) => !priority.active).length,
  );
  protected readonly filteredPriorities = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const status = this.selectedStatus();

    return this.priorities().filter((priority) => {
      const matchesQuery = !query || priority.name.toLocaleLowerCase().includes(query);
      const matchesStatus =
        !status || (status === 'active' ? priority.active : !priority.active);
      return matchesQuery && matchesStatus;
    });
  });
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredPriorities().length / this.pageSize())),
  );
  protected readonly visiblePriorities = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const startIndex = (page - 1) * this.pageSize();
    return this.filteredPriorities().slice(startIndex, startIndex + this.pageSize());
  });
  protected newPriority: NewPriorityModel = this.createEmptyPriority();

  ngOnInit(): void {
    this.loadPriorities();
  }

  ngOnDestroy(): void {
    this.clearToastTimeout();
  }

  protected loadPriorities(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.priorityService.getAllPriorities().subscribe({
      next: (priorities) => {
        this.priorities.set(priorities);
        this.isLoading.set(false);
        this.goToPage(this.currentPage());
      },
      error: (error: unknown) => {
        this.errorMessage.set(`No se pudieron cargar las prioridades: ${getErrorMessage(error)}`);
        this.isLoading.set(false);
      },
    });
  }

  protected openCreateModal(): void {
    this.errorMessage.set('');
    this.editingPriorityID.set(null);
    this.newPriority = this.createEmptyPriority();
    this.isModalOpen.set(true);
  }

  protected editPriority(priority: PriorityModel): void {
    this.closeActionsMenu();
    this.errorMessage.set('');
    this.editingPriorityID.set(priority.priorityID);
    this.newPriority = {
      name: priority.name,
      backgroundColor: this.getBackgroundColor(priority),
      dotColor: this.getDotColor(priority),
    };
    this.isModalOpen.set(true);
  }

  protected toggleActionsMenu(priorityID: number, event: Event): void {
    event.stopPropagation();
    this.openActionsMenuPriorityID.update((openPriorityID) =>
      openPriorityID === priorityID ? null : priorityID,
    );
  }

  protected closeActionsMenu(): void {
    this.openActionsMenuPriorityID.set(null);
  }

  protected chooseColor(color: (typeof PRIORITY_COLORS)[number]): void {
    this.newPriority = {
      ...this.newPriority,
      backgroundColor: color.backgroundColor,
      dotColor: color.dotColor,
    };
  }

  protected getColorLabel(priority: PriorityModel): string {
    return PRIORITY_COLORS.find(
      (color) =>
        color.backgroundColor === this.getBackgroundColor(priority) &&
        color.dotColor === this.getDotColor(priority),
    )?.label ?? 'Personalizado';
  }

  protected getBackgroundColor(priority: PriorityModel): string {
    return priority.backgroundColor ?? PRIORITY_COLORS[0].backgroundColor;
  }

  protected getDotColor(priority: PriorityModel): string {
    return priority.dotColor ?? PRIORITY_COLORS[0].dotColor;
  }

  protected openDeleteConfirmation(priority: PriorityModel): void {
    this.closeActionsMenu();
    this.priorityToDelete.set(priority);
  }

  protected closeDeleteConfirmation(): void {
    if (!this.isDeleting()) {
      this.priorityToDelete.set(null);
    }
  }

  protected deletePriority(): void {
    const priority = this.priorityToDelete();
    if (!priority || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.priorityService.deletePriority(priority.priorityID).subscribe({
      next: () => {
        this.priorities.update((priorities) =>
          priorities.map((currentPriority) =>
            currentPriority.priorityID === priority.priorityID
              ? { ...currentPriority, active: false }
              : currentPriority,
          ),
        );
        this.isDeleting.set(false);
        this.priorityToDelete.set(null);
        this.showToast({
          title: 'Prioridad desactivada',
          message: `La prioridad “${priority.name}” se desactivó correctamente.`,
        });
        this.goToPage(this.currentPage());
      },
      error: (error: unknown) => {
        this.errorMessage.set(`No se pudo desactivar la prioridad: ${getErrorMessage(error)}`);
        this.isDeleting.set(false);
      },
    });
  }

  protected closeModal(): void {
    if (!this.isSaving()) {
      this.isModalOpen.set(false);
      this.editingPriorityID.set(null);
    }
  }

  protected updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  protected updateStatusFilter(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  protected updatePageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  protected savePriority(): void {
    const priority: NewPriorityModel = {
      name: this.newPriority.name.trim(),
      backgroundColor: this.newPriority.backgroundColor,
      dotColor: this.newPriority.dotColor,
    };
    if (!priority.name || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    const editingPriorityID = this.editingPriorityID();
    if (editingPriorityID !== null) {
      const payload: UpdatePriorityModel = { ...priority, priorityID: editingPriorityID };
      this.priorityService.updatePriority(payload).subscribe({
        next: (updatedPriority) => {
          this.priorities.update((priorities) =>
            priorities.map((currentPriority) =>
              currentPriority.priorityID === updatedPriority.priorityID
                ? updatedPriority
                : currentPriority,
            ),
          );
          this.isSaving.set(false);
          this.closeModal();
          this.showToast({
            title: 'Prioridad actualizada',
            message: `La prioridad “${updatedPriority.name}” se actualizó correctamente.`,
          });
        },
        error: (error: unknown) => {
          this.errorMessage.set(`No se pudo actualizar la prioridad: ${getErrorMessage(error)}`);
          this.isSaving.set(false);
        },
      });
      return;
    }

    this.priorityService.createPriority(priority).subscribe({
      next: (createdPriority) => {
        this.priorities.update((priorities) => [createdPriority, ...priorities]);
        this.isSaving.set(false);
        this.closeModal();
        this.currentPage.set(1);
        this.showToast({
          title: 'Prioridad creada',
          message: `La prioridad “${createdPriority.name}” se creó correctamente.`,
        });
      },
      error: (error: unknown) => {
        this.errorMessage.set(`No se pudo guardar la prioridad: ${getErrorMessage(error)}`);
        this.isSaving.set(false);
      },
    });
  }

  protected dismissToast(): void {
    this.clearToastTimeout();
    this.toastMessage.set(null);
  }

  private createEmptyPriority(): NewPriorityModel {
    return {
      name: '',
      backgroundColor: PRIORITY_COLORS[0].backgroundColor,
      dotColor: PRIORITY_COLORS[0].dotColor,
    };
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
}

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const response = error.error;
    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response &&
      typeof response.message === 'string'
    ) {
      return response.message;
    }
  }

  return error instanceof Error && error.message
    ? error.message
    : 'Intenta nuevamente.';
}

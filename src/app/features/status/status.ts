import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ErrorAlert } from '../../shared/ui/error-alert/error-alert';
import { FeedbackToast } from '../../shared/ui/feedback-toast/feedback-toast';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { StatusService } from './service/status.service';
import type { NewStatusModel, StatusModel, UpdateStatusModel } from './model/status.model';

@Component({
  imports: [ErrorAlert, FeedbackToast, FormsModule, Pagination],
  selector: 'app-status',
  styleUrl: './status.css',
  templateUrl: './status.html',
})
export class Status implements OnDestroy, OnInit {
  private readonly statusService = inject(StatusService);
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly statuses = signal<StatusModel[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly isModalOpen = signal(false);
  protected readonly editingStatusID = signal<number | null>(null);
  protected readonly openActionsMenuStatusID = signal<number | null>(null);
  protected readonly statusToDelete = signal<StatusModel | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly toastMessage = signal<{ title: string; message: string } | null>(null);
  protected readonly totalCount = computed(() => this.statuses().length);
  protected readonly filteredStatuses = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();

    return this.statuses().filter((status) => {
      return (
        !query ||
        status.name.toLocaleLowerCase().includes(query) ||
        status.descrip.toLocaleLowerCase().includes(query)
      );
    });
  });
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredStatuses().length / this.pageSize())),
  );
  protected readonly visibleStatuses = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const startIndex = (page - 1) * this.pageSize();

    return this.filteredStatuses().slice(startIndex, startIndex + this.pageSize());
  });
  protected newStatus: NewStatusModel = this.createEmptyStatus();

  ngOnInit(): void {
    this.loadStatuses();
  }

  ngOnDestroy(): void {
    this.clearToastTimeout();
  }

  protected loadStatuses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.statusService.getAllStatuses().subscribe({
      next: (statuses) => {
        this.statuses.set(statuses);
        this.isLoading.set(false);
        this.goToPage(this.currentPage());
      },
      error: (error: unknown) => {
        this.errorMessage.set(`No se pudieron cargar los estados: ${getErrorMessage(error)}`);
        this.isLoading.set(false);
      },
    });
  }

  protected openCreateModal(): void {
    this.editingStatusID.set(null);
    this.newStatus = this.createEmptyStatus();
    this.isModalOpen.set(true);
  }

  protected editStatus(status: StatusModel): void {
    this.closeActionsMenu();
    this.editingStatusID.set(status.statusID);
    this.newStatus = {
      name: status.name,
      descrip: status.descrip,
      backgroundColor: status.backgroundColor,
      dotColor: status.dotColor,
    };
    this.isModalOpen.set(true);
  }

  protected toggleActionsMenu(statusID: number, event: Event): void {
    event.stopPropagation();
    this.openActionsMenuStatusID.update((openStatusID) =>
      openStatusID === statusID ? null : statusID,
    );
  }

  protected closeActionsMenu(): void {
    this.openActionsMenuStatusID.set(null);
  }

  protected openDeleteConfirmation(status: StatusModel): void {
    this.closeActionsMenu();
    this.statusToDelete.set(status);
  }

  protected closeDeleteConfirmation(): void {
    if (!this.isDeleting()) {
      this.statusToDelete.set(null);
    }
  }

  protected deleteStatus(): void {
    const status = this.statusToDelete();
    if (!status || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.statusService.deleteStatus(status.statusID).subscribe({
      next: () => {
        this.statuses.update((statuses) =>
          statuses.filter((currentStatus) => currentStatus.statusID !== status.statusID),
        );
        this.isDeleting.set(false);
        this.statusToDelete.set(null);
        this.showToast({
          title: 'Estado eliminado',
          message: `El estado “${status.name}” se eliminó correctamente.`,
        });
        this.goToPage(this.currentPage());
      },
      error: (error: unknown) => {
        this.errorMessage.set(`No se pudo eliminar el estado: ${getErrorMessage(error)}`);
        this.isDeleting.set(false);
      },
    });
  }

  protected closeModal(): void {
    if (!this.isSaving()) {
      this.isModalOpen.set(false);
      this.editingStatusID.set(null);
    }
  }

  protected updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  protected updatePageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  protected saveStatus(): void {
    const status: NewStatusModel = {
      name: this.newStatus.name.trim(),
      descrip: this.newStatus.descrip.trim(),
      backgroundColor: this.newStatus.backgroundColor,
      dotColor: this.newStatus.dotColor,
    };
    if (!status.name || !status.descrip || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    const editingStatusID = this.editingStatusID();
    if (editingStatusID !== null) {
      const payload: UpdateStatusModel = { ...status, statusID: editingStatusID };
      this.statusService.updateStatus(payload).subscribe({
        next: (updatedStatus) => {
          this.statuses.update((statuses) =>
            statuses.map((currentStatus) =>
              currentStatus.statusID === updatedStatus.statusID ? updatedStatus : currentStatus,
            ),
          );
          this.isSaving.set(false);
          this.closeModal();
          this.showToast({
            title: 'Estado actualizado',
            message: `El estado “${updatedStatus.name}” se actualizó correctamente.`,
          });
        },
        error: (error: unknown) => {
          this.errorMessage.set(`No se pudo actualizar el estado: ${getErrorMessage(error)}`);
          this.isSaving.set(false);
        },
      });
      return;
    }

    this.statusService.createStatus(status).subscribe({
      next: (createdStatus) => {
        this.statuses.update((statuses) => [createdStatus, ...statuses]);
        this.isSaving.set(false);
        this.closeModal();
        this.currentPage.set(1);
        this.showToast({
          title: 'Estado creado',
          message: `El estado “${createdStatus.name}” se creó correctamente.`,
        });
      },
      error: (error: unknown) => {
        this.errorMessage.set(`No se pudo crear el estado: ${getErrorMessage(error)}`);
        this.isSaving.set(false);
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

  private createEmptyStatus(): NewStatusModel {
    return {
      name: '',
      descrip: '',
      backgroundColor: '#e0f2fe',
      dotColor: '#0284c7',
    };
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'Intenta nuevamente.';
}

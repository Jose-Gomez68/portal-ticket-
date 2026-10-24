import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ErrorAlert } from '../../shared/ui/error-alert/error-alert';
import { FeedbackToast } from '../../shared/ui/feedback-toast/feedback-toast';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { KindService } from './service/kind.service';
import type { KindModel, NewKindModel, UpdateKindModel } from './model/kind.model';

@Component({
  imports: [DatePipe, ErrorAlert, FeedbackToast, FormsModule, Pagination],
  selector: 'app-type',
  templateUrl: './type.html',
  styleUrl: './type.css',
})
export class Type implements OnDestroy, OnInit {
  private readonly kindService = inject(KindService);
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly types = signal<KindModel[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly selectedStatus = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly isModalOpen = signal(false);
  protected readonly editingTypeID = signal<number | null>(null);
  protected readonly openActionsMenuTypeID = signal<number | null>(null);
  protected readonly typeToDelete = signal<KindModel | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly toastMessage = signal<{ title: string; message: string } | null>(null);
  protected readonly totalCount = computed(() => this.types().length);
  protected readonly activeCount = computed(
    () => this.types().filter((type) => type.active === true).length,
  );
  protected readonly inactiveCount = computed(
    () => this.types().filter((type) => type.active !== true).length,
  );
  protected readonly filteredTypes = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const status = this.selectedStatus();

    return this.types().filter((type) => {
      const matchesQuery = !query || type.name.toLocaleLowerCase().includes(query);
      const matchesStatus =
        !status || (status === 'active' ? type.active === true : type.active !== true);

      return matchesQuery && matchesStatus;
    });
  });
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredTypes().length / this.pageSize())),
  );
  protected readonly visibleTypes = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const startIndex = (page - 1) * this.pageSize();

    return this.filteredTypes().slice(startIndex, startIndex + this.pageSize());
  });
  protected newType: NewKindModel = this.createEmptyType();

  ngOnInit(): void {
    this.loadTypes();
  }

  ngOnDestroy(): void {
    this.clearToastTimeout();
  }

  protected loadTypes(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.kindService.getAllKinds().subscribe({
      next: (types) => {
        this.types.set(types);
        this.isLoading.set(false);
        this.goToPage(this.currentPage());
      },
      error: (error: unknown) => {
        this.errorMessage.set(`No se pudieron cargar los tipos: ${getErrorMessage(error)}`);
        this.isLoading.set(false);
      },
    });
  }

  protected openCreateModal(): void {
    this.editingTypeID.set(null);
    this.newType = this.createEmptyType();
    this.isModalOpen.set(true);
  }

  protected editType(type: KindModel): void {
    this.closeActionsMenu();
    this.editingTypeID.set(type.kindID);
    this.newType = {
      name: type.name,
    };
    this.isModalOpen.set(true);
  }

  protected toggleActionsMenu(typeID: number, event: Event): void {
    event.stopPropagation();
    this.openActionsMenuTypeID.update((openTypeID) =>
      openTypeID === typeID ? null : typeID,
    );
  }

  protected closeActionsMenu(): void {
    this.openActionsMenuTypeID.set(null);
  }

  protected openDeleteConfirmation(type: KindModel): void {
    this.closeActionsMenu();
    this.typeToDelete.set(type);
  }

  protected closeDeleteConfirmation(): void {
    if (!this.isDeleting()) {
      this.typeToDelete.set(null);
    }
  }

  protected deleteType(): void {
    const type = this.typeToDelete();
    if (!type || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.kindService.deleteKind(type.kindID).subscribe({
      next: () => {
        this.types.update((types) =>
          types.filter((currentType) => currentType.kindID !== type.kindID),
        );
        this.isDeleting.set(false);
        this.typeToDelete.set(null);
        this.showToast({
          title: 'Tipo eliminado',
          message: `El tipo “${type.name}” se eliminó correctamente.`,
        });
        this.goToPage(this.currentPage());
      },
      error: (error: unknown) => {
        this.errorMessage.set(`No se pudo eliminar el tipo: ${getErrorMessage(error)}`);
        this.isDeleting.set(false);
      },
    });
  }

  protected closeModal(): void {
    if (!this.isSaving()) {
      this.isModalOpen.set(false);
      this.editingTypeID.set(null);
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

  protected getTypeCode(type: KindModel): string {
    return `KIND-${String(type.kindID).padStart(3, '0')}`;
  }

  protected saveType(): void {
    const type: NewKindModel = {
      name: this.newType.name.trim(),
    };
    if (!type.name || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    const editingTypeID = this.editingTypeID();
    if (editingTypeID !== null) {
      const payload: UpdateKindModel = { ...type, kindID: editingTypeID };
      this.kindService.updateKind(payload).subscribe({
        next: (updatedType) => {
          this.types.update((types) =>
            types.map((currentType) =>
              currentType.kindID === updatedType.kindID ? updatedType : currentType,
            ),
          );
          this.isSaving.set(false);
          this.closeModal();
          this.showToast({
            title: 'Tipo actualizado',
            message: `El tipo “${updatedType.name}” se actualizó correctamente.`,
          });
        },
        error: (error: unknown) => {
          this.errorMessage.set(`No se pudo actualizar el tipo: ${getErrorMessage(error)}`);
          this.isSaving.set(false);
        },
      });
      return;
    }

    this.kindService.createKind(type).subscribe({
      next: (createdType) => {
        this.types.update((types) => [createdType, ...types]);
        this.isSaving.set(false);
        this.closeModal();
        this.currentPage.set(1);
        this.showToast({
          title: 'Tipo creado',
          message: `El tipo “${createdType.name}” se creó correctamente.`,
        });
      },
      error: (error: unknown) => {
        this.errorMessage.set(`No se pudo guardar el tipo: ${getErrorMessage(error)}`);
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

  private createEmptyType(): NewKindModel {
    return {
      name: '',
    };
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'Intenta nuevamente.';
}

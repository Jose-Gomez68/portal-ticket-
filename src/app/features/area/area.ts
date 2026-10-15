import { DatePipe } from '@angular/common';
import { computed, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ErrorAlert } from '../../shared/ui/error-alert/error-alert';
import { FeedbackToast } from '../../shared/ui/feedback-toast/feedback-toast';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { AreaService } from './service/area.service';
import type { AreaModel, NewAreaModel, UpdateAreaModel } from './model/area.model';

@Component({
  imports: [FormsModule, DatePipe, ErrorAlert, FeedbackToast, Pagination],
  selector: 'app-area',
  styleUrl: './area.css',
  templateUrl: './area.html',
})
export class Area implements OnDestroy, OnInit {
  private readonly areaService = inject(AreaService);
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly areas = signal<AreaModel[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly selectedStatus = signal('active');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly isModalOpen = signal(false);
  protected readonly editingAreaId = signal<number | null>(null);
  protected readonly openActionsMenuAreaId = signal<number | null>(null);
  protected readonly areaToDelete = signal<AreaModel | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly toastMessage = signal<{ title: string; message: string } | null>(null);
  protected readonly totalCount = computed(() => this.areas().length);
  protected readonly activeCount = computed(
    () => this.areas().filter((area) => area.active).length,
  );
  protected readonly inactiveCount = computed(
    () => this.areas().filter((area) => !area.active).length,
  );

  ngOnDestroy(): void {
    this.clearToastTimeout();
  }
  protected readonly filteredAreas = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const status = this.selectedStatus();

    return this.areas().filter((area) => {
      const matchesQuery =
        !query ||
        area.name.toLocaleLowerCase().includes(query) ||
        area.descrip.toLocaleLowerCase().includes(query);
      const matchesStatus =
        !status || (status === 'active' ? area.active : !area.active);

      return matchesQuery && matchesStatus;
    });
  });
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredAreas().length / this.pageSize())),
  );
  protected readonly visibleAreas = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const startIndex = (page - 1) * this.pageSize();

    return this.filteredAreas().slice(startIndex, startIndex + this.pageSize());
  });
  protected newArea: NewAreaModel = this.createEmptyArea();

  ngOnInit(): void {
    this.loadAreas();
  }

  protected loadAreas(): void {
    this.errorMessage.set('');
    this.areaService.getAll().subscribe({
      next: (areas) => this.areas.set(areas),
      error: () => this.errorMessage.set('No se pudieron cargar las áreas. Intenta nuevamente.'),
    });
  }

  protected openModal(): void {
    this.editingAreaId.set(null);
    this.newArea = this.createEmptyArea();
    this.isModalOpen.set(true);
  }

  protected editArea(area: AreaModel): void {
    this.closeActionsMenu();
    this.editingAreaId.set(area.areaID);
    this.newArea = {
      name: area.name,
      descrip: area.descrip,
      active: area.active,
    };
    this.isModalOpen.set(true);
  }

  protected toggleActionsMenu(areaID: number, event: Event): void {
    event.stopPropagation();
    this.openActionsMenuAreaId.update((openAreaID) =>
      openAreaID === areaID ? null : areaID,
    );
  }

  protected closeActionsMenu(): void {
    this.openActionsMenuAreaId.set(null);
  }

  protected openDeleteConfirmation(area: AreaModel): void {
    this.closeActionsMenu();
    this.areaToDelete.set(area);
  }

  protected closeDeleteConfirmation(): void {
    if (!this.isDeleting()) {
      this.areaToDelete.set(null);
    }
  }

  protected deleteArea(): void {
    const area = this.areaToDelete();
    if (!area || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.areaService.delete(area.areaID).subscribe({
      next: () => {
        this.areas.update((areas) =>
          areas.filter((currentArea) => currentArea.areaID !== area.areaID),
        );
        this.isDeleting.set(false);
        this.areaToDelete.set(null);
        this.showToast({
          title: 'Área eliminada',
          message: `El área “${area.name}” se eliminó correctamente.`,
        });
        this.goToPage(this.currentPage());
      },
      error: (error: unknown) => {
        this.errorMessage.set(
          `No se pudo eliminar el área: ${getOperationErrorMessage(error, 'Intenta nuevamente.')}`,
        );
        this.isDeleting.set(false);
      },
    });
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
    this.editingAreaId.set(null);
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

  protected saveArea(): void {
    // Prepara el objeto con los datos permitidos para crear o actualizar un área.
    const payload: NewAreaModel = {
      // Quita espacios al inicio y al final del nombre antes de enviarlo.
      name: this.newArea.name.trim(),
      // Quita espacios al inicio y al final de la descripción antes de enviarla.
      descrip: this.newArea.descrip.trim(),
      // Conserva el estado activo o inactivo seleccionado en el formulario.
      active: this.newArea.active,
    };

    // Evita guardar campos obligatorios vacíos o iniciar otra solicitud simultánea.
    if (!payload.name || !payload.descrip || this.isSaving()) {
      // Detiene el guardado si los datos no son válidos o ya se está guardando.
      return;
    }

    // Obtiene el identificador del área que se está editando, si existe.
    const editingAreaId = this.editingAreaId();
    // Comprueba si el formulario está en modo de edición.
    if (editingAreaId !== null) {
      // Envía los datos al flujo de actualización para el área existente.
      this.updateArea(editingAreaId, payload);
      // Evita continuar al flujo de creación después de actualizar.
      return;
    }

    // Indica que hay una solicitud en curso para evitar envíos duplicados.
    this.isSaving.set(true);
    // Limpia cualquier mensaje de error de una operación anterior.
    this.errorMessage.set('');
    // Envía el nuevo registro a la API y atiende su respuesta.
    this.areaService.create(payload).subscribe({
      // Ejecuta este bloque cuando la API crea el área correctamente.
      next: (createdArea) => {
        // Añade el área recién creada al inicio de la lista visible.
        this.areas.update((areas) => [createdArea, ...areas]);
        // Indica que la solicitud terminó.
        this.isSaving.set(false);
        // Cierra el formulario después de guardar correctamente.
        this.closeModal();
        this.showToast({
          title: 'Área creada',
          message: `El área “${createdArea.name}” se creó correctamente.`,
        });
      },
      // Ejecuta este bloque si la API no pudo crear el área.
      error: (error: unknown) => {
        // Muestra el mensaje específico de la API o un mensaje de respaldo.
        this.errorMessage.set(
          `No se pudo guardar el área: ${getOperationErrorMessage(error, 'Intenta nuevamente.')}`,
        );
        // Indica que la solicitud fallida ya terminó.
        this.isSaving.set(false);
      },
    });
  }

  protected updateArea(id: number, area: NewAreaModel): void {
    // Evita iniciar otra actualización mientras haya una solicitud en curso.
    if (this.isSaving()) {
      // Detiene la función si ya se está guardando o actualizando.
      return;
    }

    // Construye el payload con solo los campos editables aceptados por la API.
    const payload: UpdateAreaModel = {
      // Incluye el identificador que la API necesita para ubicar el área actual.
      areaID: id,
      // Quita espacios al inicio y al final del nombre.
      name: area.name.trim(),
      // Quita espacios al inicio y al final de la descripción.
      descrip: area.descrip.trim(),
      // Incluye el estado nuevo seleccionado para el área.
      active: area.active,
    };
    // Indica que la solicitud de actualización está en curso.
    this.isSaving.set(true);
    // Limpia cualquier mensaje de error de una operación anterior.
    this.errorMessage.set('');
    // Envía a la API el identificador y el payload actualizado.
    this.areaService.update(payload).subscribe({
      // Ejecuta este bloque cuando la API actualiza el área correctamente.
      next: (updatedArea) => {
        // Recorre la lista para sustituir únicamente el área actualizada.
        this.areas.update((areas) =>
          // Conserva las demás áreas y reemplaza la que coincide por ID.
          areas.map((currentArea) => currentArea.areaID === id ? updatedArea : currentArea),
        );
        // Indica que la solicitud terminó.
        this.isSaving.set(false);
        // Cierra el formulario después de actualizar correctamente.
        this.closeModal();
        this.showToast({
          title: 'Área actualizada',
          message: `El área “${updatedArea.name}” se actualizó correctamente.`,
        });
      },
      // Ejecuta este bloque si la API no pudo actualizar el área.
      error: (error: unknown) => {
        // Muestra el mensaje específico de la API o un mensaje de respaldo.
        this.errorMessage.set(
          `No se pudo actualizar el área: ${getOperationErrorMessage(error, 'Intenta nuevamente.')}`,
        );
        // Indica que la solicitud fallida ya terminó.
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

  private createEmptyArea(): NewAreaModel {
    return {
      name: '',
      descrip: '',
      active: true,
    };
  }
}

function getOperationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const errorObject = error as Record<string, unknown>;
    const responseBody = errorObject['error'];

    if (typeof responseBody === 'object' && responseBody !== null) {
      const responseMessage = (responseBody as Record<string, unknown>)['message'];
      if (typeof responseMessage === 'string' && responseMessage) {
        return responseMessage;
      }
    }

    const message = errorObject['message'];
    if (typeof message === 'string' && message) {
      return message;
    }
  }

  return fallback;
}

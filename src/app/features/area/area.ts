import { computed, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AreaModel, NewAreaModel } from './model/area.model';

@Component({
  imports: [FormsModule],
  selector: 'app-area',
  styleUrl: './area.css',
  templateUrl: './area.html',
})
export class Area {
  protected readonly areas = signal<AreaModel[]>([
    {
      id: 1,
      name: 'Reconocimiento facial',
      description: 'Módulo de detección biométrica y validación de rostro en torniquetes',
      project: 'Visión',
      ticketCount: 34,
      active: true,
      createdAt: '15 Ene 2024',
    },
    {
      id: 2,
      name: 'Registro de entrada/salida',
      description: 'Lectura de marcas horarias en quioscos y sincronización en tiempo real',
      project: 'Visión',
      ticketCount: 22,
      active: true,
      createdAt: '18 Ene 2024',
    },
    {
      id: 3,
      name: 'Sincronización',
      description: 'Conexión de bases de datos locales y endpoint central con servidor corporativo',
      project: 'Visión',
      ticketCount: 16,
      active: true,
      createdAt: '20 Ene 2024',
    },
    {
      id: 4,
      name: 'Hardware',
      description: 'Fallas en terminales biométricas, cámaras, fuentes de poder y cableado',
      project: 'Soporte Técnico',
      ticketCount: 28,
      active: true,
      createdAt: '02 Feb 2024',
    },
    {
      id: 5,
      name: 'Redes y Conectividad',
      description: 'Switches de piso, cableado estructurado, latencia en VPN y caídas de enlace',
      project: 'Soporte Técnico',
      ticketCount: 19,
      active: true,
      createdAt: '10 Feb 2024',
    },
    {
      id: 6,
      name: 'Cálculo de Nómina',
      description: 'Inconsistencias en horas extras, multiplicador nocturno y días feriados',
      project: 'Prenómina',
      ticketCount: 13,
      active: true,
      createdAt: '18 Feb 2024',
    },
    {
      id: 7,
      name: 'Impresoras y Periféricos',
      description: 'Impresoras térmicas, lectores de código de barras y terminales POS',
      project: 'Soporte Técnico',
      ticketCount: 11,
      active: false,
      createdAt: '05 Mar 2024',
    },
     {
      id: 8,
      name: 'Cálculo de Nómina',
      description: 'Inconsistencias en horas extras, multiplicador nocturno y días feriados',
      project: 'Prenómina',
      ticketCount: 13,
      active: true,
      createdAt: '18 Feb 2024',
    },
    {
      id: 9,
      name: 'Impresoras y Periféricos',
      description: 'Impresoras térmicas, lectores de código de barras y terminales POS',
      project: 'Soporte Técnico',
      ticketCount: 11,
      active: false,
      createdAt: '05 Mar 2024',
    },
    {
      id: 10,
      name: 'Sincronización',
      description: 'Conexión de bases de datos locales y endpoint central con servidor corporativo',
      project: 'Visión',
      ticketCount: 16,
      active: true,
      createdAt: '20 Ene 2024',
    },
    {
      id: 11,
      name: 'Hardware',
      description: 'Fallas en terminales biométricas, cámaras, fuentes de poder y cableado',
      project: 'Soporte Técnico',
      ticketCount: 28,
      active: true,
      createdAt: '02 Feb 2024',
    },
     {
      id: 12,
      name: 'Sincronización',
      description: 'Conexión de bases de datos locales y endpoint central con servidor corporativo',
      project: 'Visión',
      ticketCount: 16,
      active: true,
      createdAt: '20 Ene 2024',
    },
  ]);

  protected readonly searchTerm = signal('');
  //protected readonly selectedProject = signal('');
  protected readonly selectedStatus = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly isModalOpen = signal(false);
  protected readonly totalCount = computed(() => this.areas().length);
  protected readonly activeCount = computed(
    () => this.areas().filter((area) => area.active).length,
  );
  protected readonly inactiveCount = computed(
    () => this.areas().filter((area) => !area.active).length,
  );
  protected readonly projectCount = computed(
    () => new Set(this.areas().map((area) => area.project)).size,
  );
  protected readonly filteredAreas = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    //const project = this.selectedProject();
    const status = this.selectedStatus();

    return this.areas().filter((area) => {
      const matchesQuery =
        !query ||
        area.name.toLocaleLowerCase().includes(query) ||
        area.description.toLocaleLowerCase().includes(query);
      //const matchesProject = !project || area.project === project;
      const matchesStatus =
        !status || (status === 'active' ? area.active : !area.active);

      return matchesQuery && matchesStatus;
      //return matchesQuery && matchesProject && matchesStatus;
    });
  });
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredAreas().length / this.pageSize())),
  );
  protected readonly pageNumbers = computed(() => {
    const totalPages = this.totalPages();
    const currentPage = Math.min(this.currentPage(), totalPages);

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages]);
    for (
      let page = Math.max(2, currentPage - 1);
      page <= Math.min(totalPages - 1, currentPage + 1);
      page++
    ) {
      pages.add(page);
    }

    if (currentPage <= 3) {
      pages.add(2);
      pages.add(3);
    } else if (currentPage >= totalPages - 2) {
      pages.add(totalPages - 1);
      pages.add(totalPages - 2);
    }

    return Array.from(pages).sort((first, second) => first - second);
  });
  protected readonly visibleAreas = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const startIndex = (page - 1) * this.pageSize();

    return this.filteredAreas().slice(startIndex, startIndex + this.pageSize());
  });
  protected readonly firstVisibleItem = computed(() =>
    this.filteredAreas().length === 0
      ? 0
      : (Math.min(this.currentPage(), this.totalPages()) - 1) * this.pageSize() + 1,
  );
  protected readonly lastVisibleItem = computed(() =>
    Math.min(
      this.firstVisibleItem() + this.pageSize() - 1,
      this.filteredAreas().length,
    ),
  );

  protected newArea: NewAreaModel = this.createEmptyArea();

  protected openModal(): void {
    this.newArea = this.createEmptyArea();
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
  }

  protected updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

/*   protected updateProjectFilter(event: Event): void {
    this.selectedProject.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }
 */
  protected updateStatusFilter(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  protected updatePageSize(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  protected saveArea(): void {
    const name = this.newArea.name.trim();

    if (!name || !this.newArea.project) {
      return;
    }

    this.areas.update((areas) => [
      {
        id: Math.max(0, ...areas.map((area) => area.id)) + 1,
        name,
        description: this.newArea.description.trim(),
        project: this.newArea.project,
        ticketCount: 0,
        active: this.newArea.active,
        createdAt: new Intl.DateTimeFormat('es-MX', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(new Date()),
      },
      ...areas,
    ]);
    this.closeModal();
  }

  private createEmptyArea(): NewAreaModel {
    return {
      name: '',
      description: '',
      project: '',
      active: true,
    };
  }
}

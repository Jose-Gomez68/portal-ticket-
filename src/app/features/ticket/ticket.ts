import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, type Subscription } from 'rxjs';
import { ErrorAlert } from '../../shared/ui/error-alert/error-alert';
import { FeedbackToast } from '../../shared/ui/feedback-toast/feedback-toast';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { AreaService } from '../area/service/area.service';
import type { AreaModel } from '../area/model/area.model';
import { PriorityService } from '../priority/service/priority.service';
import type { PriorityModel } from '../priority/model/priority.model';
import { ProjectService } from '../project/service/project.service';
import type { ProjectModel } from '../project/model/project.model';
import { StatusService } from '../status/service/status.service';
import type { StatusModel } from '../status/model/status.model';
import { KindService } from '../type/service/kind.service';
import type { KindModel } from '../type/model/kind.model';
import { UserService } from '../user/service/user.service';
import type { UserModel } from '../user/model/user.model';
import { TicketService } from './service/ticket.service';
import { sanitizeTicketDescription, ticketDescriptionText } from './model/rich-text';
import type {
  NewTicketModel,
  TicketFormModel,
  TicketModel,
  UpdateTicketModel,
} from './model/ticket.model';

/* TODO QUEDA PENDIENTE QUE OBTENGA EL USUARIO Y EL AREA PARA CREAR EL TICKEY Y EL COMENTARIO PARA QUE ASI SEPA DE QUIEN ES EL TICKET DE QUE LO CREO O QUIEN REVISA */

type DescriptionFormat =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'indent'
  | 'outdent'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'justifyFull';

@Component({
  imports: [DatePipe, ErrorAlert, FeedbackToast, FormsModule, Pagination],
  selector: 'app-ticket',
  templateUrl: './ticket.html',
  styleUrl: './ticket.css',
})
export class Ticket implements OnDestroy, OnInit {
  private static readonly TOGGLE_FORMATS: DescriptionFormat[] = [
    'bold',
    'italic',
    'underline',
    'insertUnorderedList',
    'insertOrderedList',
    'justifyLeft',
    'justifyCenter',
    'justifyRight',
    'justifyFull',
  ];

  private readonly ticketService = inject(TicketService);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly areaService = inject(AreaService);
  private readonly kindService = inject(KindService);
  private readonly priorityService = inject(PriorityService);
  private readonly statusService = inject(StatusService);
  private readonly userService = inject(UserService);
  private ticketRequest: Subscription | null = null;
  private catalogRequest: Subscription | null = null;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;
  private hasLoadedCatalogs = false;
  private descriptionEditorElement: HTMLDivElement | null = null;
  private readonly activeDescriptionFormats = signal<Set<DescriptionFormat>>(new Set());

  @ViewChild('descriptionEditor')
  private set descriptionEditor(editor: ElementRef<HTMLDivElement> | undefined) {
    this.descriptionEditorElement = editor?.nativeElement ?? null;
    if (editor) {
      editor.nativeElement.innerHTML = sanitizeTicketDescription(
        this.newTicket.description ?? '',
      );
    }
  }

  protected readonly tickets = signal<TicketModel[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly projects = signal<ProjectModel[]>([]);
  protected readonly areas = signal<AreaModel[]>([]);
  protected readonly kinds = signal<KindModel[]>([]);
  protected readonly priorities = signal<PriorityModel[]>([]);
  protected readonly statuses = signal<StatusModel[]>([]);
  protected readonly users = signal<UserModel[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly selectedProjectID = signal('');
  protected readonly selectedKindID = signal('');
  protected readonly selectedAreaID = signal('');
  protected readonly selectedStatusID = signal('');
  protected readonly selectedPriorityID = signal('');
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly isLoading = signal(true);
  protected readonly isCatalogsLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly isModalOpen = signal(false);
  protected readonly editingTicketID = signal<number | null>(null);
  protected readonly ticketToDelete = signal<TicketModel | null>(null);
  protected readonly openActionsMenuTicketID = signal<number | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly catalogError = signal('');
  protected readonly toastMessage = signal<{ title: string; message: string } | null>(null);
  protected newTicket: TicketFormModel = this.createEmptyTicket();

  protected readonly filteredTickets = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const projectID = this.selectedProjectID();
    const kindID = this.selectedKindID();
    const areaID = this.selectedAreaID();
    const statusID = this.selectedStatusID();
    const priorityID = this.selectedPriorityID();
    const startDate = this.startDate();
    const endDate = this.endDate();

    return this.tickets().filter((ticket) => {
      const searchableText = [
        ticket.ticketID.toString(),
        ticket.title,
        ticketDescriptionText(ticket.description),
        this.getUserName(ticket.user),
        this.getUserName(ticket.assignedID),
      ].join(' ').toLocaleLowerCase();
      const createdDate = getLocalDateValue(ticket.createdDate);

      return (
        (!query || searchableText.includes(query)) &&
        (!projectID || ticket.project?.projectID.toString() === projectID) &&
        (!kindID || ticket.kind?.kindID.toString() === kindID) &&
        (!areaID || ticket.areaID?.areaID.toString() === areaID) &&
        (!statusID || ticket.statusID?.statusID.toString() === statusID) &&
        (!priorityID || ticket.priorityID?.priorityID.toString() === priorityID) &&
        (!startDate || (createdDate && createdDate >= startDate)) &&
        (!endDate || (createdDate && createdDate <= endDate))
      );
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize())),
  );

  protected readonly activeCount = computed(() => this.totalItems());

  ngOnInit(): void {
    this.loadTickets();
    this.loadCatalogs();
  }

  ngOnDestroy(): void {
    this.ticketRequest?.unsubscribe();
    this.catalogRequest?.unsubscribe();
    this.clearToastTimeout();
  }

  protected loadTickets(): void {
    this.ticketRequest?.unsubscribe();
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.ticketRequest = this.ticketService
      .getAllActiveTickets(this.currentPage() - 1, this.pageSize())
      .subscribe({
        next: (result) => {
          const lastPage = Math.max(1, Math.ceil(result.totalItems / this.pageSize()));
          if (this.currentPage() > lastPage) {
            this.currentPage.set(lastPage);
            this.loadTickets();
            return;
          }

          this.tickets.set(result.response);
          this.totalItems.set(result.totalItems);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorMessage.set(`No se pudieron cargar los tickets: ${getErrorMessage(error)}`);
          this.isLoading.set(false);
        },
      });
  }

  protected updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected updateFilter(
    filter: 'project' | 'kind' | 'area' | 'status' | 'priority' | 'startDate' | 'endDate',
    event: Event,
  ): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    switch (filter) {
      case 'project':
        this.selectedProjectID.set(value);
        break;
      case 'kind':
        this.selectedKindID.set(value);
        break;
      case 'area':
        this.selectedAreaID.set(value);
        break;
      case 'status':
        this.selectedStatusID.set(value);
        break;
      case 'priority':
        this.selectedPriorityID.set(value);
        break;
      case 'startDate':
        this.startDate.set(value);
        break;
      case 'endDate':
        this.endDate.set(value);
        break;
    }
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.selectedProjectID.set('');
    this.selectedKindID.set('');
    this.selectedAreaID.set('');
    this.selectedStatusID.set('');
    this.selectedPriorityID.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.currentPage.set(1);
    this.loadTickets();
  }

  protected applyFilters(): void {
    this.currentPage.set(1);
    this.loadTickets();
  }

  protected updatePageSize(pageSize: number): void {
    this.pageSize.set(Math.min(100, Math.max(1, pageSize)));
    this.currentPage.set(1);
    this.loadTickets();
  }

  protected goToPage(page: number): void {
    const nextPage = Math.max(1, Math.min(page, this.totalPages()));
    if (nextPage !== this.currentPage()) {
      this.currentPage.set(nextPage);
      this.loadTickets();
    }
  }

  protected toggleActionsMenu(ticketID: number, event: Event): void {
    event.stopPropagation();
    this.openActionsMenuTicketID.update((openID) => (openID === ticketID ? null : ticketID));
  }

  protected closeActionsMenu(): void {
    this.openActionsMenuTicketID.set(null);
  }

  protected updateDescription(): void {
    this.syncDescriptionFromEditor();
  }

  protected prepareDescriptionEditor(): void {
    document.execCommand('defaultParagraphSeparator', false, 'p');
  }

  protected preserveDescriptionSelection(event: MouseEvent): void {
    event.preventDefault();
  }

  protected isDescriptionFormatActive(format: DescriptionFormat): boolean {
    return this.activeDescriptionFormats().has(format);
  }

  private syncDescriptionFromEditor(): void {
    if (this.descriptionEditorElement) {
      this.newTicket.description = this.descriptionEditorElement.innerHTML;
    }
  }

  protected formatDescription(format: DescriptionFormat): void {
    const editor = this.descriptionEditorElement;
    if (!editor) {
      return;
    }

    if (document.activeElement !== editor) {
      editor.focus();
    }
    document.execCommand(format, false);
    this.syncDescriptionFromEditor();
    this.refreshActiveFormats();
  }

  protected pasteDescriptionAsText(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text);
    this.syncDescriptionFromEditor();
  }

  protected handleDescriptionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
      document.execCommand('insertText', false, '\u00A0\u00A0\u00A0\u00A0');
      this.syncDescriptionFromEditor();
    }
  }

  @HostListener('document:selectionchange')
  protected refreshActiveFormats(): void {
    const editor = this.descriptionEditorElement;
    const anchor = document.getSelection()?.anchorNode;
    const active = new Set<DescriptionFormat>();

    if (editor && anchor && editor.contains(anchor)) {
      for (const format of Ticket.TOGGLE_FORMATS) {
        if (document.queryCommandState(format)) {
          active.add(format);
        }
      }
    }
    this.activeDescriptionFormats.set(active);
  }

  protected descriptionPreview(description: string | null): string {
    return ticketDescriptionText(description) || 'Sin descripción.';
  }

  protected openCreateModal(): void {
    this.editingTicketID.set(null);
    this.newTicket = this.createEmptyTicket();
    this.errorMessage.set('');
    this.isModalOpen.set(true);
    this.loadCatalogs();
  }

  protected editTicket(ticket: TicketModel): void {
    this.closeActionsMenu();
    this.editingTicketID.set(ticket.ticketID);
    this.newTicket = {
      title: ticket.title,
      description: ticket.description,
      kindID: ticket.kind?.kindID ?? null,
      userID: ticket.user?.userID ?? 0,
      assignedID: ticket.assignedID?.userID ?? null,
      projectID: ticket.project?.projectID ?? null,
      areaID: ticket.areaID?.areaID ?? null,
      priorityID: ticket.priorityID?.priorityID ?? null,
      statusID: ticket.statusID?.statusID ?? this.getPendingStatusID(),
    };
    this.errorMessage.set('');
    this.isModalOpen.set(true);
    this.loadCatalogs();
  }

  protected closeModal(): void {
    if (!this.isSaving()) {
      this.isModalOpen.set(false);
      this.editingTicketID.set(null);
    }
  }

  protected saveTicket(): void {
    const request: NewTicketModel = {
      title: this.newTicket.title.trim(),
      description:
        sanitizeTicketDescription(
          this.descriptionEditorElement?.innerHTML ?? this.newTicket.description ?? '',
        ).trim() || null,
      kind: this.newTicket.kindID,
      user: this.newTicket.userID,
      assignedID: this.newTicket.assignedID,
      project: this.newTicket.projectID,
      areaID: this.newTicket.areaID,
      priorityID: this.newTicket.priorityID,
      statusID: this.newTicket.statusID,
    };

    if (
      this.isSaving() ||
      !request.title ||
      !this.newTicket.userID ||
      !this.newTicket.kindID ||
      !this.newTicket.projectID ||
      !this.newTicket.areaID ||
      !this.newTicket.priorityID ||
      !this.newTicket.statusID
    ) {
      this.errorMessage.set('Completa los campos obligatorios antes de guardar el ticket.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    const ticketID = this.editingTicketID();
    const request$ = ticketID === null
      ? this.ticketService.createTicket(request)
      : this.ticketService.updateTicket({ ...request, ticketID } satisfies UpdateTicketModel);

    request$.subscribe({
      next: (ticket) => {
        this.isSaving.set(false);
        this.isModalOpen.set(false);
        this.editingTicketID.set(null);
        if (ticketID === null) {
          this.currentPage.set(1);
        }
        this.loadTickets();
        this.showToast({
          title: ticketID === null ? 'Ticket creado' : 'Ticket actualizado',
          message: `El ticket “${ticket.title}” se guardó correctamente.`,
        });
      },
      error: (error: unknown) => {
        this.errorMessage.set(`No se pudo guardar el ticket: ${getErrorMessage(error)}`);
        this.isSaving.set(false);
      },
    });
  }

  protected viewTicket(ticket: TicketModel): void {
    this.closeActionsMenu();
    void this.router.navigate(['/ticket', ticket.ticketID]);
  }

  protected openDeleteConfirmation(ticket: TicketModel): void {
    this.closeActionsMenu();
    this.errorMessage.set('');
    this.ticketToDelete.set(ticket);
  }

  protected closeDeleteConfirmation(): void {
    if (!this.isDeleting()) {
      this.ticketToDelete.set(null);
    }
  }

  protected deleteTicket(): void {
    const ticket = this.ticketToDelete();
    if (!ticket || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.ticketService.deleteTicket(ticket.ticketID).subscribe({
      next: () => {
        this.totalItems.update((total) => Math.max(0, total - 1));
        this.isDeleting.set(false);
        this.ticketToDelete.set(null);
        this.currentPage.set(Math.min(
          this.currentPage(),
          Math.max(1, Math.ceil(this.totalItems() / this.pageSize())),
        ));
        this.loadTickets();
        this.showToast({
          title: 'Ticket eliminado',
          message: `El ticket #${ticket.ticketID} se eliminó correctamente.`,
        });
      },
      error: (error: unknown) => {
        this.errorMessage.set(`No se pudo eliminar el ticket: ${getErrorMessage(error)}`);
        this.isDeleting.set(false);
      },
    });
  }

  protected exportTickets(): void {
    const headers = ['ID', 'Título', 'Proyecto', 'Tipo', 'Área', 'Solicitante', 'Responsable', 'Prioridad', 'Estado', 'Creado'];
    const rows = this.filteredTickets().map((ticket) => [
      ticket.ticketID,
      ticket.title,
      ticket.project?.name ?? '',
      ticket.kind?.name ?? '',
      ticket.areaID?.name ?? '',
      this.getUserName(ticket.user),
      this.getUserName(ticket.assignedID),
      ticket.priorityID?.name ?? '',
      ticket.statusID?.name ?? '',
      ticket.createdDate ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\r\n');
    const file = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tickets.csv';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  protected getUserName(user: UserModel | null): string {
    return user ? `${user.name} ${user.apPaterno}`.trim() : 'Sin asignar';
  }

  protected getUserInitials(user: UserModel | null): string {
    if (!user) {
      return '—';
    }
    return `${user.name.charAt(0)}${user.apPaterno.charAt(0)}`.toLocaleUpperCase();
  }

  protected ticketCode(ticketID: number): string {
    return `#TK-${ticketID.toString().padStart(4, '0')}`;
  }

  protected loadCatalogs(): void {
    if (this.isCatalogsLoading() || this.hasLoadedCatalogs) {
      return;
    }
    this.catalogRequest?.unsubscribe();
    this.isCatalogsLoading.set(true);
    this.catalogError.set('');
    this.catalogRequest = forkJoin({
      projects: this.projectService.getAllProjects(0, 100),
      areas: this.areaService.getAll(),
      kinds: this.kindService.getAllKinds(),
      priorities: this.priorityService.getAllPriorities(),
      statuses: this.statusService.getAllStatuses(),
      users: this.userService.getAllUsers(),
    }).subscribe({
      next: (catalogs) => {
        this.projects.set(catalogs.projects.response);
        this.areas.set(catalogs.areas.filter((area) => area.active));
        this.kinds.set(catalogs.kinds.filter((kind) => kind.active !== false));
        this.priorities.set(catalogs.priorities.filter((priority) => priority.active !== false));
        this.statuses.set(catalogs.statuses);
        this.users.set(catalogs.users.filter((user) => user.active !== false));
        this.hasLoadedCatalogs = true;
        if (this.isModalOpen() && this.newTicket.statusID === null) {
          this.newTicket.statusID = this.getPendingStatusID();
        }
        this.isCatalogsLoading.set(false);
      },
      error: (error: unknown) => {
        this.catalogError.set(`No se pudieron cargar las opciones del formulario: ${getErrorMessage(error)}`);
        this.isCatalogsLoading.set(false);
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

  private createEmptyTicket(): TicketFormModel {
    return {
      title: '',
      description: '',
      kindID: null,
      userID: 0,
      assignedID: null,
      projectID: null,
      areaID: null,
      priorityID: null,
      statusID: this.getPendingStatusID(),
    };
  }

  private getPendingStatusID(): number | null {
    return this.statuses().find(
      (status) => status.name.trim().toLocaleLowerCase() === 'pendiente',
    )?.statusID ?? null;
  }
}

function getLocalDateValue(value: string | null): string {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const response = (error as Record<string, unknown>)['error'];
    if (typeof response === 'object' && response !== null) {
      const message = (response as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message) {
        return message;
      }
    }
  }

  return 'Intenta nuevamente.';
}

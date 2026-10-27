import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EMPTY, expand, forkJoin, toArray } from 'rxjs';
import { ErrorAlert } from '../../shared/ui/error-alert/error-alert';
import { KindService } from '../type/service/kind.service';
import { PriorityService } from '../priority/service/priority.service';
import { ProjectService } from '../project/service/project.service';
import { StatusService } from '../status/service/status.service';
import { TicketService } from '../ticket/service/ticket.service';
import type { TicketModel } from '../ticket/model/ticket.model';
import { ticketDescriptionText } from '../ticket/model/rich-text';
import { UserService } from '../user/service/user.service';
import type {
  DashboardMetric,
  PrioritySummary,
  ProjectSummary,
  RecentTicket,
  StatusSummary,
} from './model/dashboard.model';

@Component({
  imports: [ErrorAlert, RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly projectService = inject(ProjectService);
  private readonly kindService = inject(KindService);
  private readonly priorityService = inject(PriorityService);
  private readonly statusService = inject(StatusService);
  private readonly userService = inject(UserService);

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly metrics = signal<DashboardMetric[]>([]);
  protected readonly statusSummaries = signal<StatusSummary[]>([]);
  protected readonly prioritySummaries = signal<PrioritySummary[]>([]);
  protected readonly projectSummaries = signal<ProjectSummary[]>([]);
  protected readonly recentTickets = signal<RecentTicket[]>([]);
  protected readonly totalTickets = signal(0);
  protected readonly criticalTickets = signal(0);
  protected readonly selectedDays = signal(30);

  private allTickets: TicketModel[] = [];
  private dashboardProjects: { projectID: number; name: string; description: string; active: boolean }[] = [];
  private dashboardKinds: { kindID: number; name: string; active: boolean | null }[] = [];
  private dashboardPriorities: { priorityID: number; name: string }[] = [];
  private dashboardStatuses: { statusID: number; name: string }[] = [];
  private dashboardUsers: { userID: number; name: string; apPaterno: string; apMaterno: string; active: boolean | null }[] = [];

  ngOnInit(): void {
    const pages = this.ticketService.getAllActiveTickets(0, 100).pipe(
      expand((page) => {
        const loaded = (page.page + 1) * page.size;
        return loaded < page.totalItems
          ? this.ticketService.getAllActiveTickets(page.page + 1, page.size)
          : EMPTY;
      }),
      toArray(),
    );

    forkJoin({
      pages,
      projects: this.projectService.getAllProjects(0, 100),
      kinds: this.kindService.getAllKinds(),
      priorities: this.priorityService.getAllPriorities(),
      statuses: this.statusService.getAllStatuses(),
      users: this.userService.getAllUsers(),
    }).subscribe({
      next: ({ pages: ticketPages, projects, kinds, priorities, statuses, users }) => {
        this.allTickets = ticketPages.flatMap((page) => page.response);
        this.dashboardProjects = projects.response;
        this.dashboardKinds = kinds;
        this.dashboardPriorities = priorities;
        this.dashboardStatuses = statuses;
        this.dashboardUsers = users;
        this.applyDateFilter();
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(error instanceof Error ? error.message : 'No fue posible cargar el dashboard.');
        this.isLoading.set(false);
      },
    });
  }

  protected updateDateRange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.selectedDays.set(value);
    this.applyDateFilter();
  }

  private applyDateFilter(): void {
    const days = this.selectedDays();
    const cutoff = days === 0
      ? null
      : new Date();

    if (cutoff) {
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(cutoff.getDate() - days);
    }

    const tickets = cutoff
      ? this.allTickets.filter((ticket) => {
          const created = this.timestamp(ticket.createdDate);
          return created >= cutoff.getTime();
        })
      : this.allTickets;

    this.buildDashboard(
      tickets,
      this.dashboardProjects,
      this.dashboardKinds,
      this.dashboardPriorities,
      this.dashboardStatuses,
      this.dashboardUsers,
    );
  }

  private buildDashboard(
    tickets: TicketModel[],
    projects: { projectID: number; name: string; description: string; active: boolean }[],
    kinds: { kindID: number; name: string; active: boolean | null }[],
    priorities: { priorityID: number; name: string }[],
    statuses: { statusID: number; name: string }[],
    users: { userID: number; name: string; apPaterno: string; apMaterno: string; active: boolean | null }[],
  ): void {
    const statusCount = (names: string[]) => tickets.filter((ticket) => names.includes(this.normalize(ticket.statusID?.name))).length;
    const pending = statusCount(['pendiente']);
    const inReview = statusCount(['en revision', 'revision']);
    const inProcess = statusCount(['en proceso', 'proceso']);
    const closed = statusCount(['cerrado', 'cerrada', 'finalizado']);
    const activeProjects = projects.filter((project) => project.active);
    const activeUsers = users.filter((user) => user.active !== false);
    const critical = tickets.filter((ticket) => this.normalize(ticket.priorityID?.name).includes('crit'));

    this.totalTickets.set(tickets.length);
    this.criticalTickets.set(critical.length);
    this.metrics.set([
      { label: 'Tickets pendientes', value: pending, trend: 'Activos', detail: 'Requiere atención', accent: 'bg-status-pending', icon: 'pending', iconClass: 'bg-status-pending-bg text-status-pending' },
      { label: 'Tickets en proceso', value: inProcess, trend: 'Activos', detail: `${inReview} en revisión`, accent: 'bg-status-progress', icon: 'process', iconClass: 'bg-status-progress-bg text-status-progress' },
      { label: 'Tickets cerrados', value: closed, trend: 'Activos', detail: 'Incluye registros cerrados', accent: 'bg-status-closed', icon: 'closed', iconClass: 'bg-status-closed-bg text-status-closed' },
      { label: 'Tickets críticos', value: critical.length, trend: 'Prioridad', detail: 'Requiere atención', accent: 'bg-destructive', icon: 'critical', iconClass: 'bg-priority-critical-bg text-destructive' },
      { label: 'Proyectos activos', value: activeProjects.length, trend: 'Activos', detail: activeProjects.map((project) => project.name).join(', ') || 'Sin proyectos', accent: 'bg-primary', icon: 'project', iconClass: 'bg-primary/10 text-primary' },
      { label: 'Categorías', value: kinds.filter((kind) => kind.active !== false).length, trend: 'Catálogo', detail: kinds.map((kind) => kind.name).join(', ') || 'Sin categorías', accent: 'bg-slate-500', icon: 'category', iconClass: 'bg-slate-100 text-slate-700' },
      { label: 'Usuarios activos', value: activeUsers.length, trend: 'Activos', detail: `${activeUsers.length} disponibles`, accent: 'bg-tertiary', icon: 'users', iconClass: 'bg-primary/10 text-tertiary' },
    ]);

    this.statusSummaries.set(statuses.map((status) => {
      const count = tickets.filter((ticket) => ticket.statusID?.statusID === status.statusID).length;
      return { label: status.name, count, percent: this.percent(count, tickets.length), color: this.statusColor(status.name) };
    }).sort((a, b) => b.count - a.count));

    this.prioritySummaries.set(priorities.map((priority) => {
      const count = tickets.filter((ticket) => ticket.priorityID?.priorityID === priority.priorityID).length;
      return { label: priority.name, value: count, percent: this.percent(count, tickets.length), color: this.priorityColor(priority.name) };
    }).sort((a, b) => b.value - a.value));

    const maxProjectCount = Math.max(...projects.map((project) => tickets.filter((ticket) => ticket.project?.projectID === project.projectID).length), 1);
    this.projectSummaries.set(activeProjects.map((project) => {
      const count = tickets.filter((ticket) => ticket.project?.projectID === project.projectID).length;
      return { name: project.name, count, percent: this.percent(count, tickets.length), width: Math.round((count / maxProjectCount) * 100), active: count, description: project.description, color: this.projectColor(project.projectID) };
    }).sort((a, b) => b.count - a.count));

    this.recentTickets.set([...tickets]
      .sort((a, b) => this.timestamp(b.createdDate) - this.timestamp(a.createdDate))
      .slice(0, 15)
      .map((ticket) => this.toRecentTicket(ticket)));
  }

  private toRecentTicket(ticket: TicketModel): RecentTicket {
    const assignee = ticket.assignedID ?? ticket.user;
    const fullName = assignee ? [assignee.name, assignee.apPaterno].filter(Boolean).join(' ') : 'Sin asignar';
    const priority = ticket.priorityID?.name ?? 'Sin prioridad';
    const status = ticket.statusID?.name ?? 'Sin estado';
    return {
      id: ticket.ticketID,
      code: `TK-${ticket.ticketID}`,
      title: ticket.title,
      description: this.descriptionText(ticket.description),
      project: ticket.project?.name ?? 'Sin proyecto',
      projectClass: 'border-primary/20 bg-primary/10 text-primary',
      category: ticket.kind?.name ?? ticket.areaID?.name ?? 'Sin categoría',
      priority,
      status,
      assignee: fullName,
      assigneeInitials: this.initials(fullName),
      assigneeClass: 'bg-primary/10 text-primary',
      date: this.formatDate(ticket.createdDate),
      sla: ticket.updatedDate ? `Actualizado ${this.formatDate(ticket.updatedDate)}` : 'Sin actualización',
      slaClass: 'text-text-muted',
    };
  }

  protected exportRecentTickets(): void {
    const headers = ['ID', 'Título', 'Descripción', 'Proyecto', 'Categoría', 'Prioridad', 'Estado', 'Responsable', 'Fecha', 'SLA'];
    const rows = this.recentTickets().map((ticket) => [
      ticket.code,
      ticket.title,
      ticket.description,
      ticket.project,
      ticket.category,
      ticket.priority,
      ticket.status,
      ticket.assignee,
      ticket.date,
      ticket.sla,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tickets-recientes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected priorityBadge(priority: string): string {
    const name = this.normalize(priority);
    if (name.includes('crit')) return 'badge-critical';
    if (name.includes('alta')) return 'badge-high';
    if (name.includes('media')) return 'badge-medium';
    return 'badge-low';
  }

  protected statusBadge(status: string): string {
    const name = this.normalize(status);
    if (name.includes('cerr')) return 'badge-status-closed';
    if (name.includes('revision')) return 'badge-status-review';
    if (name.includes('proceso')) return 'badge-status-process';
    return 'badge-status-pending';
  }

  private descriptionText(value: string | null): string {
    const text = ticketDescriptionText(value).replace(/\s+/g, ' ').trim();
    return text || 'Sin descripción';
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private percent(value: number, total: number): number {
    return total === 0 ? 0 : Number(((value / total) * 100).toFixed(1));
  }

  private statusColor(status: string): string {
    const name = this.normalize(status);
    if (name.includes('cerr')) return 'bg-status-closed';
    if (name.includes('revision')) return 'bg-status-review';
    if (name.includes('proceso')) return 'bg-status-progress';
    return 'bg-status-pending';
  }

  private priorityColor(priority: string): string {
    const name = this.normalize(priority);
    if (name.includes('crit')) return 'bg-destructive';
    if (name.includes('alta')) return 'bg-priority-high';
    if (name.includes('media')) return 'bg-secondary';
    return 'bg-priority-low';
  }

  private projectColor(projectID: number): string {
    return ['bg-primary', 'bg-secondary', 'bg-tertiary'][projectID % 3];
  }

  private timestamp(value: string | null): number {
    return value ? Date.parse(value) || 0 : 0;
  }

  private formatDate(value: string | null): string {
    return value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Sin fecha';
  }

  private initials(name: string): string {
    return name === 'Sin asignar' ? '—' : name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }
}

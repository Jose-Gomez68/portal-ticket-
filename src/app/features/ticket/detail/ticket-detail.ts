import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Subscription } from 'rxjs';
import { forkJoin, tap } from 'rxjs';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { ErrorAlert } from '../../../shared/ui/error-alert/error-alert';
import { TicketService } from '../service/ticket.service';
import type { TicketModel } from '../model/ticket.model';
import { sanitizeTicketDescription } from '../model/rich-text';
import type { UserModel } from '../../user/model/user.model';
import { UserService } from '../../user/service/user.service';

@Component({
  imports: [DatePipe, ErrorAlert, FormsModule, RouterLink],
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css',
})
export class TicketDetail implements OnDestroy, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ticketService = inject(TicketService);
  private readonly authSession = inject(AuthSessionService);
  private readonly userService = inject(UserService);
  private routeSubscription: Subscription | null = null;
  private ticketRequest: Subscription | null = null;
  private commentRequest: Subscription | null = null;
  private userRequest: Subscription | null = null;

  protected readonly ticket = signal<TicketModel | null>(null);
  protected readonly users = signal<UserModel[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSubmittingComment = signal(false);
  protected readonly commentDraft = signal('');
  protected readonly commentError = signal('');
  protected readonly errorMessage = signal('');
  protected readonly authorLookupError = signal('');

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const ticketID = Number(params.get('ticketID'));
      if (!Number.isInteger(ticketID) || ticketID <= 0) {
        this.ticket.set(null);
        this.errorMessage.set('El identificador del ticket no es válido.');
        this.isLoading.set(false);
        return;
      }

      this.loadTicket(ticketID);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.ticketRequest?.unsubscribe();
    this.commentRequest?.unsubscribe();
    this.userRequest?.unsubscribe();
  }

  protected ticketCode(ticketID: number): string {
    return `#TK-${ticketID.toString().padStart(6, '0')}`;
  }

  protected getUserName(user: UserModel | null): string {
    return user ? `${user.name} ${user.apPaterno} ${user.apMaterno}`.trim() : 'Sin asignar';
  }

  protected getUserInitials(user: UserModel | null): string {
    if (!user) {
      return '—';
    }
    return `${user.name.charAt(0)}${user.apPaterno.charAt(0)}`.toLocaleUpperCase();
  }

  protected safeDescription(description: string): string {
    return sanitizeTicketDescription(description);
  }

  protected commentText(comment: unknown): string {
    if (typeof comment === 'string') {
      return comment;
    }
    if (typeof comment !== 'object' || comment === null) {
      return 'Comentario de seguimiento';
    }

    const record = comment as Record<string, unknown>;
    for (const key of ['content', 'comment', 'message', 'description', 'text']) {
      if (typeof record[key] === 'string' && record[key]) {
        return record[key];
      }
    }
    return 'Comentario de seguimiento';
  }

  protected commentAuthor(comment: unknown): string {
    if (typeof comment !== 'object' || comment === null) {
      return 'Usuario';
    }
    const record = comment as Record<string, unknown>;
    const author = record['user'];
    if (typeof author === 'object' && author !== null) {
      const user = author as Record<string, unknown>;
      const name = [user['name'], user['apPaterno'], user['apMaterno']]
        .filter((part): part is string => typeof part === 'string' && part.length > 0)
        .join(' ');
      if (name) {
        return name;
      }
      const userID = getCommentUserID(comment);
      return userID === null ? 'Usuario' : this.getCommentUserName(userID);
    }
    if (typeof author === 'number') {
      return this.getCommentUserName(author);
    }
    for (const key of ['createdBy', 'authorName', 'userName']) {
      if (typeof record[key] === 'string' && record[key]) {
        return record[key];
      }
    }
    return 'Usuario';
  }

  protected commentRole(comment: unknown): string {
    const userID = getCommentUserID(comment);
    if (userID === null) {
      return 'Participante';
    }

    const ticket = this.ticket();
    if (ticket?.user?.userID === userID) {
      return 'Solicitante';
    }
    if (
      ticket?.assignedID?.userID === userID
    ) {
      return 'Atención';
    }
    return 'Atención';
  }

  protected canComment(ticket: TicketModel): boolean {
    const user = this.authSession.user();
    if (!user) {
      return false;
    }
    return (
      ticket.user?.userID === user.userID ||
      ticket.assignedID?.userID === user.userID ||
      (user.role === 'ADMIN' &&
        (user.areaID === null || ticket.areaID?.areaID === user.areaID))
    );
  }

  protected commentDate(comment: unknown): string | null {
    if (typeof comment !== 'object' || comment === null) {
      return null;
    }
    const record = comment as Record<string, unknown>;
    for (const key of ['createdDate', 'commentDate', 'date']) {
      if (typeof record[key] === 'string' && record[key]) {
        return record[key];
      }
    }
    return null;
  }

  protected addComment(): void {
    const ticket = this.ticket();
    const user = this.authSession.user();
    const message = this.commentDraft().trim();
    if (!ticket || !user || !this.canComment(ticket) || !message || this.isSubmittingComment()) {
      return;
    }

    this.commentError.set('');
    this.isSubmittingComment.set(true);
    this.commentRequest = this.ticketService
      .createTicketComment({
        message,
        ticket: ticket.ticketID,
        user: user.userID,
      })
      .subscribe({
        next: (comment) => {
          this.ticket.update((current) =>
            current ? { ...current, comments: [...current.comments, comment] } : current,
          );
          this.loadCommentUsers([comment]);
          this.commentDraft.set('');
          this.isSubmittingComment.set(false);
        },
        error: (error: unknown) => {
          this.commentError.set(`No se pudo agregar el comentario: ${getErrorMessage(error)}`);
          this.isSubmittingComment.set(false);
        },
      });
  }

  private loadTicket(ticketID: number): void {
    this.ticketRequest?.unsubscribe();
    this.commentRequest?.unsubscribe();
    this.isSubmittingComment.set(false);
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.ticket.set(null);
    this.ticketRequest = this.ticketService.getTicketByID(ticketID).subscribe({
      next: (ticket) => {
        const user = this.authSession.user();
        if (
          user?.role === 'ADMIN' &&
          user.areaID !== null &&
          ticket.areaID?.areaID !== user.areaID
        ) {
          this.errorMessage.set('No tienes acceso a los tickets de otra área.');
          this.isLoading.set(false);
          return;
        }
        this.ticket.set(ticket);
        console.log('Comentarios recibidos en detalle:', ticket.comments);
        this.loadCommentUsers(ticket.comments);
        this.commentDraft.set('');
        this.commentError.set('');
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(
          `No se pudo cargar el ticket: ${getErrorMessage(error)}`,
        );
        this.isLoading.set(false);
      },
    });
  }

  private getCommentUserName(userID: number): string {
    const user = this.users().find((item) => item.userID === userID);
    if (user) {
      return this.getUserName(user);
    }
    const ticket = this.ticket();
    if (ticket?.user?.userID === userID && ticket.user) {
      return this.getUserName(ticket.user);
    }
    if (ticket?.assignedID?.userID === userID && ticket.assignedID) {
      return this.getUserName(ticket.assignedID);
    }
    return `Usuario #${userID}`;
  }

  private loadCommentUsers(comments: unknown[]): void {
    const knownUserIDs = new Set(this.users().map((user) => user.userID));
    const userIDs = [...new Set(
      comments
        .map(getCommentUserID)
        .filter((userID): userID is number => userID !== null && !knownUserIDs.has(userID)),
    )];
    console.log('IDs de usuario extraídos de comentarios:', userIDs);
    if (userIDs.length === 0) {
      return;
    }

    this.userRequest?.unsubscribe();
    this.authorLookupError.set('');
    this.userRequest = forkJoin(
      userIDs.map((userID) => {
        console.log('Consultando UserService.getUserByID:', userID);
        return this.userService.getUserByID(userID).pipe(
          tap((user) => console.log('Respuesta getUserByID:', { userID, user })),
        );
      }),
    )
      .subscribe({
        next: (users) => this.users.update((current) => [...current, ...users]),
        error: (error: unknown) => {
          console.error('Error en UserService.getUserByID:', error);
          this.authorLookupError.set(
            `No se pudieron cargar los nombres de quienes comentaron: ${getErrorMessage(error)}`,
          );
        },
      });
  }
}

function getCommentUserID(comment: unknown): number | null {
  if (typeof comment !== 'object' || comment === null) {
    return null;
  }
  const record = comment as Record<string, unknown>;
  const author = record['user'];
  if (typeof author === 'number') {
    return author;
  }
  if (typeof author === 'object' && author !== null) {
    const userID = (author as Record<string, unknown>)['userID'];
    return typeof userID === 'number' ? userID : null;
  }
  return null;
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

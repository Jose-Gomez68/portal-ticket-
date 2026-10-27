import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Subscription } from 'rxjs';
import { ErrorAlert } from '../../../shared/ui/error-alert/error-alert';
import { TicketService } from '../service/ticket.service';
import type { TicketModel } from '../model/ticket.model';
import { sanitizeTicketDescription } from '../model/rich-text';
import type { UserModel } from '../../user/model/user.model';

@Component({
  imports: [DatePipe, ErrorAlert, FormsModule, RouterLink],
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css',
})
export class TicketDetail implements OnDestroy, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ticketService = inject(TicketService);
  private routeSubscription: Subscription | null = null;
  private ticketRequest: Subscription | null = null;
  private commentRequest: Subscription | null = null;

  protected readonly ticket = signal<TicketModel | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSubmittingComment = signal(false);
  protected readonly commentDraft = signal('');
  protected readonly commentError = signal('');
  protected readonly errorMessage = signal('');

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
    const author = record['user'] ?? record['author'];
    if (typeof author === 'object' && author !== null) {
      const user = author as Record<string, unknown>;
      const name = [user['name'], user['apPaterno'], user['apMaterno']]
        .filter((part): part is string => typeof part === 'string' && part.length > 0)
        .join(' ');
      return name || 'Usuario';
    }
    if (typeof author === 'number') {
      const ticketUser = this.ticket()?.user;
      if (ticketUser?.userID === author) {
        return this.getUserName(ticketUser);
      }
      return `Usuario #${author}`;
    }
    for (const key of ['createdBy', 'authorName', 'userName']) {
      if (typeof record[key] === 'string' && record[key]) {
        return record[key];
      }
    }
    return 'Usuario';
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
    const message = this.commentDraft().trim();
    if (!ticket || !message || this.isSubmittingComment()) {
      return;
    }

    this.commentError.set('');
    this.isSubmittingComment.set(true);
    this.commentRequest = this.ticketService
      .createTicketComment({
        message,
        ticket: ticket.ticketID,
        user: ticket.user?.userID ?? null,
      })
      .subscribe({
        next: (comment) => {
          this.ticket.update((current) =>
            current ? { ...current, comments: [...current.comments, comment] } : current,
          );
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
        this.ticket.set(ticket);
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

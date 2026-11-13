import type { StatusModel } from '../../status/model/status.model';

export function normalizeTicketStatusName(name: string | null | undefined): string {
  return (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase();
}

export function isPendingTicketStatus(status: StatusModel | null): boolean {
  return normalizeTicketStatusName(status?.name) === 'pendiente';
}

export function isResolvedTicketStatus(status: StatusModel | null): boolean {
  return ['resuelto', 'resuelta', 'cerrado', 'cerrada', 'solucionado', 'solucionada']
    .includes(normalizeTicketStatusName(status?.name));
}

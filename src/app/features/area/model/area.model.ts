export interface AreaModel {
  id: number;
  name: string;
  description: string;
  project: string;
  ticketCount: number;
  active: boolean;
  createdAt: string;
}

export interface NewAreaModel {
  name: string;
  description: string;
  project: string;
  active: boolean;
}

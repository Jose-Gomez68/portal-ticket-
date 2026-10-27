import type { AreaModel } from '../../area/model/area.model';
import type { PriorityModel } from '../../priority/model/priority.model';
import type { ProjectModel } from '../../project/model/project.model';
import type { StatusModel } from '../../status/model/status.model';
import type { KindModel } from '../../type/model/kind.model';
import type { UserModel } from '../../user/model/user.model';

export interface TicketModel {
  ticketID: number;
  title: string;
  description: string | null;
  active: boolean | null;
  createdDate: string | null;
  updatedDate: string | null;
  kind: KindModel | null;
  user: UserModel | null;
  assignedID: UserModel | null;
  project: ProjectModel | null;
  areaID: AreaModel | null;
  priorityID: PriorityModel | null;
  statusID: StatusModel | null;
  comments: unknown[];
}

export interface TicketPageModel {
  totalItems: number;
  page: number;
  size: number;
  response: TicketModel[];
}

export interface TicketFormModel {
  title: string;
  description: string | null;
  kindID: number | null;
  userID: number;
  assignedID: number | null;
  projectID: number | null;
  areaID: number | null;
  priorityID: number | null;
  statusID: number | null;
}

export interface NewTicketModel {
  title: string;
  description: string | null;
  kind: number | null;
  user: number;
  assignedID: number | null;
  project: number | null;
  areaID: number | null;
  priorityID: number | null;
  statusID: number | null;
}

export interface UpdateTicketModel extends NewTicketModel {
  ticketID: number;
}

export interface TicketCommentModel {
  commentID: number;
  message: string;
  ticket: number;
  user: number | null;
  createdDate: string | null;
  updatedDate: string | null;
}

export interface NewTicketCommentModel {
  message: string;
  ticket: number;
  user: number | null;
}

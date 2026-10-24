export interface PriorityModel {
  priorityID: number;
  name: string;
  backgroundColor: string | null;
  dotColor: string | null;
  active: boolean | null;
  createdBy: string | null;
  createdDate: string | null;
  updatedBy: string | null;
  updatedDate: string | null;
}

export interface NewPriorityModel {
  name: string;
  backgroundColor: string;
  dotColor: string;
}

export interface UpdatePriorityModel extends NewPriorityModel {
  priorityID: number;
}

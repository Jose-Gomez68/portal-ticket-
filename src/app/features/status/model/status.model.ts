export interface StatusModel {
  statusID: number;
  name: string;
  descrip: string;
  backgroundColor: string;
  dotColor: string;
}

export type NewStatusModel = Pick<
  StatusModel,
  'name' | 'descrip' | 'backgroundColor' | 'dotColor'
>;
export type UpdateStatusModel = StatusModel;

export interface KindModel {
  kindID: number;
  name: string;
  active: boolean | null;
  createdBy: string | null;
  createdDate: string | null;
  updatedBy: string | null;
  updatedDate: string | null;
  deletedBy: string | null;
  deletedDate: string | null;
}

export type NewKindModel = Pick<KindModel, 'name'>;
export type UpdateKindModel = Pick<KindModel, 'kindID' | 'name'>;

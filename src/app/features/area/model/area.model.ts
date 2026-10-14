export interface AreaModel {
  areaID: number;
  name: string;
  descrip: string;
  active: boolean;
  createdDate: string | null;
  createBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
}

export type NewAreaModel = Pick<AreaModel, 'name' | 'descrip' | 'active'>;
export type UpdateAreaModel = Pick<AreaModel, 'areaID' | 'name' | 'descrip' | 'active'>;
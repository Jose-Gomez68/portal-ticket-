export interface ProjectModel {
  projectID: number;
  name: string;
  description: string;
  active: boolean;
  createdBy: string | null;
  createdDate: string | null;
  updatedBy: string | null;
  updatedDate: string | null;
}

export type NewProjectModel = Pick<ProjectModel, 'name' | 'description' | 'active'>;
export type UpdateProjectModel = Pick<
  ProjectModel,
  'projectID' | 'name' | 'description' | 'active'
>;

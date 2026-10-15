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

export interface ProjectPageModel {
  totalItems: number;
  page: number;
  size: number;
  response: ProjectModel[];
}

export type NewProjectModel = Pick<ProjectModel, 'name' | 'description' | 'active'>;
export type UpdateProjectModel = Pick<
  ProjectModel,
  'projectID' | 'name' | 'description' | 'active'
>;

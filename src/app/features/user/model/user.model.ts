export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'AGENT' | 'REQUESTER';

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'AGENT', label: 'Agente' },
  { value: 'REQUESTER', label: 'Solicitante' },
];

export interface UserModel {
  userID: number;
  userName: string;
  name: string;
  apPaterno: string;
  apMaterno: string;
  email: string;
  active: boolean | null;
  role: UserRole;
  areaID: number | null;
  areaName: string | null;
  createBy: string | null;
  createDate: string | null;
  updatedBy: string | null;
  updatedDate: string | null;
  deletedBy: string | null;
  deletedDate: string | null;
}

export interface NewUserModel {
  userName: string;
  name: string;
  apPaterno: string;
  apMaterno: string;
  email: string;
  password: string;
  active: boolean | null;
  role: UserRole;
  areaID: number | null;
}

export interface UpdateUserModel extends Omit<NewUserModel, 'password'> {
  userID: number;
  password?: string;
}

export type UserFormModel = Omit<NewUserModel, 'role'> & {
  role: UserRole | '';
};

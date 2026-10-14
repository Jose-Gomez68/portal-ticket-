export interface UserModel {
  userID: number;
  userName: string;
  name: string;
  apPaterno: string;
  apMaterno: string;
  email: string;
  active: boolean | null;
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
}

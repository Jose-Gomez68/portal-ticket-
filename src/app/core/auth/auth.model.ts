export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  userID: number;
  userName: string;
  name: string;
  email: string;
  role: string;
  areaID: number | null;
  areaName: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

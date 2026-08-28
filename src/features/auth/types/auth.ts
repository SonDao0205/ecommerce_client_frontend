export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email?: string | null;
  phone?: string;
  fullName?: string;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export type UserRole = 'customer' | 'admin';
export type AccountType = 'personal' | 'business';
export type UserStatus = 'active' | 'inactive' | 'banned';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nif: string | null;
  accountType: AccountType;
  role: UserRole;
  status: UserStatus;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  fullName: string;
  phone: string;
  nif?: string;
  accountType: 'personal';
}

export interface ApiEnvelope<T> {
  status: 'success';
  data: T;
}

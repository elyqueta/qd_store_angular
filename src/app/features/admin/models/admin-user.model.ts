import { AccountType, AuthUser, UserRole, UserStatus } from '../../../core/auth/auth.models';

export interface AdminUserCompany {
  id: string;
  name: string;
  nif: string;
  role: string | null;
  status: string;
}

export type AdminUser = AuthUser;

export interface AdminUserDetail extends AdminUser {
  companies: AdminUserCompany[];
}

export interface AdminUserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUserListPage {
  items: AdminUser[];
  pagination: AdminUserPagination;
}

export interface AdminUserListParams {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  accountType?: AccountType;
  sort: AdminUserSort;
}

export type AdminUserSort = 'createdAt' | 'name' | 'email' | 'status';

export interface UpdateAdminUserStatusInput {
  status: UserStatus;
}

export interface UpdateAdminUserRoleInput {
  role: UserRole;
}

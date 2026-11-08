export type CompanyStatus = 'active' | 'inactive' | 'banned';

export interface Company {
  id: string;
  ownerId: string;
  name: string;
  nif: string;
  sector: string | null;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUser {
  id: string;
  fullName: string;
  email: string;
  companyRole: string | null;
}

export interface CompanyWithUsers extends Company {
  users: CompanyUser[];
}

export interface CreateCompanyInput {
  name: string;
  nif: string;
  role?: string;
  sector?: string;
}

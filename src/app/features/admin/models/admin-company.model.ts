export interface AdminCompany {
  id: string;
  ownerId: string;
  name: string;
  nif: string;
  sector: string | null;
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAdminCompanyInput {
  name?: string;
  sector?: string | null;
}

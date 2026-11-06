export interface Company {
  id: string;
  ownerId: string;
  name: string;
  nif: string;
  sector: string | null;
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyInput {
  name: string;
  nif: string;
  sector?: string;
}

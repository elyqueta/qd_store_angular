export interface Address {
  id: string;
  userId: string;
  label: string | null;
  province: string;
  municipality: string;
  neighborhood: string;
  address: string;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  label?: string;
  province: string;
  municipality: string;
  neighborhood: string;
  address: string;
  reference?: string;
}

export interface UpdateAddressInput {
  label?: string | null;
  province?: string;
  municipality?: string;
  neighborhood?: string;
  address?: string;
  reference?: string | null;
}

export interface ProvinceWithMunicipalities {
  slug: string;
  name: string;
  municipalities: string[];
}

export interface ApiSingleResponse<T> {
  status: 'success';
  data: T;
}

export interface ApiListResponse<T> {
  status: 'success';
  data: T[];
  count?: number;
}

import { AdminCompany } from './admin-company.model';

export interface AdminDeliveryType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: 'standard' | 'express' | 'corporate' | 'pickup';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCompanyUser {
  id: string;
  fullName: string;
  email: string;
  companyRole: string | null;
}

export interface AdminCompanyWithUsers extends AdminCompany {
  users: AdminCompanyUser[];
}

export interface AdminDashboardSummary {
  products: number;
  categories: number;
  deliveryTypes: number;
  companies: number;
}

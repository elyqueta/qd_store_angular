import { AdminCompany } from './admin-company.model';
import { DeliveryType } from '../../public/models/delivery-type.model';

export interface AdminDeliveryType extends DeliveryType {
  isActive: boolean;
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

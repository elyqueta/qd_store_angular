import { AdminDeliveryType } from './admin-dashboard.model';

export type AdminDeliveryMode = AdminDeliveryType['type'];

export interface CreateAdminDeliveryTypeInput {
  name: string;
  description?: string;
  price: number;
  type: AdminDeliveryMode;
}

export interface UpdateAdminDeliveryTypeInput {
  name?: string;
  description?: string | null;
  price?: number;
  type?: AdminDeliveryMode;
}

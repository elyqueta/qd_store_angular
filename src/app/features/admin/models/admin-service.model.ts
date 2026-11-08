import { StoreService } from '../../public/models/store-service.model';

export type AdminService = StoreService;

export interface CreateAdminServiceInput {
  name: string;
  description?: string | null;
  icon: string;
  startsFromPrice?: number;
  isActive?: boolean;
  image?: File | null;
}

export type UpdateAdminServiceInput = Partial<CreateAdminServiceInput>;

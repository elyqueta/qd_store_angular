export interface StoreService {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  imageUrl: string | null;
  startsFromPrice: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

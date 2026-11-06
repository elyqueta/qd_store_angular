export type DeliveryMode = 'standard' | 'express' | 'corporate' | 'pickup';

export interface DeliveryType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: DeliveryMode;
  createdAt: string;
  updatedAt: string;
}

import { ProductStatus } from '../../public/models/product.model';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productStatus: ProductStatus;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemsCount: number;
  total: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  status: ProductStatus;
  imageUrl: string | null;
  createdAt: string;
}

export type OrderStatus = 'processing' | 'in_transit' | 'delivered' | 'cancelled';
export type PaymentMethodType = 'multicaixa_express' | 'multicaixa_reference' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  id: string;
  reference: string;
  type: 'personal' | 'business';
  status: OrderStatus;
  total: number;
  itemsCount: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderAddress {
  province: string;
  municipality: string;
  neighborhood: string;
  address: string;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface OrderHistoryEntry {
  id: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
}

export interface Order extends OrderSummary {
  userId: string;
  companyId: string | null;
  paymentMethodId: string;
  deliveryTypeId: string;
  deliveryPrice: number;
  notes: string | null;
  address: OrderAddress;
  items: OrderItem[];
  history: OrderHistoryEntry[];
  payment: PaymentSummary | null;
  updatedAt: string;
}

export interface PaymentSummary {
  id: string;
  methodType: PaymentMethodType;
  status: PaymentStatus;
}

export interface PaymentExpressDetails {
  methodType: 'multicaixa_express';
  customerPhone: string | null;
  apiTransactionId: string | null;
}

export interface PaymentReferenceDetails {
  methodType: 'multicaixa_reference';
  entity: string;
  reference: string;
  expiresAt: string;
  referenceStatus: 'pending' | 'paid' | 'expired' | 'cancelled';
}

export interface PaymentBankTransferDetails {
  methodType: 'bank_transfer';
  destinationIban: string;
  destinationBank: string;
  destinationHolder: string;
  confirmedBy?: string | null;
}

export interface Payment {
  id: string;
  orderId: string;
  methodType: PaymentMethodType;
  status: PaymentStatus;
  amount: number;
  amountPaid: number | null;
  paidAt: string | null;
  transactionReference: string | null;
  notes: string | null;
  createdAt: string;
  details: PaymentExpressDetails | PaymentReferenceDetails | PaymentBankTransferDetails;
}

export type CreatePaymentInput =
  | { methodType: 'multicaixa_express'; customerPhone: string }
  | { methodType: 'multicaixa_reference' }
  | { methodType: 'bank_transfer' };

export interface CreateOrderInput {
  deliveryTypeId: string;
  paymentMethodId: string;
  addressId: string;
  companyId?: string;
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'promotion' | 'newsletter' | 'system';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

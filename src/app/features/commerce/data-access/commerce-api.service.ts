import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import {
  Cart,
  CreateOrderInput,
  CreatePaymentInput,
  Notification,
  Order,
  OrderStatus,
  OrderSummary,
  PageResult,
  Payment,
  PaymentMethod,
  WishlistItem,
} from '../models/commerce.model';

interface ApiSingleResponse<T> {
  status: 'success';
  data: T;
}

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
}

interface ApiPageResponse<T> {
  status: 'success';
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class CommerceApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL).replace(/\/+$/, '')}/api/v1`;

  getCart(): Observable<Cart> {
    return this.http
      .get<ApiSingleResponse<Cart>>(`${this.endpoint}/cart`)
      .pipe(map((response) => response.data));
  }

  addCartItem(productId: string, quantity = 1): Observable<Cart> {
    return this.http
      .post<ApiSingleResponse<Cart>>(`${this.endpoint}/cart/items`, { productId, quantity })
      .pipe(map((response) => response.data));
  }

  updateCartItem(itemId: string, quantity: number): Observable<Cart> {
    return this.http
      .patch<ApiSingleResponse<Cart>>(`${this.endpoint}/cart/items/${encodeURIComponent(itemId)}`, {
        quantity,
      })
      .pipe(map((response) => response.data));
  }

  removeCartItem(itemId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/cart/items/${encodeURIComponent(itemId)}`)
      .pipe(map(() => undefined));
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/cart`).pipe(map(() => undefined));
  }

  getWishlist(): Observable<WishlistItem[]> {
    return this.http
      .get<ApiListResponse<WishlistItem>>(`${this.endpoint}/wishlist`)
      .pipe(map((response) => response.data));
  }

  addWishlistItem(productId: string): Observable<WishlistItem> {
    return this.http
      .post<ApiSingleResponse<WishlistItem>>(`${this.endpoint}/wishlist`, { productId })
      .pipe(map((response) => response.data));
  }

  removeWishlistItem(productId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/wishlist/${encodeURIComponent(productId)}`)
      .pipe(map(() => undefined));
  }

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http
      .get<ApiListResponse<PaymentMethod>>(`${this.endpoint}/payment-methods`)
      .pipe(map((response) => response.data));
  }

  listOrders(page = 1, limit = 20, status?: OrderStatus): Observable<PageResult<OrderSummary>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiPageResponse<OrderSummary>>(`${this.endpoint}/orders`, { params }).pipe(
      map(({ data, pagination }) => ({
        items: data,
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      })),
    );
  }

  getOrder(orderId: string): Observable<Order> {
    return this.http
      .get<ApiSingleResponse<Order>>(`${this.endpoint}/orders/${encodeURIComponent(orderId)}`)
      .pipe(map((response) => response.data));
  }

  createOrder(input: CreateOrderInput, idempotencyKey?: string): Observable<Order> {
    return this.http
      .post<ApiSingleResponse<Order>>(`${this.endpoint}/orders`, input, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      })
      .pipe(map((response) => response.data));
  }

  cancelOrder(orderId: string): Observable<Order> {
    return this.http
      .post<ApiSingleResponse<Order>>(
        `${this.endpoint}/orders/${encodeURIComponent(orderId)}/cancel`,
        {},
      )
      .pipe(map((response) => response.data));
  }

  listPayments(orderId: string): Observable<Payment[]> {
    return this.http
      .get<ApiListResponse<Payment>>(
        `${this.endpoint}/orders/${encodeURIComponent(orderId)}/payments`,
      )
      .pipe(map((response) => response.data));
  }

  createPayment(orderId: string, input: CreatePaymentInput): Observable<Payment> {
    return this.http
      .post<ApiSingleResponse<Payment>>(
        `${this.endpoint}/orders/${encodeURIComponent(orderId)}/payments`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  listNotifications(
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Observable<PageResult<Notification>> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('unreadOnly', unreadOnly);
    return this.http
      .get<ApiPageResponse<Notification>>(`${this.endpoint}/notifications`, { params })
      .pipe(
        map(({ data, pagination }) => ({
          items: data,
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: pagination.totalPages,
        })),
      );
  }

  getUnreadNotificationCount(): Observable<number> {
    return this.http
      .get<ApiSingleResponse<{ count: number }>>(`${this.endpoint}/notifications/unread-count`)
      .pipe(map((response) => response.data.count));
  }

  markNotificationRead(notificationId: string): Observable<Notification> {
    return this.http
      .patch<ApiSingleResponse<Notification>>(
        `${this.endpoint}/notifications/${encodeURIComponent(notificationId)}/read`,
        {},
      )
      .pipe(map((response) => response.data));
  }

  markAllNotificationsRead(): Observable<number> {
    return this.http
      .patch<ApiSingleResponse<{ updated: number }>>(`${this.endpoint}/notifications/read-all`, {})
      .pipe(map((response) => response.data.updated));
  }
}

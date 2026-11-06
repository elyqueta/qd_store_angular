import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CommerceApiService } from './commerce-api.service';

const apiRoot = `${environment.apiUrl}/api/v1`;

describe('CommerceApiService', () => {
  let api: CommerceApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CommerceApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads the cart and submits cart item changes to the existing endpoints', async () => {
    const cart = { id: 'cart-1', items: [], itemsCount: 0, total: 0 };
    const read = firstValueFrom(api.getCart());
    httpTesting.expectOne(`${apiRoot}/cart`).flush({ status: 'success', data: cart });
    await expect(read).resolves.toEqual(cart);

    const add = firstValueFrom(api.addCartItem('product-1', 2));
    const addRequest = httpTesting.expectOne(`${apiRoot}/cart/items`);
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toEqual({ productId: 'product-1', quantity: 2 });
    addRequest.flush({ status: 'success', data: cart });
    await expect(add).resolves.toEqual(cart);

    const update = firstValueFrom(api.updateCartItem('item-1', 3));
    const updateRequest = httpTesting.expectOne(`${apiRoot}/cart/items/item-1`);
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ quantity: 3 });
    updateRequest.flush({ status: 'success', data: cart });
    await expect(update).resolves.toEqual(cart);

    const remove = firstValueFrom(api.removeCartItem('item-1'));
    httpTesting.expectOne(`${apiRoot}/cart/items/item-1`).flush(null, {
      status: 204,
      statusText: 'No Content',
    });
    await expect(remove).resolves.toBeUndefined();
  });

  it('uses the wishlist endpoints and unwraps collection and item responses', async () => {
    const list = firstValueFrom(api.getWishlist());
    httpTesting
      .expectOne(`${apiRoot}/wishlist`)
      .flush({ status: 'success', data: [{ id: 'saved-1', productId: 'product-1' }] });
    await expect(list).resolves.toHaveLength(1);

    const add = firstValueFrom(api.addWishlistItem('product-2'));
    const addRequest = httpTesting.expectOne(`${apiRoot}/wishlist`);
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toEqual({ productId: 'product-2' });
    addRequest.flush({ status: 'success', data: { id: 'saved-2', productId: 'product-2' } });
    await expect(add).resolves.toMatchObject({ productId: 'product-2' });

    const remove = firstValueFrom(api.removeWishlistItem('product-2'));
    httpTesting.expectOne(`${apiRoot}/wishlist/product-2`).flush(null, {
      status: 204,
      statusText: 'No Content',
    });
    await expect(remove).resolves.toBeUndefined();
  });

  it('loads public payment methods and creates orders without changing the contract', async () => {
    const methods = firstValueFrom(api.getPaymentMethods());
    httpTesting
      .expectOne(`${apiRoot}/payment-methods`)
      .flush({ status: 'success', data: [{ id: 'method-1', type: 'bank_transfer' }] });
    await expect(methods).resolves.toHaveLength(1);

    const input = {
      deliveryTypeId: 'delivery-1',
      paymentMethodId: 'method-1',
      addressId: 'address-1',
    };
    const create = firstValueFrom(api.createOrder(input));
    const request = httpTesting.expectOne(`${apiRoot}/orders`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({ status: 'success', data: { id: 'order-1', reference: 'QD-1' } });
    await expect(create).resolves.toMatchObject({ id: 'order-1' });
  });

  it('filters and unwraps orders, and uses the order-owned detail and cancel routes', async () => {
    const list = firstValueFrom(api.listOrders(2, 10, 'processing'));
    const listRequest = httpTesting.expectOne(
      (request) =>
        request.url === `${apiRoot}/orders` &&
        request.params.get('page') === '2' &&
        request.params.get('limit') === '10' &&
        request.params.get('status') === 'processing',
    );
    listRequest.flush({
      status: 'success',
      data: [{ id: 'order-1', status: 'processing' }],
      pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
    });
    await expect(list).resolves.toMatchObject({ items: [{ id: 'order-1' }], totalPages: 2 });

    const detail = firstValueFrom(api.getOrder('order-1'));
    httpTesting
      .expectOne(`${apiRoot}/orders/order-1`)
      .flush({ status: 'success', data: { id: 'order-1' } });
    await expect(detail).resolves.toMatchObject({ id: 'order-1' });

    const cancel = firstValueFrom(api.cancelOrder('order-1'));
    const cancelRequest = httpTesting.expectOne(`${apiRoot}/orders/order-1/cancel`);
    expect(cancelRequest.request.method).toBe('POST');
    cancelRequest.flush({ status: 'success', data: { id: 'order-1', status: 'cancelled' } });
    await expect(cancel).resolves.toMatchObject({ status: 'cancelled' });
  });

  it('sends payment attempts to the order-scoped API and lists their history', async () => {
    const input = { methodType: 'multicaixa_express' as const, customerPhone: '923456789' };
    const create = firstValueFrom(api.createPayment('order-1', input));
    const createRequest = httpTesting.expectOne(`${apiRoot}/orders/order-1/payments`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(input);
    createRequest.flush({ status: 'success', data: { id: 'payment-1', orderId: 'order-1' } });
    await expect(create).resolves.toMatchObject({ id: 'payment-1' });

    const list = firstValueFrom(api.listPayments('order-1'));
    httpTesting
      .expectOne(`${apiRoot}/orders/order-1/payments`)
      .flush({ status: 'success', data: [{ id: 'payment-1', orderId: 'order-1' }] });
    await expect(list).resolves.toHaveLength(1);
  });

  it('supports notification pagination, unread filtering, unread counts, and read actions', async () => {
    const list = firstValueFrom(api.listNotifications(1, 5, true));
    const listRequest = httpTesting.expectOne(
      (request) =>
        request.url === `${apiRoot}/notifications` &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '5' &&
        request.params.get('unreadOnly') === 'true',
    );
    listRequest.flush({
      status: 'success',
      data: [],
      pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
    });
    await expect(list).resolves.toMatchObject({ items: [], total: 0 });

    const unreadCount = firstValueFrom(api.getUnreadNotificationCount());
    httpTesting
      .expectOne(`${apiRoot}/notifications/unread-count`)
      .flush({ status: 'success', data: { count: 2 } });
    await expect(unreadCount).resolves.toBe(2);

    const markRead = firstValueFrom(api.markNotificationRead('notification-1'));
    httpTesting
      .expectOne(`${apiRoot}/notifications/notification-1/read`)
      .flush({ status: 'success', data: { id: 'notification-1', isRead: true } });
    await expect(markRead).resolves.toMatchObject({ isRead: true });

    const markAllRead = firstValueFrom(api.markAllNotificationsRead());
    const markAllRequest = httpTesting.expectOne(`${apiRoot}/notifications/read-all`);
    expect(markAllRequest.request.method).toBe('PATCH');
    markAllRequest.flush({ status: 'success', data: { updated: 2 } });
    await expect(markAllRead).resolves.toBe(2);
  });
});

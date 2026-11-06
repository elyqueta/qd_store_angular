import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminDeliveryTypeApiService } from './admin-delivery-type-api.service';

const apiRoot = `${environment.apiUrl}/api/v1`;

const deliveryType = {
  id: 'delivery-1',
  name: 'Entrega padrão',
  description: null,
  price: 2500,
  type: 'standard' as const,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminDeliveryTypeApiService', () => {
  let api: AdminDeliveryTypeApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AdminDeliveryTypeApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lists only the active delivery types returned by the public endpoint', async () => {
    const response = firstValueFrom(api.listActive());
    httpTesting.expectOne(`${apiRoot}/delivery-types`).flush({
      status: 'success',
      count: 1,
      data: [deliveryType],
    });
    await expect(response).resolves.toEqual([deliveryType]);
  });

  it('creates and partially updates delivery types', async () => {
    const createResponse = firstValueFrom(
      api.create({
        name: deliveryType.name,
        price: deliveryType.price,
        type: deliveryType.type,
      }),
    );
    const createRequest = httpTesting.expectOne(`${apiRoot}/delivery-types`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      name: deliveryType.name,
      price: deliveryType.price,
      type: deliveryType.type,
    });
    createRequest.flush({ status: 'success', data: deliveryType });
    await expect(createResponse).resolves.toEqual(deliveryType);

    const updateResponse = firstValueFrom(
      api.update('delivery-1', { description: null, price: 0 }),
    );
    const updateRequest = httpTesting.expectOne(`${apiRoot}/delivery-types/delivery-1`);
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ description: null, price: 0 });
    updateRequest.flush({
      status: 'success',
      data: { ...deliveryType, description: null, price: 0 },
    });
    await expect(updateResponse).resolves.toMatchObject({ price: 0 });
  });

  it('deactivates a delivery type with DELETE and maps the 204 response to void', async () => {
    const response = firstValueFrom(api.deactivate('delivery-1'));
    const request = httpTesting.expectOne(`${apiRoot}/delivery-types/delivery-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await expect(response).resolves.toBeUndefined();
  });
});

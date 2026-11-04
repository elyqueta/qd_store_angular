import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AddressApiService } from './address-api.service';

const addressEndpoint = `${environment.apiUrl}/api/v1/addresses`;
const address = {
  id: 'address-1',
  userId: 'user-1',
  label: 'Casa',
  province: 'Luanda',
  municipality: 'Talatona',
  neighborhood: 'Talatona',
  address: 'Rua Direita de Talatona, casa 10',
  reference: 'Perto do mercado',
  latitude: null,
  longitude: null,
  isDefault: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AddressApiService', () => {
  let api: AddressApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AddressApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lists addresses and unwraps the API envelope', async () => {
    const response = firstValueFrom(api.listAddresses());
    const request = httpTesting.expectOne(addressEndpoint);

    expect(request.request.method).toBe('GET');
    request.flush({ status: 'success', data: [address], count: 1 });

    await expect(response).resolves.toEqual([address]);
  });

  it('creates an address without sending owner or default-state fields', async () => {
    const input = {
      province: 'Luanda',
      municipality: 'Talatona',
      neighborhood: 'Talatona',
      address: 'Rua Direita de Talatona, casa 10',
      label: 'Casa',
    };
    const response = firstValueFrom(api.createAddress(input));
    const request = httpTesting.expectOne(addressEndpoint);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({ status: 'success', data: address });

    await expect(response).resolves.toEqual(address);
  });

  it('updates addresses using PATCH and preserves the paired location contract', async () => {
    const input = { province: 'Luanda', municipality: 'Viana', neighborhood: 'Viana' };
    const response = firstValueFrom(api.updateAddress('address-1', input));
    const request = httpTesting.expectOne(`${addressEndpoint}/address-1`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(input);
    request.flush({ status: 'success', data: { ...address, ...input } });

    await expect(response).resolves.toMatchObject(input);
  });

  it('sets the default address without a request body', async () => {
    const response = firstValueFrom(api.setDefaultAddress('address-1'));
    const request = httpTesting.expectOne(`${addressEndpoint}/address-1/default`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBeNull();
    request.flush({ status: 'success', data: address });

    await expect(response).resolves.toEqual(address);
  });

  it('deletes an address and accepts the API 204 response', async () => {
    const response = firstValueFrom(api.deleteAddress('address-1'));
    const request = httpTesting.expectOne(`${addressEndpoint}/address-1`);

    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    await expect(response).resolves.toBeUndefined();
  });
});

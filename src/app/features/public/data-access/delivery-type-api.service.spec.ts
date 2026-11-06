import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DeliveryTypeApiService } from './delivery-type-api.service';

const endpoint = `${environment.apiUrl}/api/v1/delivery-types`;

describe('DeliveryTypeApiService', () => {
  let api: DeliveryTypeApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(DeliveryTypeApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads the active delivery types from the public endpoint and unwraps the response', async () => {
    const deliveryTypes = [
      {
        id: 'delivery-1',
        name: 'Entrega padrão',
        description: 'Recebe a encomenda na morada indicada.',
        price: 2500,
        type: 'standard' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const response = firstValueFrom(api.listActive());
    const request = httpTesting.expectOne(endpoint);

    expect(request.request.method).toBe('GET');
    request.flush({ status: 'success', count: deliveryTypes.length, data: deliveryTypes });

    await expect(response).resolves.toEqual(deliveryTypes);
  });
});

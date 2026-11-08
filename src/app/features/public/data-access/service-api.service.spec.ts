import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ServiceApiService } from './service-api.service';

const endpoint = `${environment.apiUrl}/api/v1/services`;

describe('ServiceApiService', () => {
  let api: ServiceApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ServiceApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads active services and unwraps the API envelope', async () => {
    const services = [
      {
        id: 'service-1',
        name: 'Assistência técnica',
        description: 'Apoio técnico especializado.',
        icon: 'screwdriver-wrench',
        imageUrl: 'https://cdn.example.com/service.png',
        startsFromPrice: 5000,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const response = firstValueFrom(api.listActive());
    const request = httpTesting.expectOne(endpoint);

    expect(request.request.method).toBe('GET');
    request.flush({ status: 'success', count: services.length, data: services });

    await expect(response).resolves.toEqual(services);
  });
});

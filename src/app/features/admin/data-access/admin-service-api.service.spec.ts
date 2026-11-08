import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminServiceApiService } from './admin-service-api.service';

const endpoint = `${environment.apiUrl}/api/v1/services`;
const service = {
  id: 'service-1',
  name: 'Assistência técnica',
  description: 'Apoio técnico especializado.',
  icon: 'screwdriver-wrench',
  imageUrl: 'https://cdn.example.com/service.png',
  startsFromPrice: 5000,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminServiceApiService', () => {
  let api: AdminServiceApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AdminServiceApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('unwraps the admin list, including inactive services', async () => {
    const response = firstValueFrom(api.listAll());
    const request = httpTesting.expectOne(`${endpoint}/admin`);

    expect(request.request.method).toBe('GET');
    request.flush({ status: 'success', count: 1, data: [service] });

    await expect(response).resolves.toEqual([service]);
  });

  it('creates services as multipart data with the image field', async () => {
    const image = new File(['image'], 'service.webp', { type: 'image/webp' });
    const response = firstValueFrom(
      api.create({
        name: ' Assistência técnica ',
        description: ' Apoio técnico ',
        icon: 'screwdriver-wrench',
        startsFromPrice: 5000,
        isActive: true,
        image,
      }),
    );
    const request = httpTesting.expectOne(endpoint);

    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBe(true);
    const formData = request.request.body as FormData;
    expect(formData.get('name')).toBe('Assistência técnica');
    expect(formData.get('description')).toBe('Apoio técnico');
    expect(formData.get('icon')).toBe('screwdriver-wrench');
    expect(formData.get('startsFromPrice')).toBe('5000');
    expect(formData.get('isActive')).toBe('true');
    expect(formData.get('image')).toBe(image);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush({ status: 'success', data: service });

    await expect(response).resolves.toEqual(service);
  });

  it('updates activity via multipart PATCH and deactivates with DELETE', async () => {
    const updateResponse = firstValueFrom(api.update(service.id, { isActive: true }));
    const updateRequest = httpTesting.expectOne(`${endpoint}/${service.id}`);

    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body instanceof FormData).toBe(true);
    expect((updateRequest.request.body as FormData).get('isActive')).toBe('true');
    updateRequest.flush({ status: 'success', data: service });
    await expect(updateResponse).resolves.toEqual(service);

    const deactivateResponse = firstValueFrom(api.deactivate(service.id));
    const deactivateRequest = httpTesting.expectOne(`${endpoint}/${service.id}`);
    expect(deactivateRequest.request.method).toBe('DELETE');
    deactivateRequest.flush(null, { status: 204, statusText: 'No Content' });
    await expect(deactivateResponse).resolves.toBeUndefined();
  });
});

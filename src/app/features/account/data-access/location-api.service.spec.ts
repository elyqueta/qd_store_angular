import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LocationApiService } from './location-api.service';

const locationsEndpoint = `${environment.apiUrl}/api/v1/locations`;
const locations = [
  { slug: 'luanda', name: 'Luanda', municipalities: ['Belas', 'Talatona', 'Viana'] },
];

describe('LocationApiService', () => {
  let api: LocationApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(LocationApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads all province locations once and shares the cached result', async () => {
    const firstResponse = firstValueFrom(api.listProvinceLocations());
    const secondResponse = firstValueFrom(api.listProvinceLocations());
    const request = httpTesting.expectOne(locationsEndpoint);

    expect(request.request.method).toBe('GET');
    request.flush({ status: 'success', data: locations, count: 1 });

    await expect(firstResponse).resolves.toEqual(locations);
    await expect(secondResponse).resolves.toEqual(locations);
    await expect(firstValueFrom(api.listProvinceLocations())).resolves.toEqual(locations);
    httpTesting.expectNone(locationsEndpoint);
  });

  it('allows a failed location request to be retried', async () => {
    const failedResponse = firstValueFrom(api.listProvinceLocations());
    httpTesting.expectOne(locationsEndpoint).flush('Unavailable', {
      status: 503,
      statusText: 'Unavailable',
    });
    await expect(failedResponse).rejects.toBeTruthy();

    const retryResponse = firstValueFrom(api.listProvinceLocations());
    httpTesting.expectOne(locationsEndpoint).flush({ status: 'success', data: locations });
    await expect(retryResponse).resolves.toEqual(locations);
  });
});

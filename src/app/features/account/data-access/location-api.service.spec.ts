import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LocationApiService } from './location-api.service';

const locationsEndpoint = `${environment.apiUrl}/api/v1/locations`;
const provincesEndpoint = `${locationsEndpoint}/provinces`;
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

  it('loads and caches province names from the provinces endpoint', async () => {
    const firstResponse = firstValueFrom(api.listProvinces());
    const secondResponse = firstValueFrom(api.listProvinces());
    const request = httpTesting.expectOne(provincesEndpoint);

    expect(request.request.method).toBe('GET');
    request.flush({ status: 'success', data: [{ slug: 'luanda', name: 'Luanda' }] });

    await expect(firstResponse).resolves.toEqual([{ slug: 'luanda', name: 'Luanda' }]);
    await expect(secondResponse).resolves.toEqual([{ slug: 'luanda', name: 'Luanda' }]);
    await expect(firstValueFrom(api.listProvinces())).resolves.toEqual([
      { slug: 'luanda', name: 'Luanda' },
    ]);
    httpTesting.expectNone(provincesEndpoint);
  });

  it('loads and caches municipalities for the selected province', async () => {
    const endpoint = `${provincesEndpoint}/luanda/municipalities`;
    const firstResponse = firstValueFrom(api.listMunicipalities('luanda'));
    const secondResponse = firstValueFrom(api.listMunicipalities('luanda'));
    const request = httpTesting.expectOne(endpoint);

    expect(request.request.method).toBe('GET');
    request.flush({ status: 'success', data: ['Belas', 'Talatona', 'Viana'] });

    await expect(firstResponse).resolves.toEqual(['Belas', 'Talatona', 'Viana']);
    await expect(secondResponse).resolves.toEqual(['Belas', 'Talatona', 'Viana']);
    await expect(firstValueFrom(api.listMunicipalities('luanda'))).resolves.toEqual([
      'Belas',
      'Talatona',
      'Viana',
    ]);
    httpTesting.expectNone(endpoint);
  });

  it('allows failed municipality requests to be retried', async () => {
    const endpoint = `${provincesEndpoint}/luanda/municipalities`;
    const failedResponse = firstValueFrom(api.listMunicipalities('luanda'));
    httpTesting.expectOne(endpoint).flush('Unavailable', {
      status: 503,
      statusText: 'Unavailable',
    });
    await expect(failedResponse).rejects.toBeTruthy();

    const retryResponse = firstValueFrom(api.listMunicipalities('luanda'));
    httpTesting.expectOne(endpoint).flush({ status: 'success', data: ['Belas'] });
    await expect(retryResponse).resolves.toEqual(['Belas']);
  });
});

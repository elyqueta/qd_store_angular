import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IconCatalogApiService } from './icon-catalog-api.service';

describe('IconCatalogApiService', () => {
  let api: IconCatalogApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(IconCatalogApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads and unwraps the public icon catalog', async () => {
    const icons = [
      { name: 'laptop', label: 'Portátil', keywords: ['computador', 'portátil'] },
      { name: 'brands/whatsapp', label: 'WhatsApp', keywords: ['contacto'] },
    ];
    const response = firstValueFrom(api.listIcons());
    const request = httpTesting.expectOne(`${environment.apiUrl}/api/v1/icons`);

    expect(request.request.method).toBe('GET');
    request.flush({ status: 'success', data: icons, count: icons.length });

    await expect(response).resolves.toEqual(icons);
  });

  it('reuses the catalog response for subsequent consumers', async () => {
    const firstResponse = firstValueFrom(api.listIcons());
    httpTesting
      .expectOne(`${environment.apiUrl}/api/v1/icons`)
      .flush({ status: 'success', data: [{ name: 'camera', label: 'Câmara', keywords: [] }] });
    await expect(firstResponse).resolves.toHaveLength(1);

    await expect(firstValueFrom(api.listIcons())).resolves.toEqual([
      { name: 'camera', label: 'Câmara', keywords: [] },
    ]);
    httpTesting.expectNone(`${environment.apiUrl}/api/v1/icons`);
  });
});

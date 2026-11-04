import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminDashboardApiService } from './admin-dashboard-api.service';

const apiRoot = `${environment.apiUrl}/api/v1`;

describe('AdminDashboardApiService', () => {
  let api: AdminDashboardApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AdminDashboardApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('combines the supported API totals into dashboard metrics', async () => {
    const summaryPromise = firstValueFrom(api.getSummary());
    const productsRequest = httpTesting.expectOne(
      (request) =>
        request.url === `${apiRoot}/products` &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '1',
    );
    const categoriesRequest = httpTesting.expectOne(`${apiRoot}/categories`);
    const deliveryTypesRequest = httpTesting.expectOne(`${apiRoot}/delivery-types`);
    const companiesRequest = httpTesting.expectOne(`${apiRoot}/admin/companies`);

    productsRequest.flush({
      status: 'success',
      data: [],
      pagination: { page: 1, limit: 1, total: 17, totalPages: 17 },
    });
    categoriesRequest.flush({
      status: 'success',
      data: [{ id: 'category-1' }, { id: 'category-2' }],
    });
    deliveryTypesRequest.flush({
      status: 'success',
      data: [{ id: 'delivery-1' }],
    });
    companiesRequest.flush({
      status: 'success',
      data: [
        { id: 'company-1', users: [] },
        { id: 'company-2', users: [] },
      ],
    });

    await expect(summaryPromise).resolves.toEqual({
      products: 17,
      categories: 2,
      deliveryTypes: 1,
      companies: 2,
    });
  });
});

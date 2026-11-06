import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminCompanyApiService } from './admin-company-api.service';

const apiRoot = `${environment.apiUrl}/api/v1`;

const company = {
  id: 'company-1',
  ownerId: 'owner-1',
  name: 'QD Tecnologia',
  nif: '123456789',
  sector: 'Tecnologia',
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  users: [
    {
      id: 'owner-1',
      fullName: 'Utilizador Proprietário',
      email: 'owner@example.com',
      companyRole: 'Proprietário',
    },
  ],
};

describe('AdminCompanyApiService', () => {
  let api: AdminCompanyApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AdminCompanyApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lists companies with their members from the administrative endpoint', async () => {
    const response = firstValueFrom(api.list());
    httpTesting
      .expectOne(`${apiRoot}/admin/companies`)
      .flush({ status: 'success', count: 1, data: [company] });
    await expect(response).resolves.toEqual([company]);
  });

  it('partially updates a company', async () => {
    const response = firstValueFrom(api.update('company-1', { name: 'QD Store', sector: null }));
    const request = httpTesting.expectOne(`${apiRoot}/companies/company-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ name: 'QD Store', sector: null });
    request.flush({
      status: 'success',
      data: {
        id: company.id,
        ownerId: company.ownerId,
        name: 'QD Store',
        nif: company.nif,
        sector: null,
        status: company.status,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
    });
    await expect(response).resolves.toMatchObject({ name: 'QD Store', sector: null });
  });

  it('deactivates a company with DELETE and maps the 204 response to void', async () => {
    const response = firstValueFrom(api.deactivate('company-1'));
    const request = httpTesting.expectOne(`${apiRoot}/companies/company-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await expect(response).resolves.toBeUndefined();
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CompanyApiService } from './company-api.service';

const endpoint = `${environment.apiUrl}/api/v1/companies`;

describe('CompanyApiService', () => {
  let api: CompanyApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CompanyApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lists only the authenticated user companies and unwraps their members', async () => {
    const companies = [
      {
        id: 'company-1',
        ownerId: 'user-1',
        name: 'QD Tecnologia',
        nif: '005123456LA042',
        sector: 'Tecnologia',
        status: 'active' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        users: [
          {
            id: 'user-2',
            fullName: 'Maria Fernandes',
            email: 'maria@example.test',
            companyRole: 'Gerente',
          },
        ],
      },
    ];
    const response = firstValueFrom(api.listMine());
    const request = httpTesting.expectOne(`${endpoint}/mine`);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush({ status: 'success', data: companies });

    await expect(response).resolves.toEqual(companies);
  });

  it('creates a company and unwraps the API response', async () => {
    const company = {
      id: 'company-1',
      ownerId: 'user-1',
      name: 'QD Tecnologia',
      nif: '005123456LA042',
      sector: 'Tecnologia',
      status: 'active' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const response = firstValueFrom(
      api.createCompany(
        { name: company.name, nif: company.nif, sector: company.sector },
        'company-operation-1',
      ),
    );
    const request = httpTesting.expectOne(endpoint);

    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBe('company-operation-1');
    expect(request.request.body).toEqual({
      name: company.name,
      nif: company.nif,
      sector: company.sector,
    });
    request.flush({ status: 'success', data: company });

    await expect(response).resolves.toEqual(company);
  });

  it('associates a company member by email and optional role only', async () => {
    const association = {
      userId: 'user-2',
      companyId: 'company-1',
      role: 'Gerente',
      createdAt: '2026-01-02T00:00:00.000Z',
    };
    const response = firstValueFrom(
      api.associateUser('company-1', { email: 'maria@example.test', role: 'Gerente' }),
    );
    const request = httpTesting.expectOne(`${endpoint}/company-1/users`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'maria@example.test', role: 'Gerente' });
    expect(request.request.body).not.toHaveProperty('userId');
    request.flush({ status: 'success', data: association });

    await expect(response).resolves.toEqual(association);
  });
});

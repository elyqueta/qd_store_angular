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
      api.createCompany({ name: company.name, nif: company.nif, sector: company.sector }),
    );
    const request = httpTesting.expectOne(endpoint);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: company.name,
      nif: company.nif,
      sector: company.sector,
    });
    request.flush({ status: 'success', data: company });

    await expect(response).resolves.toEqual(company);
  });
});

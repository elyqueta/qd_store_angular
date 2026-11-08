import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateQuoteRequestInput, QuoteRequest } from '../models/quote-request.model';
import { QuoteRequestApiService } from './quote-request-api.service';

const apiV1 = `${environment.apiUrl}/api/v1`;
const quoteRequest: QuoteRequest = {
  id: 'quote-1',
  companyName: 'QD Tecnologia',
  nif: '123456789',
  contactName: 'Ana Silva',
  email: 'ana@example.com',
  phone: '+244 923 456 789',
  province: 'Luanda',
  municipality: 'Talatona',
  sector: 'Tecnologia',
  volume: '10 computadores',
  categories: ['Portáteis'],
  message: null,
  status: 'new',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('QuoteRequestApiService', () => {
  let api: QuoteRequestApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(QuoteRequestApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('submits the exact public request payload and unwraps the response', async () => {
    const input: CreateQuoteRequestInput = {
      companyName: 'QD Tecnologia',
      nif: '123456789',
      contactName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '+244 923 456 789',
      province: 'Luanda',
      municipality: 'Talatona',
      sector: 'Tecnologia',
      volume: '10 computadores',
      categories: ['Portáteis'],
      message: 'Proposta para o escritório',
    };
    const response = firstValueFrom(api.create(input));
    const request = httpTesting.expectOne(`${apiV1}/quote-requests`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({ status: 'success', data: quoteRequest });

    await expect(response).resolves.toEqual(quoteRequest);
  });

  it('lists admin requests using pagination, search, and status filters', async () => {
    const response = firstValueFrom(
      api.listAdmin({ page: 2, limit: 20, search: 'QD', status: 'contacted' }),
    );
    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${apiV1}/admin/quote-requests` &&
        candidate.params.get('page') === '2' &&
        candidate.params.get('limit') === '20' &&
        candidate.params.get('search') === 'QD' &&
        candidate.params.get('status') === 'contacted',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'success',
      data: [quoteRequest],
      pagination: { page: 2, limit: 20, total: 21, totalPages: 2 },
    });

    await expect(response).resolves.toEqual({
      items: [quoteRequest],
      pagination: { page: 2, limit: 20, total: 21, totalPages: 2 },
    });
  });

  it('updates the status of an admin request', async () => {
    const response = firstValueFrom(
      api.updateAdminStatus(quoteRequest.id, { status: 'contacted' }),
    );
    const request = httpTesting.expectOne(
      `${apiV1}/admin/quote-requests/${quoteRequest.id}/status`,
    );

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'contacted' });
    request.flush({ status: 'success', data: { ...quoteRequest, status: 'contacted' } });

    await expect(response).resolves.toEqual({ ...quoteRequest, status: 'contacted' });
  });
});

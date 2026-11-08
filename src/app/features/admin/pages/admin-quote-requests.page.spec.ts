import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { SeoService } from '../../../core/seo/seo.service';
import { QuoteRequestApiService } from '../../quote-requests/data-access/quote-request-api.service';
import { QuoteRequest, QuoteRequestStatus } from '../../quote-requests/models/quote-request.model';
import { AdminQuoteRequestsPage } from './admin-quote-requests.page';

const request: QuoteRequest = {
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

describe('AdminQuoteRequestsPage', () => {
  function configure() {
    const listCalls: Array<{
      page: number;
      limit: number;
      search?: string;
      status?: QuoteRequestStatus;
    }> = [];
    const statusUpdates: Array<{ id: string; status: QuoteRequestStatus }> = [];
    const api = {
      listAdmin: (params: (typeof listCalls)[number]) => {
        listCalls.push(params);
        return of({
          items: [request],
          pagination: { page: params.page, limit: params.limit, total: 21, totalPages: 2 },
        });
      },
      updateAdminStatus: (id: string, input: { status: QuoteRequestStatus }) => {
        statusUpdates.push({ id, status: input.status });
        return of({ ...request, status: input.status });
      },
    };

    TestBed.configureTestingModule({
      imports: [AdminQuoteRequestsPage],
      providers: [
        ...provideAppI18n(),
        { provide: QuoteRequestApiService, useValue: api },
        { provide: SeoService, useValue: { setPage: () => undefined } },
      ],
    });

    return { listCalls, statusUpdates };
  }

  it('applies search and status filters with the current pagination contract', () => {
    const { listCalls } = configure();
    const fixture = TestBed.createComponent(AdminQuoteRequestsPage);
    fixture.detectChanges();

    fixture.componentInstance.filters.setValue({ search: ' QD ', status: 'contacted' });
    fixture.componentInstance.applyFilters();

    expect(listCalls).toEqual([
      { page: 1, limit: 20 },
      { page: 1, limit: 20, search: 'QD', status: 'contacted' },
    ]);
    expect(fixture.componentInstance.pagination()).toEqual({
      page: 1,
      limit: 20,
      total: 21,
      totalPages: 2,
    });

    fixture.componentInstance.goToPage(2);
    expect(listCalls.at(-1)).toEqual({
      page: 2,
      limit: 20,
      search: 'QD',
      status: 'contacted',
    });
    fixture.destroy();
  });

  it('requires confirmation before updating a request status', () => {
    const { statusUpdates } = configure();
    const fixture = TestBed.createComponent(AdminQuoteRequestsPage);
    fixture.detectChanges();
    const select = document.createElement('select');
    select.add(new Option('Contactado', 'contacted'));
    select.value = 'contacted';
    const changeEvent = new Event('change');
    Object.defineProperty(changeEvent, 'target', { value: select });

    fixture.componentInstance.requestStatusChange(request, changeEvent);

    expect(statusUpdates).toEqual([]);
    expect(fixture.componentInstance.pendingStatusChange()).toEqual({
      requestId: request.id,
      status: 'contacted',
    });

    fixture.componentInstance.confirmStatusChange();

    expect(statusUpdates).toEqual([{ id: request.id, status: 'contacted' }]);
    expect(fixture.componentInstance.requests()[0].status).toBe('contacted');
    expect(fixture.componentInstance.pendingStatusChange()).toBeNull();
    fixture.destroy();
  });

  it('does not request confirmation when the selected status is unchanged', () => {
    const { statusUpdates } = configure();
    const fixture = TestBed.createComponent(AdminQuoteRequestsPage);
    fixture.detectChanges();
    const select = document.createElement('select');
    select.add(new Option('Novo', 'new'));
    select.value = request.status;
    const changeEvent = new Event('change');
    Object.defineProperty(changeEvent, 'target', { value: select });

    fixture.componentInstance.requestStatusChange(request, changeEvent);
    fixture.componentInstance.confirmStatusChange();

    expect(statusUpdates).toEqual([]);
    expect(fixture.componentInstance.pendingStatusChange()).toBeNull();
    fixture.destroy();
  });
});

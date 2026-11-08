import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminHighlightApiService } from './admin-highlight-api.service';

const apiRoot = `${environment.apiUrl}/api/v1`;
const highlight = {
  id: 'highlight-1',
  placement: 'hero',
  displayOrder: 1,
  title: 'Ofertas do mês',
  subtitle: 'Tecnologia em promoção.',
  label: 'Campanha',
  ctaLabel: 'Explorar',
  ctaUrl: '/produtos',
  imageUrl: 'https://cdn.example.com/banner.png',
  theme: 'dark',
  startsAt: '2026-01-01T00:00:00.000Z',
  endsAt: '2026-12-31T00:00:00.000Z',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminHighlightApiService', () => {
  let api: AdminHighlightApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(AdminHighlightApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('unwraps the admin highlight list response', async () => {
    const listPromise = firstValueFrom(api.listHighlights());
    const request = httpTesting.expectOne(`${apiRoot}/highlights/admin`);

    expect(request.request.method).toBe('GET');
    request.flush({ status: 'success', data: [highlight] });

    await expect(listPromise).resolves.toEqual([highlight]);
  });

  it('creates highlights as multipart form data and reorders them', async () => {
    const createdPromise = firstValueFrom(
      api.createHighlight({
        title: 'Oferta especial',
        subtitle: 'Últimos dias',
        ctaLabel: 'Ver mais',
        ctaUrl: '/produtos',
        placement: 'showcase',
        theme: 'brand',
      }),
    );

    const createRequest = httpTesting.expectOne(`${apiRoot}/highlights`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body instanceof FormData).toBe(true);
    expect((createRequest.request.body as FormData).get('title')).toBe('Oferta especial');
    expect((createRequest.request.body as FormData).get('placement')).toBe('showcase');

    createRequest.flush({ status: 'success', data: highlight });
    await expect(createdPromise).resolves.toEqual(highlight);

    const reorderPromise = firstValueFrom(api.reorder([{ id: highlight.id, displayOrder: 1 }]));
    const reorderRequest = httpTesting.expectOne(`${apiRoot}/highlights/reorder`);
    expect(reorderRequest.request.method).toBe('PATCH');
    expect(reorderRequest.request.body).toEqual({ items: [{ id: highlight.id, displayOrder: 1 }] });
    reorderRequest.flush({ status: 'success', data: [highlight] });

    await expect(reorderPromise).resolves.toEqual([highlight]);
  });

  it('updates the active state through multipart form data', async () => {
    const updatePromise = firstValueFrom(
      api.updateHighlight(highlight.id, { isActive: true }),
    );
    const request = httpTesting.expectOne(`${apiRoot}/highlights/${highlight.id}`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body instanceof FormData).toBe(true);
    expect((request.request.body as FormData).get('isActive')).toBe('true');

    request.flush({ status: 'success', data: { ...highlight, isActive: true } });
    await expect(updatePromise).resolves.toMatchObject({ isActive: true });
  });

  it('permanently deletes a highlight using the explicit permanent endpoint', async () => {
    const deletePromise = firstValueFrom(api.deleteHighlightPermanently(highlight.id));
    const request = httpTesting.expectOne(`${apiRoot}/highlights/${highlight.id}/permanent`);

    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await expect(deletePromise).resolves.toBeUndefined();
  });

  it('does not send a product page URL when a product is selected', async () => {
    const productId = '00000000-0000-4000-8000-000000000001';
    const createdPromise = firstValueFrom(
      api.createHighlight({
        title: 'Destaque com produto',
        subtitle: 'Descrição curta do produto.',
        ctaLabel: 'Ver produto',
        ctaUrl: '/produtos/abc-123',
        productId,
        placement: 'hero',
        theme: 'dark',
      }),
    );

    const request = httpTesting.expectOne(`${apiRoot}/highlights`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBe(true);

    const formData = request.request.body as FormData;
    expect(formData.get('productId')).toBe(productId);
    expect(formData.get('title')).toBe('Destaque com produto');
    expect(formData.get('subtitle')).toBe('Descrição curta do produto.');
    expect(formData.has('ctaUrl')).toBe(false);
    expect(formData.has('image')).toBe(false);

    request.flush({ status: 'success', data: { ...highlight, id: 'highlight-product' } });
    await expect(createdPromise).resolves.toMatchObject({ id: 'highlight-product' });
  });
});

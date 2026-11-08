import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HighlightApiService } from './highlight-api.service';

const apiRoot = `${environment.apiUrl}/api/v1`;
const heroItems = [
  {
    id: 'highlight-1',
    placement: 'hero',
    displayOrder: 1,
    title: 'Laptops para o dia a dia',
    subtitle: 'A tecnologia certa para o teu escritório e casa.',
    label: 'Oferta do mês',
    ctaLabel: 'Ver ofertas',
    ctaUrl: '/produtos',
    imageUrl: 'https://cdn.example.com/hero.png',
    theme: 'dark',
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2026-12-31T00:00:00.000Z',
    isActive: true,
  },
];

describe('HighlightApiService', () => {
  let api: HighlightApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(HighlightApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('unwraps a highlight list for a placement', async () => {
    const request = firstValueFrom(api.listHighlights('hero'));
    const req = httpTesting.expectOne(`${apiRoot}/highlights?placement=hero`);

    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: heroItems });

    await expect(request).resolves.toEqual(heroItems);
  });

  it('loads the public placement groups in parallel', async () => {
    const request = firstValueFrom(api.listPublicHighlights());

    const heroRequest = httpTesting.expectOne(`${apiRoot}/highlights?placement=hero`);
    const showcaseRequest = httpTesting.expectOne(`${apiRoot}/highlights?placement=showcase`);
    const categoryBlockRequest = httpTesting.expectOne(
      `${apiRoot}/highlights?placement=category_block`,
    );

    heroRequest.flush({ status: 'success', data: heroItems });
    showcaseRequest.flush({ status: 'success', data: [] });
    categoryBlockRequest.flush({ status: 'success', data: [] });

    await expect(request).resolves.toEqual({
      hero: heroItems,
      showcase: [],
      categoryBlock: [],
    });
  });
});

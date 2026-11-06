import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { SeoService } from '../../../core/seo/seo.service';
import { ProductApiService } from '../data-access/product-api.service';
import { CatalogPage } from './catalog.page';

describe('CatalogPage', () => {
  it('loads products using search, sort, category, status, and page query parameters', async () => {
    const queryParamMap = new BehaviorSubject(
      convertToParamMap({
        categoria: 'portateis',
        estado: 'active',
        pesquisa: 'laptop',
        ordem: 'price_asc',
        pagina: '2',
      }),
    );
    const listProducts = vi.fn(() =>
      of({ items: [], page: 2, limit: 12, total: 15, totalPages: 2 }),
    );

    await TestBed.configureTestingModule({
      imports: [CatalogPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: queryParamMap.asObservable() },
        },
        {
          provide: ProductApiService,
          useValue: {
            listCategories: () =>
              of([
                {
                  id: 'category-1',
                  slug: 'portateis',
                  label: 'Portáteis',
                  icon: null,
                  createdAt: '2026-01-01T00:00:00.000Z',
                  updatedAt: '2026-01-01T00:00:00.000Z',
                },
              ]),
            listProducts,
          },
        },
        { provide: SeoService, useValue: { setPage: () => undefined } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CatalogPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('15 produtos');
    expect(listProducts).toHaveBeenLastCalledWith({
      page: 2,
      categoryId: 'category-1',
      limit: 12,
      status: 'active',
      search: 'laptop',
      sort: 'price_asc',
    });

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.searchInput.set(' portátil ');
    fixture.componentInstance.submitSearch();

    expect(navigate).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({
        queryParams: { pesquisa: 'portátil', pagina: 1 },
        queryParamsHandling: 'merge',
      }),
    );

    const select = fixture.nativeElement.querySelector('#qd-catalog-sort');
    expect(select).toBeInstanceOf(HTMLSelectElement);
    if (!(select instanceof HTMLSelectElement)) {
      return;
    }

    select.value = 'price_desc';
    select.dispatchEvent(new Event('change'));
    expect(navigate).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({
        queryParams: { ordem: 'price_desc', pagina: 1 },
        queryParamsHandling: 'merge',
      }),
    );

    fixture.componentInstance.clearFilters();
    expect(navigate).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({
        queryParams: {
          categoria: null,
          estado: null,
          pesquisa: null,
          ordem: null,
          pagina: 1,
        },
        queryParamsHandling: 'merge',
      }),
    );
  });
});

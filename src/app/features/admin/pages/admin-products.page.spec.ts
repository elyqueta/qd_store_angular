import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { Product, ProductListPage } from '../../public/models/product.model';
import { AdminProductApiService } from '../data-access/admin-product-api.service';
import { AdminProductsPage } from './admin-products.page';

const product: Product = {
  id: 'product-1',
  categoryId: 'category-1',
  categoryName: 'Portáteis',
  name: 'Computador portátil',
  description: null,
  price: 250000,
  originalPrice: null,
  badge: null,
  status: 'active',
  mainImage: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const pageResult: ProductListPage = {
  items: [product],
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
};

describe('AdminProductsPage', () => {
  it('renders products and sends search and status filters to the API', async () => {
    const requests: unknown[] = [];
    const api = {
      listProducts: (params: unknown): Observable<ProductListPage> => {
        requests.push(params);
        return of(pageResult);
      },
      deleteProduct: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AdminProductsPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: AdminProductApiService, useValue: api },
        { provide: SeoService, useValue: { setPage: () => undefined } },
        { provide: ToastService, useValue: { success: () => undefined, error: () => undefined } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminProductsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Computador portátil');

    fixture.componentInstance.filters.setValue({
      search: 'portátil',
      status: 'active',
    });
    fixture.componentInstance.applyFilters();

    expect(requests).toEqual([
      { page: 1, limit: 20 },
      { page: 1, limit: 20, status: 'active', search: 'portátil' },
    ]);
  });
});

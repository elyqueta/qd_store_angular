import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { ProductApiService } from '../../public/data-access/product-api.service';
import { AdminProductApiService } from '../data-access/admin-product-api.service';
import { AdminProductFormPage } from './admin-product-form.page';

describe('AdminProductFormPage', () => {
  it('creates the product with its selected image in one request', async () => {
    const createdProduct = {
      id: 'product-1',
      categoryId: 'category-1',
      name: 'Computador portátil',
      description: null,
      price: 250000,
      originalPrice: null,
      badge: null,
      status: 'active' as const,
      mainImage: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const createProduct = vi.fn(() => of(createdProduct));
    const file = new File(['image'], 'product.webp', { type: 'image/webp' });

    await TestBed.configureTestingModule({
      imports: [AdminProductFormPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([{ path: 'admin/produtos/:id', children: [] }]),
        { provide: ProductApiService, useValue: { listCategories: () => of([]) } },
        { provide: AdminProductApiService, useValue: { createProduct } },
        { provide: SeoService, useValue: { setPage: () => undefined } },
        {
          provide: ToastService,
          useValue: { success: () => undefined, warning: () => undefined, error: () => undefined },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminProductFormPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({
      categoryId: 'category-1',
      name: 'Computador portátil',
      description: '',
      price: 250000,
      originalPrice: 0,
      badge: '',
    });
    fixture.componentInstance.productImageFile.set(file);
    fixture.componentInstance.submitProduct();
    await fixture.whenStable();

    expect(createProduct).toHaveBeenCalledWith({
      categoryId: 'category-1',
      name: 'Computador portátil',
      price: 250000,
      image: file,
    });
  });

  it('rejects a previous price that is not greater than the current price', async () => {
    const createProduct = vi.fn(() => of());

    await TestBed.configureTestingModule({
      imports: [AdminProductFormPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
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
          },
        },
        {
          provide: AdminProductApiService,
          useValue: {
            createProduct,
            listProducts: () => of({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 }),
          },
        },
        { provide: SeoService, useValue: { setPage: () => undefined } },
        { provide: ToastService, useValue: { success: () => undefined, error: () => undefined } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminProductFormPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({
      categoryId: 'category-1',
      name: 'Computador portátil',
      description: '',
      price: 250000,
      originalPrice: 250000,
      badge: '',
    });
    fixture.componentInstance.submitProduct();
    fixture.detectChanges();

    expect(createProduct).not.toHaveBeenCalled();
    expect(fixture.componentInstance.formError()).toBe(
      'O preço anterior deve ser superior ao preço actual.',
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'O preço anterior deve ser superior ao preço actual.',
    );
  });
});

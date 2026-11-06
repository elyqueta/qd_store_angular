import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { CommerceApiService } from '../../commerce/data-access/commerce-api.service';
import { ProductApiService } from '../data-access/product-api.service';
import { ProductDetail } from '../models/product.model';
import { ProductPage } from './product.page';

const product: ProductDetail = {
  id: 'product-1',
  categoryId: 'category-1',
  categoryName: 'Portáteis',
  name: 'Computador portátil',
  description: 'Computador para trabalho.',
  price: 250000,
  originalPrice: 300000,
  badge: 'Promoção',
  status: 'active',
  mainImage: {
    id: 'image-1',
    productId: 'product-1',
    url: 'https://example.test/product-1.webp',
    displayOrder: 0,
    width: 1200,
    height: 1200,
    format: 'webp',
    sizeBytes: 12000,
  },
  images: [
    {
      id: 'image-2',
      productId: 'product-1',
      url: 'https://example.test/product-2.webp',
      displayOrder: 1,
      width: 1200,
      height: 1200,
      format: 'webp',
      sizeBytes: 12000,
    },
  ],
  specifications: [
    {
      id: 'spec-1',
      productId: 'product-1',
      specKey: 'Memória',
      specValue: '16 GB',
      displayOrder: 0,
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProductPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: product.id })) },
        },
        {
          provide: AuthStore,
          useValue: { isAuthenticated: () => false },
        },
        {
          provide: ProductApiService,
          useValue: {
            getProductById: () => of(product),
            listProducts: () => of({ items: [], page: 1, limit: 4, total: 0, totalPages: 0 }),
          },
        },
        {
          provide: CommerceApiService,
          useValue: {
            getWishlist: () => of([]),
            addCartItem: () => of({}),
            addWishlistItem: () => of({}),
            removeWishlistItem: () => of(undefined),
          },
        },
        { provide: SeoService, useValue: { setPage: () => undefined } },
        { provide: ToastService, useValue: { success: () => undefined, error: () => undefined } },
      ],
    }).compileComponents();
  });

  it('renders the product detail structure with a selectable image gallery', async () => {
    const fixture = TestBed.createComponent(ProductPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(product.name);
    expect(fixture.nativeElement.querySelector('nav ol')?.textContent).toContain('Portáteis');
    expect(fixture.nativeElement.querySelector('.aspect-square img')?.getAttribute('src')).toBe(
      product.mainImage?.url,
    );
    expect(fixture.nativeElement.querySelector('dl')?.textContent).toContain('16 GB');
    expect(fixture.nativeElement.textContent).toContain('250 000 Kz');
    expect(fixture.nativeElement.textContent).toContain('Inclui IVA · Pagamento em Kwanzas');
    expect(fixture.nativeElement.textContent).toContain('Comprar');

    const secondImageButton = fixture.nativeElement.querySelector(
      '[aria-label="Ver imagem 2"]',
    ) as HTMLButtonElement | null;
    expect(secondImageButton).not.toBeNull();
    secondImageButton?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.aspect-square img')?.getAttribute('src')).toBe(
      product.images[0].url,
    );
  });

  it('opens the purchase options dialog and closes it with Escape', async () => {
    const fixture = TestBed.createComponent(ProductPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const buyButton = fixture.nativeElement.querySelector(
      '[aria-haspopup="dialog"]',
    ) as HTMLButtonElement;
    buyButton.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Como preferes comprar?');
    expect(dialog?.textContent).toContain('Via WhatsApp');
    expect(dialog?.textContent).toContain('Comprar no Site');
    expect(dialog?.querySelector('a[href*="wa.me/244923000000"]')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(buyButton);
  });
});

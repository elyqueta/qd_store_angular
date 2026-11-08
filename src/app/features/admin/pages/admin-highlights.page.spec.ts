import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { AdminHighlightApiService } from '../data-access/admin-highlight-api.service';
import { AdminProductApiService } from '../data-access/admin-product-api.service';
import { AdminHighlight, CreateAdminHighlightInput } from '../models/admin-highlight.model';
import { Product } from '../../public/models/product.model';
import { AdminHighlightsPage } from './admin-highlights.page';

const productId = '00000000-0000-4000-8000-000000000001';
const product: Product = {
  id: productId,
  categoryId: '00000000-0000-4000-8000-000000000002',
  name: 'Computador portátil',
  description: 'Descrição detalhada do produto.'.repeat(12),
  price: 250000,
  originalPrice: null,
  badge: null,
  status: 'active',
  mainImage: {
    id: '00000000-0000-4000-8000-000000000003',
    productId,
    url: 'https://cdn.example.com/product.webp',
    displayOrder: 1,
    width: 800,
    height: 600,
    format: 'webp',
    sizeBytes: 12000,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const createdHighlight: AdminHighlight = {
  id: '00000000-0000-4000-8000-000000000004',
  placement: 'hero',
  displayOrder: 1,
  title: product.name,
  subtitle: product.description?.slice(0, 255) ?? null,
  label: null,
  ctaLabel: null,
  ctaUrl: null,
  imageUrl: product.mainImage?.url ?? null,
  product: {
    id: product.id,
    name: product.name,
    price: product.price,
    mainImageUrl: product.mainImage?.url ?? null,
  },
  theme: 'dark',
  startsAt: null,
  endsAt: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminHighlightsPage', () => {
  it('uses product content only when requested and submits product highlights without an image', async () => {
    const createHighlight = vi.fn((_input: CreateAdminHighlightInput) => of(createdHighlight));
    await TestBed.configureTestingModule({
      imports: [AdminHighlightsPage],
      providers: [
        ...provideAppI18n(),
        {
          provide: AdminHighlightApiService,
          useValue: { listHighlights: () => of([]), createHighlight },
        },
        {
          provide: AdminProductApiService,
          useValue: {
            listProducts: () => of({ items: [product], page: 1, limit: 100, total: 1, totalPages: 1 }),
          },
        },
        { provide: SeoService, useValue: { setPage: () => undefined } },
        { provide: ToastService, useValue: { success: () => undefined, error: () => undefined } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminHighlightsPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.productOptions.set([
      {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        mainImageUrl: product.mainImage?.url ?? null,
      },
    ]);
    page.form.patchValue({ productId, title: 'Título manual', subtitle: 'Subtítulo manual' });

    page.onUseProductContentChanged({ target: { checked: true } } as unknown as Event);

    expect(page.form.controls.title.value).toBe(product.name);
    expect(page.form.controls.subtitle.value).toBe(product.description?.slice(0, 255));

    page.submitForm();

    expect(createHighlight).toHaveBeenCalledWith(
      expect.objectContaining({
        title: product.name,
        subtitle: product.description?.slice(0, 255),
        productId,
        image: null,
      }),
    );
    expect(createHighlight.mock.calls[0]?.[0]).not.toHaveProperty('useProductContent');
    fixture.destroy();
  });
});

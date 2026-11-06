import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { provideAppI18n } from '../../core/i18n/i18n.providers';
import { Product } from '../../features/public/models/product.model';
import { ProductCardComponent } from './product-card.component';

const product: Product = {
  id: 'product-1',
  categoryId: 'category-1',
  name: 'Computador portátil',
  description: null,
  price: 250000,
  originalPrice: null,
  badge: null,
  status: 'active',
  mainImage: {
    id: 'image-1',
    productId: 'product-1',
    url: 'https://example.test/product-1.webp',
    displayOrder: 0,
    width: 1200,
    height: 900,
    format: 'webp',
    sizeBytes: 12000,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProductCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [provideRouter([]), ...provideAppI18n()],
    }).compileComponents();
  });

  it('marks the main image as decorative because the link contains the product details', async () => {
    const fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
    await fixture.whenStable();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(image?.getAttribute('src')).toBe(product.mainImage?.url);
    expect(image?.alt).toBe('');
    expect(fixture.nativeElement.querySelector('a')?.textContent).toContain(product.name);
  });

  it('uses a uniform card layout and a 4:3 image frame', async () => {
    const fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
    await fixture.whenStable();

    const card = fixture.nativeElement.querySelector('article') as HTMLElement | null;
    const imageFrame = fixture.nativeElement.querySelector(
      'article > a > div',
    ) as HTMLElement | null;
    const details = fixture.nativeElement.querySelector(
      'article > a > div:nth-child(2)',
    ) as HTMLElement | null;
    expect(card?.className).toContain('h-full');
    expect(card?.className).toContain('flex-col');
    expect(imageFrame?.className).toContain('aspect-[4/3]');
    expect(details?.className).toContain('min-h-36');
  });

  it('keeps the neutral placeholder when the product has no main image', async () => {
    const fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('product', { ...product, mainImage: null });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('qd-icon svg')).not.toBeNull();
  });
});

import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { SeoService } from './seo.service';
import { ProductDetail } from '../../features/public/models/product.model';

const product: ProductDetail = {
  id: 'product-1',
  categoryId: 'category-1',
  categoryName: 'Portáteis',
  name: 'Computador portátil',
  description: 'Descrição do produto.',
  price: 250000,
  originalPrice: null,
  badge: null,
  status: 'out_of_stock',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  images: [
    {
      id: 'image-1',
      productId: 'product-1',
      url: 'https://images.example.test/product.webp',
      displayOrder: 0,
      width: 1200,
      height: 900,
      format: 'webp',
      sizeBytes: 12000,
    },
  ],
  specifications: [],
};

describe('SeoService', () => {
  let seo: SeoService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    seo = TestBed.inject(SeoService);
    document = TestBed.inject(DOCUMENT);
  });

  it('updates title, description, robots, social metadata, and the canonical URL', () => {
    seo.setPage({
      title: 'Catálogo QD',
      description: 'Produtos disponíveis.',
      canonicalPath: '/produtos?categoria=portateis',
    });

    expect(document.title).toBe('Catálogo QD');
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content).toBe(
      'Produtos disponíveis.',
    );
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe(
      'index, follow',
    );
    expect(document.head.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content).toBe(
      'Catálogo QD',
    );
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="twitter:card"]')?.content).toBe(
      'summary',
    );
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toContain(
      '/produtos?categoria=portateis',
    );
  });

  it('creates valid Product JSON-LD with AOA and inventory availability', () => {
    seo.setPage(
      {
        title: product.name,
        description: product.description ?? '',
        canonicalPath: '/produtos/product-1',
        imageUrl: product.images[0].url,
      },
      product,
    );

    const script = document.getElementById('qd-product-jsonld');
    const structuredData = JSON.parse(script?.textContent ?? '{}') as {
      '@type': string;
      name: string;
      image: string[];
      offers: {
        price: number;
        priceCurrency: string;
        availability: string;
        url: string;
      };
    };

    expect(script?.getAttribute('type')).toBe('application/ld+json');
    expect(structuredData).toMatchObject({
      '@type': 'Product',
      name: product.name,
      image: [product.images[0].url],
      offers: {
        price: product.price,
        priceCurrency: 'AOA',
        availability: 'https://schema.org/OutOfStock',
      },
    });
    expect(structuredData.offers.url).toContain('/produtos/product-1');
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="twitter:card"]')?.content).toBe(
      'summary_large_image',
    );
  });

  it('removes product data and the canonical link on a noindex not-found page', () => {
    seo.setPage(
      { title: 'Produto', description: 'Produto.', canonicalPath: '/produto/1' },
      product,
    );
    seo.setPage({
      title: 'Página não encontrada',
      description: 'Não existe.',
      canonicalPath: null,
      robots: 'noindex, nofollow',
    });

    expect(document.getElementById('qd-product-jsonld')).toBeNull();
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe(
      'noindex, nofollow',
    );
    expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();
  });
});

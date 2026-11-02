import { DOCUMENT } from '@angular/common';
import { inject, Injectable, REQUEST } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ProductDetail } from '../../features/public/models/product.model';

export interface SeoPage {
  title: string;
  description: string;
  canonicalPath?: string | null;
  imageUrl?: string;
  robots?: string;
}

interface ProductOffer {
  '@type': 'Offer';
  price: number;
  priceCurrency: 'AOA';
  availability: string;
  url: string;
}

interface ProductStructuredData {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description?: string;
  image?: string[];
  offers: ProductOffer;
}

const PRODUCT_JSON_LD_ID = 'qd-product-jsonld';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly request = inject(REQUEST, { optional: true });

  setPage(page: SeoPage, product?: ProductDetail): void {
    const requestUrl = this.request ? new URL(this.request.url) : null;
    const canonicalUrl =
      page.canonicalPath === null
        ? null
        : new URL(
            page.canonicalPath ?? requestUrl?.pathname ?? this.document.location?.pathname ?? '/',
            requestUrl?.origin ?? this.document.baseURI,
          ).href;

    this.title.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ name: 'robots', content: page.robots ?? 'index, follow' });

    this.updateMeta('property', 'og:title', page.title);
    this.updateMeta('property', 'og:description', page.description);
    this.updateMeta('property', 'og:type', product ? 'product' : 'website');
    this.updateMeta('name', 'twitter:card', page.imageUrl ? 'summary_large_image' : 'summary');
    this.updateMeta('name', 'twitter:title', page.title);
    this.updateMeta('name', 'twitter:description', page.description);
    this.updateMeta('property', 'og:url', canonicalUrl);
    this.updateMeta('property', 'og:image', page.imageUrl ?? null);
    this.updateMeta('name', 'twitter:image', page.imageUrl ?? null);
    this.updateCanonical(canonicalUrl);

    if (product && canonicalUrl) {
      this.updateProductJsonLd(product, canonicalUrl);
    } else {
      this.removeProductJsonLd();
    }
  }

  private updateMeta(attribute: 'name' | 'property', key: string, content: string | null): void {
    const selector = `${attribute}="${key}"`;
    if (content === null) {
      this.meta.removeTag(selector);
      return;
    }

    this.meta.updateTag({ [attribute]: key, content });
  }

  private updateCanonical(canonicalUrl: string | null): void {
    const existing = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalUrl === null) {
      existing?.parentNode?.removeChild(existing);
      return;
    }

    const canonical = existing ?? this.document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = canonicalUrl;

    if (!existing) {
      this.document.head.appendChild(canonical);
    }
  }

  private updateProductJsonLd(product: ProductDetail, canonicalUrl: string): void {
    const availability = {
      active: 'https://schema.org/InStock',
      out_of_stock: 'https://schema.org/OutOfStock',
      inactive: 'https://schema.org/Discontinued',
    }[product.status];

    const structuredData: ProductStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      ...(product.description ? { description: product.description } : {}),
      ...(product.images.length ? { image: product.images.map((image) => image.url) } : {}),
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'AOA',
        availability,
        url: canonicalUrl,
      },
    };

    const script =
      this.document.getElementById(PRODUCT_JSON_LD_ID) ?? this.document.createElement('script');
    script.id = PRODUCT_JSON_LD_ID;
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(structuredData);

    if (!script.parentNode) {
      this.document.head.appendChild(script);
    }
  }

  private removeProductJsonLd(): void {
    const script = this.document.getElementById(PRODUCT_JSON_LD_ID);
    script?.parentNode?.removeChild(script);
  }
}

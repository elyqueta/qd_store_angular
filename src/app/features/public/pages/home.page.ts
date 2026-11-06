import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { SeoService } from '../../../core/seo/seo.service';
import { ProductApiService } from '../data-access/product-api.service';
import { Product, ProductCategory } from '../models/product.model';
import { ProductCardComponent } from '../../../shared/ui/product-card.component';
import { categoryIconName, IconComponent } from '../../../shared/ui/icon.component';

@Component({
  selector: 'qd-home-page',
  imports: [ProductCardComponent, RouterLink, TranslocoPipe, IconComponent],
  templateUrl: './home.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly productApi = inject(ProductApiService);
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);

  readonly categories = signal<ProductCategory[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly categoriesError = signal(false);

  readonly featuredProducts = computed(() => this.products().slice(0, 4));
  readonly categoryIconName = categoryIconName;

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('seo.home.title'),
      description: this.transloco.translate('seo.home.description'),
      canonicalPath: '/',
    });
    this.loadProducts();
    this.loadCategories();
  }

  private loadCategories(): void {
    this.productApi
      .listCategories()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (categories) => this.categories.set(categories.slice(0, 6)),
        error: () => this.categoriesError.set(true),
      });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productApi
      .listProducts({ limit: 8, status: 'active' })
      .pipe(
        takeUntilDestroyed(),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (page) => this.products.set(page.items),
        error: () => this.error.set('public.errors.featured'),
      });
  }
}

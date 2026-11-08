import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { SeoService } from '../../../core/seo/seo.service';
import { HighlightApiService } from '../data-access/highlight-api.service';
import { Highlight } from '../models/highlight.model';
import { ProductApiService } from '../data-access/product-api.service';
import { Product, ProductCategory } from '../models/product.model';
import { ProductCardComponent } from '../../../shared/ui/product-card.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { HomeHighlightCarouselComponent } from '../components/home-highlight-carousel.component';

@Component({
  selector: 'qd-home-page',
  imports: [
    ProductCardComponent,
    RouterLink,
    TranslocoPipe,
    IconComponent,
    HomeHighlightCarouselComponent,
  ],
  templateUrl: './home.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly productApi = inject(ProductApiService);
  private readonly highlightApi = inject(HighlightApiService);
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);

  readonly categories = signal<ProductCategory[]>([]);
  readonly products = signal<Product[]>([]);
  readonly heroHighlights = signal<Highlight[]>([]);
  readonly showcaseHighlights = signal<Highlight[]>([]);
  readonly categoryBlockHighlights = signal<Highlight[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly categoriesError = signal(false);
  readonly highlightsLoading = signal(true);
  readonly highlightsError = signal(false);

  readonly featuredProducts = computed(() => this.products().slice(0, 4));

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('seo.home.title'),
      description: this.transloco.translate('seo.home.description'),
      canonicalPath: '/',
    });
    this.loadProducts();
    this.loadCategories();
    this.loadHighlights();
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

  private loadHighlights(): void {
    this.highlightsLoading.set(true);
    this.highlightsError.set(false);

    this.highlightApi
      .listPublicHighlights()
      .pipe(
        takeUntilDestroyed(),
        finalize(() => this.highlightsLoading.set(false)),
      )
      .subscribe({
        next: ({ hero, showcase, categoryBlock }) => {
          this.heroHighlights.set(hero);
          this.showcaseHighlights.set(showcase);
          this.categoryBlockHighlights.set(categoryBlock);
        },
        error: () => {
          this.heroHighlights.set([]);
          this.showcaseHighlights.set([]);
          this.categoryBlockHighlights.set([]);
          this.highlightsError.set(true);
        },
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

import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize, Subscription } from 'rxjs';
import { SeoService } from '../../../core/seo/seo.service';
import { ProductApiService } from '../data-access/product-api.service';
import { Product, ProductCategory, ProductStatus } from '../models/product.model';
import { ProductCardComponent } from '../../../shared/ui/product-card.component';

@Component({
  selector: 'qd-catalog-page',
  imports: [ProductCardComponent, RouterLink, TranslocoPipe],
  templateUrl: './catalog.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productApi = inject(ProductApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);

  readonly categories = signal<ProductCategory[]>([]);
  readonly products = signal<Product[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly selectedStatus = signal<ProductStatus>('active');
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly categoriesError = signal(false);
  readonly statusOptions: ReadonlyArray<{ value: ProductStatus; label: string }> = [
    { value: 'active', label: 'public.catalog.status.active' },
    { value: 'out_of_stock', label: 'public.catalog.status.outOfStock' },
    { value: 'inactive', label: 'public.catalog.status.inactive' },
  ];
  private categoriesLoaded = false;
  private productsSubscription: Subscription | null = null;

  constructor() {
    this.loadCategories();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const categorySlug = params.get('categoria');
      this.selectedCategory.set(categorySlug);
      const requestedStatus = params.get('estado');
      this.selectedStatus.set(this.isProductStatus(requestedStatus) ? requestedStatus : 'active');
      const page = Number(params.get('pagina'));
      this.currentPage.set(Number.isInteger(page) && page > 0 ? page : 1);
      if (this.categoriesLoaded) {
        this.loadProducts();
      }
    });
  }

  private loadCategories(): void {
    this.productApi
      .listCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.categoriesLoaded = true;
          this.loadProducts();
        },
        error: () => {
          this.categoriesError.set(true);
          this.categoriesLoaded = true;
          this.loadProducts();
        },
      });
  }

  private loadProducts(): void {
    this.productsSubscription?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    const category = this.categories().find((item) => item.slug === this.selectedCategory());
    this.updateSeo(category?.label ?? null);

    if (this.selectedCategory() && !category) {
      this.products.set([]);
      this.totalPages.set(1);
      this.loading.set(false);
      return;
    }

    this.productsSubscription = this.productApi
      .listProducts({
        page: this.currentPage(),
        categoryId: category?.id,
        limit: 12,
        status: this.selectedStatus(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.products.set(page.items);
          this.totalPages.set(Math.max(page.totalPages, 1));
        },
        error: () => this.error.set('public.errors.catalog'),
      });
  }

  changeStatus(status: ProductStatus): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { estado: status, pagina: 1 },
      queryParamsHandling: 'merge',
    });
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pagina: page },
      queryParamsHandling: 'merge',
    });
  }

  private isProductStatus(status: string | null): status is ProductStatus {
    return status === 'active' || status === 'inactive' || status === 'out_of_stock';
  }

  private updateSeo(categoryLabel: string | null): void {
    const pageTitle = categoryLabel
      ? this.transloco.translate('seo.catalog.categoryTitle', { category: categoryLabel })
      : this.transloco.translate('seo.catalog.title');
    const description = categoryLabel
      ? this.transloco.translate('seo.catalog.categoryDescription', { category: categoryLabel })
      : this.transloco.translate('seo.catalog.description');
    const categorySlug = this.selectedCategory();

    this.seo.setPage({
      title:
        this.currentPage() > 1
          ? this.transloco.translate('seo.catalog.pageTitle', {
              title: pageTitle,
              page: this.currentPage(),
            })
          : pageTitle,
      description,
      canonicalPath: categorySlug
        ? `/produtos?categoria=${encodeURIComponent(categorySlug)}`
        : '/produtos',
    });
  }
}

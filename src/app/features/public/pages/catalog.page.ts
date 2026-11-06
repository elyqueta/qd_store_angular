import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize, Subscription } from 'rxjs';
import { SeoService } from '../../../core/seo/seo.service';
import { ProductApiService, ProductSort } from '../data-access/product-api.service';
import { Product, ProductCategory, ProductStatus } from '../models/product.model';
import { ProductCardComponent } from '../../../shared/ui/product-card.component';
import { IconComponent } from '../../../shared/ui/icon.component';

@Component({
  selector: 'qd-catalog-page',
  imports: [ProductCardComponent, RouterLink, TranslocoPipe, IconComponent],
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
  readonly searchInput = signal('');
  readonly selectedSearch = signal('');
  readonly selectedSort = signal<ProductSort | ''>('');
  readonly currentPage = signal(1);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly categoriesError = signal(false);
  readonly skeletonCards = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly selectedCategoryLabel = computed(
    () => this.categories().find((item) => item.slug === this.selectedCategory())?.label ?? null,
  );
  readonly hasActiveFilters = computed(
    () =>
      this.selectedCategory() !== null ||
      this.selectedStatus() !== 'active' ||
      this.selectedSearch().length > 0 ||
      this.selectedSort().length > 0,
  );
  readonly statusOptions: ReadonlyArray<{ value: ProductStatus; label: string }> = [
    { value: 'active', label: 'public.catalog.status.active' },
    { value: 'out_of_stock', label: 'public.catalog.status.outOfStock' },
    { value: 'inactive', label: 'public.catalog.status.inactive' },
  ];
  readonly sortOptions: ReadonlyArray<{ value: ProductSort | ''; label: string }> = [
    { value: '', label: 'public.catalog.sortDefault' },
    { value: 'price_asc', label: 'public.catalog.sortPriceAsc' },
    { value: 'price_desc', label: 'public.catalog.sortPriceDesc' },
    { value: 'name_asc', label: 'public.catalog.sortNameAsc' },
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
      const search = params.get('pesquisa')?.trim() ?? '';
      if (search !== this.selectedSearch()) {
        this.searchInput.set(search);
      }
      this.selectedSearch.set(search);
      const sort = params.get('ordem');
      this.selectedSort.set(this.isProductSort(sort) ? sort : '');
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
      this.total.set(0);
      this.totalPages.set(1);
      this.loading.set(false);
      return;
    }

    const search = this.selectedSearch();
    const sort = this.selectedSort();
    this.productsSubscription = this.productApi
      .listProducts({
        page: this.currentPage(),
        categoryId: category?.id,
        limit: 12,
        status: this.selectedStatus(),
        ...(search ? { search } : {}),
        ...(sort ? { sort } : {}),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.products.set(page.items);
          this.total.set(page.total);
          this.totalPages.set(Math.max(page.totalPages, 1));
        },
        error: () => {
          this.products.set([]);
          this.total.set(0);
          this.totalPages.set(1);
          this.error.set('public.errors.catalog');
        },
      });
  }

  changeStatus(status: ProductStatus): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { estado: status, pagina: 1 },
      queryParamsHandling: 'merge',
    });
  }

  setSearchInput(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.searchInput.set(input.value);
    }
  }

  clearSearch(): void {
    this.searchInput.set('');
  }

  clearFilters(): void {
    this.searchInput.set('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        categoria: null,
        estado: null,
        pesquisa: null,
        ordem: null,
        pagina: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  submitSearch(event?: Event): void {
    event?.preventDefault();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pesquisa: this.searchInput().trim() || null, pagina: 1 },
      queryParamsHandling: 'merge',
    });
  }

  changeSort(event: Event): void {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement)) {
      return;
    }

    const sort = select.value;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ordem: this.isProductSort(sort) ? sort : null, pagina: 1 },
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

  private isProductSort(sort: string | null): sort is ProductSort {
    return (
      sort === 'createdAt_desc' ||
      sort === 'createdAt_asc' ||
      sort === 'name_asc' ||
      sort === 'name_desc' ||
      sort === 'price_asc' ||
      sort === 'price_desc'
    );
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

import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { Product, ProductStatus } from '../../public/models/product.model';
import { AdminProductApiService } from '../data-access/admin-product-api.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'qd-admin-products-page',
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './admin-products.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductsPage {
  private readonly api = inject(AdminProductApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly seo = inject(SeoService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly products = signal<Product[]>([]);
  readonly page = signal(1);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly confirmingDeletionId = signal<string | null>(null);
  readonly pendingDeletionId = signal<string | null>(null);

  readonly filters = this.formBuilder.group({
    search: '',
    status: this.formBuilder.control<ProductStatus | ''>(''),
  });

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('admin.products.seoTitle'),
      description: this.transloco.translate('admin.products.seoDescription'),
      canonicalPath: null,
      robots: 'noindex, nofollow',
    });
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    const values = this.filters.getRawValue();
    const status = values.status;
    this.api
      .listProducts({
        page: this.page(),
        limit: PAGE_SIZE,
        ...(status ? { status } : {}),
        ...(values.search.trim() ? { search: values.search.trim() } : {}),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.products.set(result.items);
          this.total.set(result.total);
          this.totalPages.set(result.totalPages);
        },
        error: () => {
          this.products.set([]);
          this.total.set(0);
          this.totalPages.set(0);
          this.hasError.set(true);
        },
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadProducts();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) {
      return;
    }

    this.page.set(page);
    this.loadProducts();
  }

  requestDelete(product: Product): void {
    this.confirmingDeletionId.set(product.id);
  }

  cancelDelete(): void {
    this.confirmingDeletionId.set(null);
  }

  confirmDelete(product: Product): void {
    if (this.pendingDeletionId()) {
      return;
    }

    this.pendingDeletionId.set(product.id);
    this.api
      .deleteProduct(product.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingDeletionId.set(null)),
      )
      .subscribe({
        next: () => {
          this.confirmingDeletionId.set(null);
          this.toastService.success(this.transloco.translate('admin.products.messages.deleted'));
          if (this.products().length === 1 && this.page() > 1) {
            this.page.update((page) => page - 1);
          }
          this.loadProducts();
        },
        error: (error: unknown) => {
          this.confirmingDeletionId.set(null);
          this.toastService.error(this.getErrorMessage(error));
        },
      });
  }

  statusLabel(status: ProductStatus): string {
    const key = status === 'out_of_stock' ? 'outOfStock' : status;
    return this.transloco.translate(`public.catalog.status.${key}`);
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : this.transloco.translate('common.error');
  }
}

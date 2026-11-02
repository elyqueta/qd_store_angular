import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { ProductApiService } from '../data-access/product-api.service';
import { Product, ProductDetail } from '../models/product.model';
import { ProductCardComponent } from '../../../shared/ui/product-card.component';

@Component({
  selector: 'qd-product-page',
  imports: [CurrencyPipe, RouterLink, ProductCardComponent, TranslocoPipe],
  templateUrl: './product.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productApi = inject(ProductApiService);
  private readonly route = inject(ActivatedRoute);

  readonly product = signal<ProductDetail | null>(null);
  readonly relatedProducts = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly relatedError = signal<string | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const productId = params.get('id');
          if (!productId) {
            this.error.set('public.errors.product');
            this.loading.set(false);
            return EMPTY;
          }

          this.loading.set(true);
          this.error.set(null);
          this.product.set(null);
          this.relatedError.set(null);
          this.relatedProducts.set([]);
          return this.productApi.getProductById(productId).pipe(
            catchError(() => {
              this.error.set('public.errors.product');
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (product) => {
          this.product.set(product);
          this.loadRelatedProducts(product);
          this.loading.set(false);
        },
      });
  }

  private loadRelatedProducts(product: ProductDetail): void {
    this.productApi
      .listProducts({ categoryId: product.categoryId, limit: 4, status: 'active' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          if (this.product()?.id === product.id) {
            this.relatedProducts.set(
              page.items.filter((item) => item.id !== product.id).slice(0, 4),
            );
          }
        },
        error: () => this.relatedError.set('public.errors.relatedProducts'),
      });
  }
}

import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthStore } from '../../core/auth/auth.store';
import { ApiError } from '../../core/http/api-error.model';
import { ToastService } from '../../core/notifications/toast.service';
import { CommerceApiService } from '../../features/commerce/data-access/commerce-api.service';
import { Product } from '../../features/public/models/product.model';
import { IconComponent } from './icon.component';

@Component({
  selector: 'qd-product-card',
  imports: [RouterLink, CurrencyPipe, TranslocoPipe, IconComponent],
  templateUrl: './product-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  private readonly authStore = inject(AuthStore);
  private readonly commerceApi = inject(CommerceApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly product = input.required<Product>();
  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly busy = signal(false);
  readonly mainImageUrl = computed(() => this.product().mainImage?.url ?? null);

  readonly discountPercent = computed<number | null>(() => {
    const product = this.product();
    if (!product.originalPrice || product.originalPrice <= product.price) {
      return null;
    }

    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  });

  addToCart(): void {
    if (!this.isAuthenticated() || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.commerceApi
      .addCartItem(this.product().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.toast.success(this.transloco.translate('commerce.cart.added'));
        },
        error: (error: unknown) => {
          this.busy.set(false);
          this.toast.error(
            error instanceof ApiError ? error.message : this.transloco.translate('common.error'),
          );
        },
      });
  }

  addToWishlist(): void {
    if (!this.isAuthenticated() || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.commerceApi
      .addWishlistItem(this.product().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.toast.success(this.transloco.translate('commerce.wishlist.added'));
        },
        error: (error: unknown) => {
          this.busy.set(false);
          this.toast.error(
            error instanceof ApiError ? error.message : this.transloco.translate('common.error'),
          );
        },
      });
  }
}

import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { CommerceApiService } from '../data-access/commerce-api.service';
import { WishlistItem } from '../models/commerce.model';
import { IconComponent } from '../../../shared/ui/icon.component';

@Component({
  selector: 'qd-wishlist-page',
  imports: [CurrencyPipe, RouterLink, TranslocoPipe, IconComponent],
  templateUrl: './wishlist.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistPage implements OnInit {
  private readonly api = inject(CommerceApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly items = signal<WishlistItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly busyProductIds = signal<ReadonlySet<string>>(new Set());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .getWishlist()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(true);
          this.showError(error);
        },
      });
  }

  remove(productId: string): void {
    this.busyProductIds.update((ids) => new Set(ids).add(productId));
    this.api
      .removeWishlistItem(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.items.update((items) => items.filter((item) => item.productId !== productId));
          this.busyProductIds.update((ids) => {
            const next = new Set(ids);
            next.delete(productId);
            return next;
          });
        },
        error: (error: unknown) => {
          this.busyProductIds.update((ids) => {
            const next = new Set(ids);
            next.delete(productId);
            return next;
          });
          this.showError(error);
        },
      });
  }

  addToCart(productId: string): void {
    this.busyProductIds.update((ids) => new Set(ids).add(productId));
    this.api
      .addCartItem(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busyProductIds.update((ids) => {
            const next = new Set(ids);
            next.delete(productId);
            return next;
          });
          this.toast.success(this.transloco.translate('commerce.cart.added'));
        },
        error: (error: unknown) => {
          this.busyProductIds.update((ids) => {
            const next = new Set(ids);
            next.delete(productId);
            return next;
          });
          this.showError(error);
        },
      });
  }

  private showError(error: unknown): void {
    this.toast.error(
      error instanceof ApiError ? error.message : this.transloco.translate('common.error'),
    );
  }
}

import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { CommerceApiService } from '../data-access/commerce-api.service';
import { WishlistItem } from '../models/commerce.model';
import { IconComponent } from '../../../shared/ui/icon.component';
import { ProductPurchaseDialogComponent } from '../../../shared/ui/product-purchase-dialog.component';

@Component({
  selector: 'qd-wishlist-page',
  imports: [
    CurrencyPipe,
    RouterLink,
    TranslocoPipe,
    IconComponent,
    ProductPurchaseDialogComponent,
  ],
  templateUrl: './wishlist.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistPage implements OnInit {
  private readonly api = inject(CommerceApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly priceFormatter = new Intl.NumberFormat('pt-AO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  readonly items = signal<WishlistItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly busyProductIds = signal<ReadonlySet<string>>(new Set());
  readonly selectedItem = signal<WishlistItem | null>(null);
  readonly whatsappBuyUrl = computed(() => {
    const item = this.selectedItem();
    if (!item) {
      return 'https://wa.me/244923000000';
    }

    const message = [
      'Olá QD · ItSOLUTIONS!',
      '',
      'Quero comprar:',
      item.name,
      this.formatPrice(item.price),
      '',
      'Por favor confirmem disponibilidade.',
    ].join('\n');

    return `https://wa.me/244923000000?text=${encodeURIComponent(message)}`;
  });
  private buyTrigger?: HTMLButtonElement;

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

  discountPercent(item: WishlistItem): number | null {
    if (!item.originalPrice || item.originalPrice <= item.price) {
      return null;
    }

    return Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
  }

  formatPrice(price: number): string {
    return `${this.priceFormatter.format(price)} Kz`;
  }

  openBuyModal(item: WishlistItem, trigger: HTMLButtonElement): void {
    this.buyTrigger = trigger;
    this.selectedItem.set(item);
  }

  closeBuyModal(): void {
    this.selectedItem.set(null);
    this.buyTrigger?.focus();
    this.buyTrigger = undefined;
  }

  continuePurchase(): void {
    const item = this.selectedItem();
    if (!item || item.status !== 'active' || this.busyProductIds().has(item.productId)) {
      return;
    }

    this.addToCart(item.productId);
  }

  private addToCart(productId: string): void {
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
          this.closeBuyModal();
          this.toast.success(this.transloco.translate('commerce.cart.added'));
          void this.router.navigateByUrl('/conta/carrinho');
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

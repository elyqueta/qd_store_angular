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
import { Cart } from '../models/commerce.model';
import { IconComponent } from '../../../shared/ui/icon.component';

@Component({
  selector: 'qd-cart-page',
  imports: [CurrencyPipe, RouterLink, TranslocoPipe, IconComponent],
  templateUrl: './cart.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage implements OnInit {
  private readonly api = inject(CommerceApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly cart = signal<Cart | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly busyItems = signal<ReadonlySet<string>>(new Set());

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api
      .getCart()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cart) => {
          this.cart.set(cart);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.loadError.set(true);
          this.showError(error);
        },
      });
  }

  changeQuantity(itemId: string, quantity: number): void {
    if (quantity < 1 || quantity > 99) {
      return;
    }

    this.setItemBusy(itemId, true);
    this.api
      .updateCartItem(itemId, quantity)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cart) => {
          this.cart.set(cart);
          this.setItemBusy(itemId, false);
        },
        error: (error: unknown) => {
          this.setItemBusy(itemId, false);
          this.showError(error);
        },
      });
  }

  removeItem(itemId: string): void {
    this.setItemBusy(itemId, true);
    this.api
      .removeCartItem(itemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadCart(),
        error: (error: unknown) => {
          this.setItemBusy(itemId, false);
          this.showError(error);
        },
      });
  }

  private setItemBusy(itemId: string, busy: boolean): void {
    this.busyItems.update((items) => {
      const next = new Set(items);
      if (busy) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }

  private showError(error: unknown): void {
    this.toast.error(
      error instanceof ApiError ? error.message : this.transloco.translate('common.error'),
    );
  }
}

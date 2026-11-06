import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { OrderStatus, PageResult, OrderSummary } from '../models/commerce.model';

@Component({
  selector: 'qd-orders-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, TranslocoPipe],
  templateUrl: './orders.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  private readonly api = inject(CommerceApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly result = signal<PageResult<OrderSummary> | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly page = signal(1);
  readonly pageSize = 10;

  ngOnInit(): void {
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .listOrders(page, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.page.set(result.page);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.error.set(true);
          this.toast.error(
            error instanceof ApiError ? error.message : this.transloco.translate('common.error'),
          );
        },
      });
  }

  statusLabel(status: OrderStatus): string {
    return this.transloco.translate(`commerce.orders.status.${status}`);
  }

  changePage(page: number): void {
    const totalPages = this.result()?.totalPages ?? 0;
    if (page >= 1 && page <= totalPages) {
      this.load(page);
    }
  }
}

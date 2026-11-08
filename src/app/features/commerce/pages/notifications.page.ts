import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { CommerceApiService } from '../data-access/commerce-api.service';
import { Notification, PageResult } from '../models/commerce.model';

@Component({
  selector: 'qd-notifications-page',
  imports: [DatePipe, TranslocoPipe],
  templateUrl: './notifications.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPage implements OnInit {
  private readonly api = inject(CommerceApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly result = signal<PageResult<Notification> | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly pendingReadIds = signal<ReadonlySet<string>>(new Set());
  readonly markingAllRead = signal(false);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly hasUnread = () =>
    this.result()?.items.some((notification) => !notification.isRead) ?? false;

  ngOnInit(): void {
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .listNotifications(page, this.pageSize)
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
          this.showError(error);
        },
      });
  }

  markRead(notification: Notification): void {
    if (
      notification.isRead ||
      this.markingAllRead() ||
      this.pendingReadIds().has(notification.id)
    ) {
      return;
    }

    this.pendingReadIds.update((ids) => new Set(ids).add(notification.id));
    this.updateNotification({ ...notification, isRead: true });
    this.api
      .markNotificationRead(notification.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.updateNotification(updated);
          this.pendingReadIds.update((ids) => {
            const next = new Set(ids);
            next.delete(notification.id);
            return next;
          });
        },
        error: (error: unknown) => {
          this.updateNotification(notification);
          this.pendingReadIds.update((ids) => {
            const next = new Set(ids);
            next.delete(notification.id);
            return next;
          });
          this.showError(error);
        },
      });
  }

  markAllRead(): void {
    const result = this.result();
    if (
      this.markingAllRead() ||
      this.pendingReadIds().size > 0 ||
      !result?.items.some((notification) => !notification.isRead)
    ) {
      return;
    }

    const unreadItems = result.items.filter((notification) => !notification.isRead);
    this.markingAllRead.set(true);
    this.result.update((current) =>
      current
        ? {
            ...current,
            items: current.items.map((notification) => ({ ...notification, isRead: true })),
          }
        : current,
    );
    this.api
      .markAllNotificationsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.markingAllRead.set(false),
        error: (error: unknown) => {
          const unreadById = new Map(
            unreadItems.map((notification) => [notification.id, notification]),
          );
          this.result.update((current) =>
            current
              ? {
                  ...current,
                  items: current.items.map(
                    (notification) => unreadById.get(notification.id) ?? notification,
                  ),
                }
              : current,
          );
          this.markingAllRead.set(false);
          this.showError(error);
        },
      });
  }

  changePage(page: number): void {
    const totalPages = this.result()?.totalPages ?? 0;
    if (page >= 1 && page <= totalPages) {
      this.load(page);
    }
  }

  private updateNotification(notification: Notification): void {
    this.result.update((result) =>
      result
        ? {
            ...result,
            items: result.items.map((item) => (item.id === notification.id ? notification : item)),
          }
        : result,
    );
  }

  private showError(error: unknown): void {
    this.toast.error(
      error instanceof ApiError ? error.message : this.transloco.translate('common.error'),
    );
  }
}

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { SeoService } from '../../../core/seo/seo.service';
import { QuoteRequestApiService } from '../../quote-requests/data-access/quote-request-api.service';
import {
  ListQuoteRequestsParams,
  QuoteRequest,
  QuoteRequestPagination,
  QuoteRequestStatus,
} from '../../quote-requests/models/quote-request.model';

const PAGE_SIZE = 20;

interface PendingStatusChange {
  requestId: string;
  status: QuoteRequestStatus;
}

@Component({
  selector: 'qd-admin-quote-requests-page',
  imports: [DatePipe, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './admin-quote-requests.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminQuoteRequestsPage {
  private readonly api = inject(QuoteRequestApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);

  readonly requests = signal<QuoteRequest[]>([]);
  readonly pagination = signal<QuoteRequestPagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  readonly isLoading = signal(true);
  readonly hasLoadError = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly pendingStatusChange = signal<PendingStatusChange | null>(null);
  readonly pendingActionId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly filters = this.formBuilder.group({
    search: [''],
    status: this.formBuilder.control<QuoteRequestStatus | ''>(''),
  });

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('admin.quoteRequests.seoTitle'),
      description: this.transloco.translate('admin.quoteRequests.seoDescription'),
      canonicalPath: null,
      robots: 'noindex, nofollow',
    });
    this.loadRequests();
  }

  loadRequests(page = this.pagination().page): void {
    const values = this.filters.getRawValue();
    const search = values.search.trim();
    const params: ListQuoteRequestsParams = {
      page,
      limit: PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(values.status ? { status: values.status } : {}),
    };

    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.loadError.set(null);
    this.api
      .listAdmin(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.requests.set(result.items);
          this.pagination.set(result.pagination);
        },
        error: (error: unknown) => {
          this.requests.set([]);
          this.hasLoadError.set(true);
          this.loadError.set(this.getErrorMessage(error));
        },
      });
  }

  applyFilters(): void {
    this.loadRequests(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination().totalPages || this.isLoading()) {
      return;
    }
    this.loadRequests(page);
  }

  statusLabel(status: QuoteRequestStatus): string {
    return this.transloco.translate(`admin.quoteRequests.status.${status}`);
  }

  requestStatusChange(request: QuoteRequest, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    const status = target.value;
    if (!this.isQuoteRequestStatus(status) || request.status === status) {
      this.pendingStatusChange.set(null);
      this.actionError.set(null);
      return;
    }
    this.pendingStatusChange.set({ requestId: request.id, status });
    this.actionError.set(null);
  }

  cancelStatusChange(): void {
    this.pendingStatusChange.set(null);
    this.actionError.set(null);
  }

  confirmStatusChange(): void {
    const pending = this.pendingStatusChange();
    if (!pending || this.pendingActionId()) {
      return;
    }

    this.pendingActionId.set(pending.requestId);
    this.actionError.set(null);
    this.api
      .updateAdminStatus(pending.requestId, { status: pending.status })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingActionId.set(null)),
      )
      .subscribe({
        next: (updated) => {
          this.requests.update((items) =>
            items.map((request) => (request.id === updated.id ? updated : request)),
          );
          this.pendingStatusChange.set(null);
        },
        error: (error: unknown) => {
          this.actionError.set(this.getErrorMessage(error));
          this.pendingStatusChange.set(null);
        },
      });
  }

  private isQuoteRequestStatus(value: string): value is QuoteRequestStatus {
    return value === 'new' || value === 'contacted' || value === 'closed';
  }

  private getErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
      return this.transloco.translate('common.error');
    }

    const statusKey: Record<number, string> = {
      401: 'admin.quoteRequests.errors.unauthorized',
      403: 'admin.quoteRequests.errors.forbidden',
      404: 'admin.quoteRequests.errors.notFound',
      422: 'admin.quoteRequests.errors.validation',
    };
    const statusMessage = statusKey[error.status];
    if (statusMessage) {
      return this.transloco.translate(statusMessage);
    }
    return error.message || this.transloco.translate('common.error');
  }
}

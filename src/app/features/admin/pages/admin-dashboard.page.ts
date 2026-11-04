import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { SeoService } from '../../../core/seo/seo.service';
import { AdminDashboardApiService } from '../data-access/admin-dashboard-api.service';
import { AdminDashboardSummary } from '../models/admin-dashboard.model';

@Component({
  selector: 'qd-admin-dashboard-page',
  imports: [TranslocoPipe],
  templateUrl: './admin-dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage {
  private readonly api = inject(AdminDashboardApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);

  readonly summary = signal<AdminDashboardSummary | null>(null);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('admin.dashboard.seoTitle'),
      description: this.transloco.translate('admin.dashboard.seoDescription'),
      canonicalPath: null,
      robots: 'noindex, nofollow',
    });
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.api
      .getSummary()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: () => {
          this.summary.set(null);
          this.hasError.set(true);
        },
      });
  }
}

import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { CompanyApiService } from '../data-access/company-api.service';
import { CompanyStatus, CompanyWithUsers } from '../models/company.model';

@Component({
  selector: 'qd-company-list-page',
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './company-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyListPage {
  private readonly api = inject(CompanyApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly transloco = inject(TranslocoService);

  readonly companies = signal<CompanyWithUsers[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.api
      .listMine()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (companies) => this.companies.set(companies),
        error: (error: unknown) => {
          this.companies.set([]);
          this.loadError.set(
            error instanceof ApiError ? error.message : this.transloco.translate('common.error'),
          );
        },
      });
  }

  statusLabel(status: CompanyStatus): string {
    return this.transloco.translate(`account.companies.status.${status}`);
  }
}

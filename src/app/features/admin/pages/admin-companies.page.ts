import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { AdminCompanyApiService } from '../data-access/admin-company-api.service';
import { AdminCompanyWithUsers } from '../models/admin-dashboard.model';
import { UpdateAdminCompanyInput } from '../models/admin-company.model';

@Component({
  selector: 'qd-admin-companies-page',
  imports: [ReactiveFormsModule, TranslocoPipe],
  templateUrl: './admin-companies.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCompaniesPage {
  private readonly api = inject(AdminCompanyApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly seo = inject(SeoService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly companies = signal<AdminCompanyWithUsers[]>([]);
  readonly isLoading = signal(true);
  readonly hasLoadError = signal(false);
  readonly editingCompanyId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly confirmingDeactivationId = signal<string | null>(null);
  readonly pendingDeactivationId = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    sector: ['', Validators.maxLength(100)],
  });

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('admin.companies.seoTitle'),
      description: this.transloco.translate('admin.companies.seoDescription'),
      canonicalPath: null,
      robots: 'noindex, nofollow',
    });
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.api
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (companies) => this.companies.set(this.sort(companies)),
        error: () => {
          this.companies.set([]);
          this.hasLoadError.set(true);
        },
      });
  }

  openEditForm(company: AdminCompanyWithUsers): void {
    this.resetForm();
    this.form.setValue({ name: company.name, sector: company.sector ?? '' });
    this.editingCompanyId.set(company.id);
  }

  closeForm(): void {
    this.editingCompanyId.set(null);
    this.resetForm();
  }

  submitForm(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const editingId = this.editingCompanyId();
    const company = this.companies().find((item) => item.id === editingId);
    if (!editingId || !company) {
      this.formError.set(this.transloco.translate('admin.companies.errors.unavailable'));
      return;
    }

    const input = this.createUpdateInput(this.form.getRawValue(), company);
    if (!Object.keys(input).length) {
      this.closeForm();
      this.toastService.success(this.transloco.translate('admin.companies.messages.noChanges'));
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    this.api
      .update(editingId, input)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (updated) => {
          this.companies.update((companies) =>
            this.sort(
              companies.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
            ),
          );
          this.closeForm();
          this.toastService.success(this.transloco.translate('admin.companies.messages.updated'));
        },
        error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
      });
  }

  requestDeactivation(company: AdminCompanyWithUsers): void {
    this.confirmingDeactivationId.set(company.id);
  }

  cancelDeactivation(): void {
    this.confirmingDeactivationId.set(null);
  }

  confirmDeactivation(company: AdminCompanyWithUsers): void {
    if (this.pendingDeactivationId()) {
      return;
    }

    this.pendingDeactivationId.set(company.id);
    this.api
      .deactivate(company.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingDeactivationId.set(null)),
      )
      .subscribe({
        next: () => {
          this.companies.update((companies) =>
            companies.map((item) =>
              item.id === company.id ? { ...item, status: 'inactive' } : item,
            ),
          );
          this.confirmingDeactivationId.set(null);
          this.toastService.success(
            this.transloco.translate('admin.companies.messages.deactivated'),
          );
        },
        error: (error: unknown) => {
          this.confirmingDeactivationId.set(null);
          this.toastService.error(this.getErrorMessage(error));
        },
      });
  }

  statusLabel(status: AdminCompanyWithUsers['status']): string {
    return this.transloco.translate(`admin.companies.status.${status}`);
  }

  private createUpdateInput(
    values: ReturnType<typeof this.form.getRawValue>,
    company: AdminCompanyWithUsers,
  ): UpdateAdminCompanyInput {
    const input: UpdateAdminCompanyInput = {};
    const name = values.name.trim();
    const sector = values.sector.trim();

    if (name !== company.name) {
      input.name = name;
    }
    if (sector !== (company.sector ?? '')) {
      input.sector = sector || null;
    }

    return input;
  }

  private resetForm(): void {
    this.form.reset({ name: '', sector: '' });
    this.formError.set(null);
  }

  private sort(companies: AdminCompanyWithUsers[]): AdminCompanyWithUsers[] {
    return [...companies].sort((first, second) => first.name.localeCompare(second.name));
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : this.transloco.translate('common.error');
  }
}

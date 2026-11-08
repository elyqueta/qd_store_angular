import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { CompanyApiService } from '../data-access/company-api.service';
import { CompanyStatus, CompanyWithUsers } from '../models/company.model';

@Component({
  selector: 'qd-company-list-page',
  imports: [ModalComponent, ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './company-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyListPage {
  private readonly api = inject(CompanyApiService);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly companies = signal<CompanyWithUsers[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly associationCompanyId = signal<string | null>(null);
  readonly associationSaving = signal(false);
  readonly associationError = signal<string | null>(null);

  readonly associationForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    role: ['', Validators.maxLength(100)],
  });

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

  canManageCompany(company: CompanyWithUsers): boolean {
    const user = this.authStore.user();
    return user?.role === 'admin' || user?.id === company.ownerId;
  }

  associationCompany(): CompanyWithUsers | null {
    const companyId = this.associationCompanyId();
    return this.companies().find((company) => company.id === companyId) ?? null;
  }

  openAssociationForm(company: CompanyWithUsers): void {
    if (!this.canManageCompany(company) || this.associationSaving()) {
      return;
    }
    this.associationForm.reset({ email: '', role: '' });
    this.associationError.set(null);
    this.associationCompanyId.set(company.id);
  }

  closeAssociationForm(): void {
    if (this.associationSaving()) {
      return;
    }
    this.associationCompanyId.set(null);
    this.associationError.set(null);
    this.associationForm.reset({ email: '', role: '' });
  }

  submitAssociation(): void {
    if (this.associationForm.invalid || this.associationSaving()) {
      this.associationForm.markAllAsTouched();
      return;
    }

    const companyId = this.associationCompanyId();
    const company = this.companies().find((item) => item.id === companyId);
    if (!companyId || !company || !this.canManageCompany(company)) {
      this.associationError.set(this.transloco.translate('account.companies.errors.forbidden'));
      return;
    }

    const values = this.associationForm.getRawValue();
    const email = values.email.trim().toLowerCase();
    const role = values.role.trim();
    this.associationSaving.set(true);
    this.associationError.set(null);
    this.api
      .associateUser(companyId, {
        email,
        ...(role ? { role } : {}),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.associationSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.associationCompanyId.set(null);
          this.associationForm.reset({ email: '', role: '' });
          this.associationError.set(null);
          this.toastService.success(
            this.transloco.translate('account.companies.messages.memberAssociated'),
          );
          this.load();
        },
        error: (error: unknown) => this.associationError.set(this.getAssociationError(error)),
      });
  }

  private getAssociationError(error: unknown): string {
    if (!(error instanceof ApiError)) {
      return this.transloco.translate('common.error');
    }

    const statusKey: Record<number, string> = {
      403: 'account.companies.errors.forbidden',
      404: 'account.companies.errors.emailNotFound',
      409: 'account.companies.errors.alreadyAssociated',
      422: 'account.companies.errors.invalidRequest',
    };
    const message = error.message.trim();
    const key = statusKey[error.status];
    if (!key) {
      return message || this.transloco.translate('common.error');
    }
    return message || this.transloco.translate(key);
  }
}

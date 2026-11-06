import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { CompanyApiService } from '../data-access/company-api.service';
import { Company, CreateCompanyInput } from '../models/company.model';

@Component({
  selector: 'qd-company-create-page',
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './company-create.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyCreatePage {
  private readonly api = inject(CompanyApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly transloco = inject(TranslocoService);

  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly createdCompany = signal<Company | null>(null);

  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    nif: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(20)]],
    sector: ['', Validators.maxLength(100)],
  });

  submitForm(): void {
    if (this.form.invalid || this.saving() || this.createdCompany()) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const input: CreateCompanyInput = {
      name: values.name.trim(),
      nif: values.nif.trim(),
      ...(values.sector.trim() ? { sector: values.sector.trim() } : {}),
    };

    this.saving.set(true);
    this.formError.set(null);
    this.api
      .createCompany(input)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (company) => this.createdCompany.set(company),
        error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
      });
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : this.transloco.translate('common.error');
  }
}

import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { AdminDeliveryTypeApiService } from '../data-access/admin-delivery-type-api.service';
import { AdminDeliveryType } from '../models/admin-dashboard.model';
import {
  AdminDeliveryMode,
  CreateAdminDeliveryTypeInput,
  UpdateAdminDeliveryTypeInput,
} from '../models/admin-delivery-type.model';

@Component({
  selector: 'qd-admin-delivery-types-page',
  imports: [DecimalPipe, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './admin-delivery-types.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDeliveryTypesPage {
  private readonly api = inject(AdminDeliveryTypeApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly seo = inject(SeoService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly deliveryTypes = signal<AdminDeliveryType[]>([]);
  readonly isLoading = signal(true);
  readonly hasLoadError = signal(false);
  readonly isFormOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly confirmingDeactivationId = signal<string | null>(null);
  readonly pendingDeactivationId = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    description: ['', Validators.maxLength(200)],
    price: [0, [Validators.required, Validators.min(0)]],
    type: this.formBuilder.control<AdminDeliveryMode>('standard', Validators.required),
  });

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('admin.deliveryTypes.seoTitle'),
      description: this.transloco.translate('admin.deliveryTypes.seoDescription'),
      canonicalPath: null,
      robots: 'noindex, nofollow',
    });
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.api
      .listActive()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (deliveryTypes) => this.deliveryTypes.set(this.sort(deliveryTypes)),
        error: () => {
          this.deliveryTypes.set([]);
          this.hasLoadError.set(true);
        },
      });
  }

  openCreateForm(): void {
    this.resetForm();
    this.isFormOpen.set(true);
  }

  openEditForm(deliveryType: AdminDeliveryType): void {
    this.resetForm();
    this.form.setValue({
      name: deliveryType.name,
      description: deliveryType.description ?? '',
      price: deliveryType.price,
      type: deliveryType.type,
    });
    this.editingId.set(deliveryType.id);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingId.set(null);
    this.resetForm();
  }

  submitForm(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const editingId = this.editingId();
    this.saving.set(true);
    this.formError.set(null);

    if (editingId) {
      const current = this.deliveryTypes().find((item) => item.id === editingId);
      if (!current) {
        this.formError.set(this.transloco.translate('admin.deliveryTypes.errors.unavailable'));
        this.saving.set(false);
        return;
      }

      const input = this.createUpdateInput(values, current);
      if (!Object.keys(input).length) {
        this.saving.set(false);
        this.closeForm();
        this.toastService.success(
          this.transloco.translate('admin.deliveryTypes.messages.noChanges'),
        );
        return;
      }

      this.api
        .update(editingId, input)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.saving.set(false)),
        )
        .subscribe({
          next: (updated) => {
            this.deliveryTypes.update((items) =>
              this.sort(items.map((item) => (item.id === updated.id ? updated : item))),
            );
            this.closeForm();
            this.toastService.success(
              this.transloco.translate('admin.deliveryTypes.messages.updated'),
            );
          },
          error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
        });
      return;
    }

    const input: CreateAdminDeliveryTypeInput = {
      name: values.name.trim(),
      price: values.price,
      type: values.type,
      ...(values.description.trim() ? { description: values.description.trim() } : {}),
    };

    this.api
      .create(input)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (created) => {
          this.deliveryTypes.update((items) => this.sort([...items, created]));
          this.closeForm();
          this.toastService.success(
            this.transloco.translate('admin.deliveryTypes.messages.created'),
          );
        },
        error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
      });
  }

  requestDeactivation(deliveryType: AdminDeliveryType): void {
    this.confirmingDeactivationId.set(deliveryType.id);
  }

  cancelDeactivation(): void {
    this.confirmingDeactivationId.set(null);
  }

  confirmDeactivation(deliveryType: AdminDeliveryType): void {
    if (this.pendingDeactivationId()) {
      return;
    }

    this.pendingDeactivationId.set(deliveryType.id);
    this.api
      .deactivate(deliveryType.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingDeactivationId.set(null)),
      )
      .subscribe({
        next: () => {
          this.deliveryTypes.update((items) => items.filter((item) => item.id !== deliveryType.id));
          this.confirmingDeactivationId.set(null);
          this.toastService.success(
            this.transloco.translate('admin.deliveryTypes.messages.deactivated'),
          );
        },
        error: (error: unknown) => {
          this.confirmingDeactivationId.set(null);
          this.toastService.error(this.getErrorMessage(error));
        },
      });
  }

  typeLabel(type: AdminDeliveryMode): string {
    return this.transloco.translate(`admin.deliveryTypes.types.${type}`);
  }

  private createUpdateInput(
    values: ReturnType<typeof this.form.getRawValue>,
    current: AdminDeliveryType,
  ): UpdateAdminDeliveryTypeInput {
    const input: UpdateAdminDeliveryTypeInput = {};
    const name = values.name.trim();
    const description = values.description.trim();

    if (name !== current.name) {
      input.name = name;
    }
    if (description !== (current.description ?? '')) {
      input.description = description || null;
    }
    if (values.price !== current.price) {
      input.price = values.price;
    }
    if (values.type !== current.type) {
      input.type = values.type;
    }

    return input;
  }

  private resetForm(): void {
    this.form.reset({ name: '', description: '', price: 0, type: 'standard' });
    this.formError.set(null);
  }

  private sort(items: AdminDeliveryType[]): AdminDeliveryType[] {
    return [...items].sort((first, second) => first.name.localeCompare(second.name));
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : this.transloco.translate('common.error');
  }
}

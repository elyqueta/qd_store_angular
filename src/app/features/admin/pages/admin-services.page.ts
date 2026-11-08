import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { IconCatalogApiService } from '../../../shared/data-access/icon-catalog-api.service';
import { IconCatalogEntry } from '../../../shared/models/icon-catalog.model';
import { IconComponent } from '../../../shared/ui/icon.component';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { AdminServiceApiService } from '../data-access/admin-service-api.service';
import {
  AdminService,
  CreateAdminServiceInput,
  UpdateAdminServiceInput,
} from '../models/admin-service.model';

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

@Component({
  selector: 'qd-admin-services-page',
  imports: [DecimalPipe, IconComponent, ModalComponent, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './admin-services.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminServicesPage {
  private readonly api = inject(AdminServiceApiService);
  private readonly iconCatalogApi = inject(IconCatalogApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly seo = inject(SeoService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly services = signal<AdminService[]>([]);
  readonly icons = signal<IconCatalogEntry[]>([]);
  readonly isLoading = signal(true);
  readonly hasLoadError = signal(false);
  readonly isIconCatalogLoading = signal(true);
  readonly hasIconCatalogError = signal(false);
  readonly isFormOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly selectedImage = signal<File | null>(null);
  readonly confirmingDeactivationId = signal<string | null>(null);
  readonly pendingActionId = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    description: ['', Validators.maxLength(5000)],
    icon: ['', [Validators.required, Validators.maxLength(60)]],
    startsFromPrice: this.formBuilder.control<number | null>(null, Validators.min(0)),
  });

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('admin.services.seoTitle'),
      description: this.transloco.translate('admin.services.seoDescription'),
      canonicalPath: null,
      robots: 'noindex, nofollow',
    });
    this.loadServices();
    this.loadIcons();
  }

  loadServices(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.api
      .listAll()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (services) => this.services.set(this.sortServices(services)),
        error: () => {
          this.services.set([]);
          this.hasLoadError.set(true);
        },
      });
  }

  loadIcons(): void {
    this.isIconCatalogLoading.set(true);
    this.hasIconCatalogError.set(false);
    this.iconCatalogApi
      .listIcons()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isIconCatalogLoading.set(false)),
      )
      .subscribe({
        next: (icons) => this.icons.set(icons),
        error: () => {
          this.icons.set([]);
          this.hasIconCatalogError.set(true);
        },
      });
  }

  openCreateForm(): void {
    this.resetForm();
    this.isFormOpen.set(true);
  }

  openEditForm(service: AdminService): void {
    this.resetForm();
    this.form.setValue({
      name: service.name,
      description: service.description ?? '',
      icon: service.icon,
      startsFromPrice: service.startsFromPrice,
    });
    this.editingId.set(service.id);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingId.set(null);
    this.resetForm();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.formError.set(null);

    if (file && (!ACCEPTED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_SIZE_BYTES)) {
      this.selectedImage.set(null);
      this.formError.set(this.transloco.translate('admin.services.validation.image'));
      if (input) {
        input.value = '';
      }
      return;
    }

    this.selectedImage.set(file);
  }

  submitForm(): void {
    if (
      this.form.invalid ||
      this.saving() ||
      this.isIconCatalogLoading() ||
      this.hasIconCatalogError()
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const editingId = this.editingId();
    const image = this.selectedImage();
    this.saving.set(true);
    this.formError.set(null);

    if (editingId) {
      const current = this.services().find((service) => service.id === editingId);
      if (!current) {
        this.formError.set(this.transloco.translate('admin.services.errors.unavailable'));
        this.saving.set(false);
        return;
      }

      const input = this.createUpdateInput(values, current);
      if (!Object.keys(input).length) {
        this.saving.set(false);
        this.closeForm();
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
            this.services.update((items) =>
              this.sortServices(items.map((item) => (item.id === updated.id ? updated : item))),
            );
            this.closeForm();
            this.toastService.success(this.transloco.translate('admin.services.messages.updated'));
          },
          error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
        });
      return;
    }

    const input: CreateAdminServiceInput = {
      name: values.name.trim(),
      icon: values.icon,
      isActive: true,
      ...(values.description.trim() ? { description: values.description.trim() } : {}),
      ...(values.startsFromPrice !== null ? { startsFromPrice: values.startsFromPrice } : {}),
      ...(image ? { image } : {}),
    };

    this.api
      .create(input)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (created) => {
          this.services.update((items) => this.sortServices([...items, created]));
          this.closeForm();
          this.toastService.success(this.transloco.translate('admin.services.messages.created'));
        },
        error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
      });
  }

  requestDeactivation(service: AdminService): void {
    this.confirmingDeactivationId.set(service.id);
  }

  cancelDeactivation(): void {
    this.confirmingDeactivationId.set(null);
  }

  confirmDeactivation(service: AdminService): void {
    if (this.pendingActionId()) {
      return;
    }

    this.pendingActionId.set(service.id);
    this.api
      .deactivate(service.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingActionId.set(null)),
      )
      .subscribe({
        next: () => {
          this.services.update((items) =>
            items.map((item) => (item.id === service.id ? { ...item, isActive: false } : item)),
          );
          this.confirmingDeactivationId.set(null);
          this.toastService.success(
            this.transloco.translate('admin.services.messages.deactivated'),
          );
        },
        error: (error: unknown) => {
          this.confirmingDeactivationId.set(null);
          this.toastService.error(this.getErrorMessage(error));
        },
      });
  }

  activate(service: AdminService): void {
    if (this.pendingActionId()) {
      return;
    }

    this.pendingActionId.set(service.id);
    this.api
      .update(service.id, { isActive: true })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingActionId.set(null)),
      )
      .subscribe({
        next: (updated) => {
          this.services.update((items) =>
            this.sortServices(items.map((item) => (item.id === updated.id ? updated : item))),
          );
          this.toastService.success(this.transloco.translate('admin.services.messages.activated'));
        },
        error: (error: unknown) => this.toastService.error(this.getErrorMessage(error)),
      });
  }

  private createUpdateInput(
    values: ReturnType<typeof this.form.getRawValue>,
    current: AdminService,
  ): UpdateAdminServiceInput {
    const input: UpdateAdminServiceInput = {};
    const name = values.name.trim();
    const description = values.description.trim();
    const startsFromPrice = values.startsFromPrice;
    const image = this.selectedImage();

    if (name !== current.name) {
      input.name = name;
    }
    if (description !== (current.description ?? '')) {
      input.description = description;
    }
    if (values.icon !== current.icon) {
      input.icon = values.icon;
    }
    if (startsFromPrice !== null && startsFromPrice !== current.startsFromPrice) {
      input.startsFromPrice = startsFromPrice;
    }
    if (image) {
      input.image = image;
    }

    return input;
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      description: '',
      icon: '',
      startsFromPrice: null,
    });
    this.selectedImage.set(null);
    this.formError.set(null);
  }

  private sortServices(services: AdminService[]): AdminService[] {
    return [...services].sort((first, second) => first.name.localeCompare(second.name));
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : this.transloco.translate('common.error');
  }
}

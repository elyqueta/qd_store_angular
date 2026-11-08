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
import { AdminCategoryApiService } from '../data-access/admin-category-api.service';
import { ProductCategory } from '../../public/models/product.model';
import { CreateAdminCategoryInput, UpdateAdminCategoryInput } from '../models/admin-category.model';

@Component({
  selector: 'qd-admin-categories-page',
  imports: [IconComponent, ModalComponent, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './admin-categories.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoriesPage {
  private readonly api = inject(AdminCategoryApiService);
  private readonly iconCatalogApi = inject(IconCatalogApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly seo = inject(SeoService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly categories = signal<ProductCategory[]>([]);
  readonly icons = signal<IconCatalogEntry[]>([]);
  readonly isLoading = signal(true);
  readonly isIconCatalogLoading = signal(true);
  readonly hasIconCatalogError = signal(false);
  readonly hasLoadError = signal(false);
  readonly isFormOpen = signal(false);
  readonly editingCategoryId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly confirmingDeletionId = signal<string | null>(null);
  readonly pendingDeletionId = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    label: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    icon: ['', Validators.maxLength(60)],
  });

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('admin.categories.seoTitle'),
      description: this.transloco.translate('admin.categories.seoDescription'),
      canonicalPath: null,
      robots: 'noindex, nofollow',
    });
    this.loadCategories();
    this.loadIcons();
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

  loadCategories(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.api
      .listCategories()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (categories) => this.categories.set(this.sortCategories(categories)),
        error: () => {
          this.categories.set([]);
          this.hasLoadError.set(true);
        },
      });
  }

  openCreateForm(): void {
    this.resetForm();
    this.isFormOpen.set(true);
  }

  openEditForm(category: ProductCategory): void {
    this.resetForm();
    this.form.setValue({ label: category.label, icon: category.icon ?? '' });
    this.editingCategoryId.set(category.id);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingCategoryId.set(null);
    this.resetForm();
  }

  submitForm(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const editingId = this.editingCategoryId();
    this.saving.set(true);
    this.formError.set(null);

    if (editingId) {
      const currentCategory = this.categories().find((category) => category.id === editingId);
      if (!currentCategory) {
        this.formError.set(this.transloco.translate('admin.categories.errors.unavailable'));
        this.saving.set(false);
        return;
      }

      const input = this.createUpdateInput(values, currentCategory);
      if (!Object.keys(input).length) {
        this.saving.set(false);
        this.closeForm();
        return;
      }

      this.api
        .updateCategory(editingId, input)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.saving.set(false)),
        )
        .subscribe({
          next: (updatedCategory) => {
            this.categories.update((categories) =>
              this.sortCategories(
                categories.map((category) =>
                  category.id === updatedCategory.id ? updatedCategory : category,
                ),
              ),
            );
            this.closeForm();
            this.toastService.success(
              this.transloco.translate('admin.categories.messages.updated'),
            );
          },
          error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
        });
      return;
    }

    const input: CreateAdminCategoryInput = {
      label: values.label.trim(),
      ...(values.icon.trim() ? { icon: values.icon.trim() } : {}),
    };

    this.api
      .createCategory(input)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (createdCategory) => {
          this.categories.update((categories) =>
            this.sortCategories([...categories, createdCategory]),
          );
          this.closeForm();
          this.toastService.success(this.transloco.translate('admin.categories.messages.created'));
        },
        error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
      });
  }

  requestDelete(category: ProductCategory): void {
    this.confirmingDeletionId.set(category.id);
  }

  cancelDelete(): void {
    this.confirmingDeletionId.set(null);
  }

  confirmDelete(category: ProductCategory): void {
    if (this.pendingDeletionId()) {
      return;
    }

    this.pendingDeletionId.set(category.id);
    this.api
      .deleteCategory(category.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingDeletionId.set(null)),
      )
      .subscribe({
        next: () => {
          this.categories.update((categories) =>
            categories.filter((item) => item.id !== category.id),
          );
          this.confirmingDeletionId.set(null);
          this.toastService.success(this.transloco.translate('admin.categories.messages.deleted'));
        },
        error: (error: unknown) => {
          this.confirmingDeletionId.set(null);
          this.toastService.error(this.getErrorMessage(error));
        },
      });
  }

  private createUpdateInput(
    values: ReturnType<typeof this.form.getRawValue>,
    current: ProductCategory,
  ): UpdateAdminCategoryInput {
    const input: UpdateAdminCategoryInput = {};
    const label = values.label.trim();
    const icon = values.icon.trim();

    if (label !== current.label) {
      input.label = label;
    }
    if (icon !== (current.icon ?? '')) {
      input.icon = icon || null;
    }

    return input;
  }

  private resetForm(): void {
    this.form.reset({ label: '', icon: '' });
    this.formError.set(null);
  }

  private sortCategories(categories: ProductCategory[]): ProductCategory[] {
    return [...categories].sort((first, second) => first.label.localeCompare(second.label));
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : this.transloco.translate('common.error');
  }
}

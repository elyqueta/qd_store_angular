import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged, finalize, of, Subject, switchMap, catchError } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { AdminHighlightApiService } from '../data-access/admin-highlight-api.service';
import { AdminProductApiService } from '../data-access/admin-product-api.service';
import {
  AdminHighlightProduct,
  AdminHighlight,
  CreateAdminHighlightInput,
  HighlightPlacement,
  HighlightTheme,
  UpdateAdminHighlightInput,
} from '../models/admin-highlight.model';
import type { Product } from '../../public/models/product.model';

@Component({
  selector: 'qd-admin-highlights-page',
  imports: [ReactiveFormsModule, TranslocoPipe],
  templateUrl: './admin-highlights.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHighlightsPage {
  private readonly api = inject(AdminHighlightApiService);
  private readonly productApi = inject(AdminProductApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly seo = inject(SeoService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly highlights = signal<AdminHighlight[]>([]);
  readonly isLoading = signal(true);
  readonly hasLoadError = signal(false);
  readonly isFormOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly confirmingDeletionId = signal<string | null>(null);
  readonly pendingDeletionId = signal<string | null>(null);
  readonly productOptions = signal<AdminHighlightProduct[]>([]);
  readonly isLoadingProducts = signal(false);
  readonly productSearchTerm = signal('');
  private readonly productSearchInput = new Subject<string>();

  readonly form = this.formBuilder.group({
    title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    subtitle: ['', Validators.maxLength(250)],
    label: ['', Validators.maxLength(60)],
    ctaLabel: ['', Validators.maxLength(40)],
    ctaUrl: ['', Validators.maxLength(500)],
    productId: [''],
    placement: this.formBuilder.control<HighlightPlacement>('hero', Validators.required),
    theme: this.formBuilder.control<HighlightTheme>('dark', Validators.required),
    startsAt: [''],
    endsAt: [''],
    image: [null as File | null],
  });

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('admin.highlights.seoTitle'),
      description: this.transloco.translate('admin.highlights.seoDescription'),
      canonicalPath: null,
      robots: 'noindex, nofollow',
    });
    this.load();
    this.productSearchInput
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((search) => {
          this.isLoadingProducts.set(true);
          return this.productApi.listProducts({
            page: 1,
            limit: 100,
            status: 'active',
            ...(search.trim() ? { search: search.trim() } : {}),
          }).pipe(
            catchError(() => of({ items: [] as Product[], page: 1, limit: 100, total: 0, totalPages: 0 })),
            finalize(() => this.isLoadingProducts.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.setProductOptions(result.items));
    this.searchProducts('');
  }

  load(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);

    this.api
      .listHighlights()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (highlights) => this.highlights.set(this.sort(highlights)),
        error: () => {
          this.highlights.set([]);
          this.hasLoadError.set(true);
        },
      });
  }

  openCreateForm(): void {
    this.resetForm();
    this.isFormOpen.set(true);
  }

  openEditForm(highlight: AdminHighlight): void {
    this.resetForm();
    this.form.setValue({
      title: highlight.title,
      subtitle: highlight.subtitle ?? '',
      label: highlight.label ?? '',
      ctaLabel: highlight.ctaLabel ?? '',
      ctaUrl: highlight.ctaUrl ?? '',
      productId: highlight.product?.id ?? '',
      placement: highlight.placement,
      theme: highlight.theme,
      startsAt: highlight.startsAt ?? '',
      endsAt: highlight.endsAt ?? '',
      image: null,
    });
    if (highlight.product) {
      this.productOptions.update((items) => this.mergeProductOptions(items, [highlight.product!]));
    }
    this.editingId.set(highlight.id);
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
    this.form.patchValue({ image: file });
  }

  searchProducts(eventOrValue: Event | string): void {
    const value = typeof eventOrValue === 'string'
      ? eventOrValue
      : (eventOrValue.target as HTMLInputElement | null)?.value ?? '';
    this.productSearchTerm.set(value);
    this.productSearchInput.next(value);
  }

  onProductSelectionChanged(): void {
    if (this.form.controls.productId.value) {
      this.form.patchValue({ image: null, ctaUrl: '' });
    }
  }

  selectedProduct(): AdminHighlightProduct | null {
    const productId = this.form.controls.productId.value;
    return this.productOptions().find((product) => product.id === productId) ?? null;
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

    const input = this.buildInput(values);
    const request$ = editingId
      ? this.api.updateHighlight(editingId, input)
      : this.api.createHighlight(input);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (highlight) => {
          this.highlights.update((items) => {
            const next = editingId
              ? items.map((item) => (item.id === highlight.id ? highlight : item))
              : [...items, highlight];
            return this.sort(next);
          });
          this.closeForm();
          this.toastService.success(
            editingId
              ? this.transloco.translate('admin.highlights.messages.updated')
              : this.transloco.translate('admin.highlights.messages.created'),
          );
        },
        error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
      });
  }

  requestDelete(highlight: AdminHighlight): void {
    this.confirmingDeletionId.set(highlight.id);
  }

  cancelDelete(): void {
    this.confirmingDeletionId.set(null);
  }

  confirmDelete(highlight: AdminHighlight): void {
    if (this.pendingDeletionId()) {
      return;
    }

    this.pendingDeletionId.set(highlight.id);
    this.api
      .deleteHighlight(highlight.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingDeletionId.set(null)),
      )
      .subscribe({
        next: () => {
          this.highlights.update((items) =>
            this.sort(
              items.map((item) =>
                item.id === highlight.id ? { ...item, isActive: false } : item,
              ),
            ),
          );
          this.confirmingDeletionId.set(null);
          this.toastService.success(this.transloco.translate('admin.highlights.messages.deleted'));
        },
        error: (error: unknown) => {
          this.confirmingDeletionId.set(null);
          this.toastService.error(this.getErrorMessage(error));
        },
      });
  }

  activate(highlight: AdminHighlight): void {
    if (this.pendingDeletionId()) {
      return;
    }

    this.pendingDeletionId.set(highlight.id);
    this.api
      .updateHighlight(highlight.id, { isActive: true })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingDeletionId.set(null)),
      )
      .subscribe({
        next: (updated) => {
          this.highlights.update((items) =>
            this.sort(items.map((item) => (item.id === updated.id ? updated : item))),
          );
          this.toastService.success(
            this.transloco.translate('admin.highlights.messages.activated'),
          );
        },
        error: (error: unknown) => this.toastService.error(this.getErrorMessage(error)),
      });
  }

  moveHighlight(highlight: AdminHighlight, direction: -1 | 1): void {
    const items = [...this.highlights()];
    const currentIndex = items.findIndex((item) => item.id === highlight.id);
    const targetIndex = currentIndex + direction;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    [items[currentIndex], items[targetIndex]] = [items[targetIndex], items[currentIndex]];
    const reordered = items.map((item, index) => ({ ...item, displayOrder: index + 1 }));
    this.highlights.set(this.sort(reordered));

    this.api
      .reorder(
        reordered.map((item) => ({
          id: item.id,
          displayOrder: item.displayOrder,
        })),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => this.highlights.set(this.sort(updated)),
        error: (error: unknown) => this.toastService.error(this.getErrorMessage(error)),
      });
  }

  getPlacementLabel(placement: HighlightPlacement): string {
    return this.transloco.translate(`admin.highlights.placements.${placement}`);
  }

  getThemeLabel(theme: HighlightTheme): string {
    return this.transloco.translate(`admin.highlights.themes.${theme}`);
  }

  private buildInput(
    values: ReturnType<typeof this.form.getRawValue>,
  ): CreateAdminHighlightInput & UpdateAdminHighlightInput {
    const title = values.title.trim();
    const subtitle = values.subtitle.trim();
    const label = values.label.trim();
    const ctaLabel = values.ctaLabel.trim();
    const ctaUrl = values.ctaUrl.trim();

    return {
      title,
      placement: values.placement,
      theme: values.theme,
      subtitle: subtitle || null,
      label: label || null,
      ctaLabel: ctaLabel || null,
      ctaUrl: values.productId ? null : ctaUrl || null,
      productId: values.productId || null,
      startsAt: values.startsAt || null,
      endsAt: values.endsAt || null,
      image: values.productId ? null : values.image ?? null,
    };
  }

  private resetForm(): void {
    this.form.reset({
      title: '',
      subtitle: '',
      label: '',
      ctaLabel: '',
      ctaUrl: '',
      productId: '',
      placement: 'hero',
      theme: 'dark',
      startsAt: '',
      endsAt: '',
      image: null,
    });
    this.formError.set(null);
  }

  private setProductOptions(products: Product[]): void {
    const options = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      mainImageUrl: product.mainImage?.url ?? null,
    }));
    this.productOptions.set(
    this.mergeProductOptions(
      options.filter((product) => product.mainImageUrl !== null),
      this.productOptions(),
    ),
    );
  }

  private mergeProductOptions(
    primary: AdminHighlightProduct[],
    additional: AdminHighlightProduct[],
  ): AdminHighlightProduct[] {
    const byId = new Map(primary.map((product) => [product.id, product]));
    for (const product of additional) {
      if (!byId.has(product.id)) {
        byId.set(product.id, product);
      }
    }
    return [...byId.values()];
  }

  private sort(items: AdminHighlight[]): AdminHighlight[] {
    return [...items].sort((first, second) => first.displayOrder - second.displayOrder);
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : this.transloco.translate('common.error');
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, finalize, map, Observable } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { ProductApiService } from '../../public/data-access/product-api.service';
import {
  Product,
  ProductCategory,
  ProductDetail,
  ProductImage,
  ProductSpecification,
} from '../../public/models/product.model';
import { AdminProductApiService } from '../data-access/admin-product-api.service';
import {
  AdminCreateProductInput,
  AdminUpdateProductImageInput,
  AdminUpdateProductInput,
  AdminUpdateProductSpecificationInput,
} from '../models/admin-product.model';

const nonNegativeIntegerValidator: ValidatorFn = (control) =>
  Number.isInteger(control.value) && control.value >= 0 ? null : { nonNegativeInteger: true };

@Component({
  selector: 'qd-admin-product-form-page',
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './admin-product-form.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductFormPage {
  private readonly api = inject(AdminProductApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly productApi = inject(ProductApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly productId = this.route.snapshot.paramMap.get('id');
  readonly isCreating = this.productId === null;
  readonly product = signal<ProductDetail | null>(null);
  readonly categories = signal<ProductCategory[]>([]);
  readonly images = signal<ProductImage[]>([]);
  readonly specifications = signal<ProductSpecification[]>([]);
  readonly isLoading = signal(true);
  readonly hasLoadError = signal(false);
  readonly savingProduct = signal(false);
  readonly formError = signal<string | null>(null);
  readonly imageFormOpen = signal(false);
  readonly editingImageId = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);
  readonly savingImage = signal(false);
  readonly confirmingImageDeletionId = signal<string | null>(null);
  readonly pendingImageDeletionId = signal<string | null>(null);
  readonly specificationFormOpen = signal(false);
  readonly editingSpecificationId = signal<string | null>(null);
  readonly specificationError = signal<string | null>(null);
  readonly savingSpecification = signal(false);
  readonly confirmingSpecificationDeletionId = signal<string | null>(null);
  readonly pendingSpecificationDeletionId = signal<string | null>(null);
  readonly headingKey = computed(() =>
    this.isCreating ? 'admin.products.createTitle' : 'admin.products.editTitle',
  );

  readonly form = this.formBuilder.group({
    categoryId: ['', Validators.required],
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    description: ['', Validators.maxLength(5000)],
    price: [0, [Validators.required, Validators.min(0.01)]],
    originalPrice: [0, Validators.min(0)],
    badge: ['', Validators.maxLength(50)],
  });

  readonly imageForm = this.formBuilder.group({
    url: [
      '',
      [Validators.required, Validators.pattern(/^https?:\/\/\S+$/i), Validators.maxLength(2048)],
    ],
    displayOrder: [0, [Validators.required, nonNegativeIntegerValidator]],
  });

  readonly specificationForm = this.formBuilder.group({
    specKey: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    specValue: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    displayOrder: [0, [Validators.required, nonNegativeIntegerValidator]],
  });

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate(
        this.isCreating ? 'admin.products.createSeoTitle' : 'admin.products.editSeoTitle',
      ),
      description: this.transloco.translate('admin.products.seoDescription'),
      canonicalPath: null,
      robots: 'noindex, nofollow',
    });
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);

    const request: Observable<{ categories: ProductCategory[]; product: ProductDetail | null }> =
      this.productId
        ? forkJoin({
            categories: this.productApi.listCategories(),
            product: this.api.getProduct(this.productId),
          }).pipe(map(({ categories, product }) => ({ categories, product })))
        : this.productApi
            .listCategories()
            .pipe(map((categories) => ({ categories, product: null })));

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.categories.set(result.categories);
          if (result.product) {
            this.product.set(result.product);
            this.images.set(this.sortImages(result.product.images));
            this.specifications.set(this.sortSpecifications(result.product.specifications));
            this.form.setValue({
              categoryId: result.product.categoryId,
              name: result.product.name,
              description: result.product.description ?? '',
              price: result.product.price,
              originalPrice: result.product.originalPrice ?? 0,
              badge: result.product.badge ?? '',
            });
          }
        },
        error: () => {
          this.hasLoadError.set(true);
        },
      });
  }

  submitProduct(): void {
    if (this.form.invalid || this.savingProduct()) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    if (values.originalPrice > 0 && values.originalPrice <= values.price) {
      this.formError.set(this.transloco.translate('admin.products.validation.priceConsistency'));
      return;
    }

    this.savingProduct.set(true);
    this.formError.set(null);

    if (this.productId) {
      const current = this.product();
      if (!current) {
        this.formError.set(this.transloco.translate('admin.products.errors.unavailable'));
        this.savingProduct.set(false);
        return;
      }

      const input = this.createProductUpdateInput(values, current);
      if (!Object.keys(input).length) {
        this.savingProduct.set(false);
        this.toastService.success(this.transloco.translate('admin.products.messages.noChanges'));
        return;
      }

      this.api
        .updateProduct(this.productId, input)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.savingProduct.set(false)),
        )
        .subscribe({
          next: (updatedProduct) => {
            this.product.update((currentProduct) =>
              currentProduct ? { ...currentProduct, ...updatedProduct } : currentProduct,
            );
            this.toastService.success(this.transloco.translate('admin.products.messages.updated'));
          },
          error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
        });
      return;
    }

    const input: AdminCreateProductInput = {
      categoryId: values.categoryId,
      name: values.name.trim(),
      price: values.price,
      ...(values.description.trim() ? { description: values.description.trim() } : {}),
      ...(values.originalPrice > 0 ? { originalPrice: values.originalPrice } : {}),
      ...(values.badge.trim() ? { badge: values.badge.trim() } : {}),
    };

    this.api
      .createProduct(input)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.savingProduct.set(false)),
      )
      .subscribe({
        next: (createdProduct) => {
          this.toastService.success(this.transloco.translate('admin.products.messages.created'));
          void this.router.navigate(['/admin/produtos', createdProduct.id]);
        },
        error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
      });
  }

  openCreateImageForm(): void {
    this.resetImageForm();
    this.imageFormOpen.set(true);
  }

  openEditImageForm(image: ProductImage): void {
    this.resetImageForm();
    this.imageForm.setValue({ url: image.url, displayOrder: image.displayOrder });
    this.editingImageId.set(image.id);
    this.imageFormOpen.set(true);
  }

  closeImageForm(): void {
    this.imageFormOpen.set(false);
    this.editingImageId.set(null);
    this.resetImageForm();
  }

  submitImage(): void {
    if (this.imageForm.invalid || this.savingImage() || !this.productId) {
      this.imageForm.markAllAsTouched();
      return;
    }

    const values = this.imageForm.getRawValue();
    const imageId = this.editingImageId();
    const current = imageId ? this.images().find((image) => image.id === imageId) : undefined;
    if (imageId && !current) {
      this.imageError.set(this.transloco.translate('admin.products.errors.imageUnavailable'));
      return;
    }

    this.savingImage.set(true);
    this.imageError.set(null);
    const input = current ? this.createImageUpdateInput(values, current) : null;
    if (input && !Object.keys(input).length) {
      this.savingImage.set(false);
      this.closeImageForm();
      this.toastService.success(this.transloco.translate('admin.products.messages.noChanges'));
      return;
    }

    const request =
      current && imageId && input
        ? this.api.updateImage(this.productId, imageId, input)
        : this.api.createImage(this.productId, {
            url: values.url.trim(),
            displayOrder: values.displayOrder,
          });

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.savingImage.set(false)),
      )
      .subscribe({
        next: (image) => {
          this.images.update((images) =>
            this.sortImages(
              current
                ? images.map((item) => (item.id === image.id ? image : item))
                : [...images, image],
            ),
          );
          this.closeImageForm();
          this.toastService.success(
            this.transloco.translate(
              current
                ? 'admin.products.messages.imageUpdated'
                : 'admin.products.messages.imageCreated',
            ),
          );
        },
        error: (error: unknown) => this.imageError.set(this.getErrorMessage(error)),
      });
  }

  requestDeleteImage(image: ProductImage): void {
    this.confirmingImageDeletionId.set(image.id);
  }

  cancelDeleteImage(): void {
    this.confirmingImageDeletionId.set(null);
  }

  confirmDeleteImage(image: ProductImage): void {
    if (!this.productId || this.pendingImageDeletionId()) {
      return;
    }
    this.pendingImageDeletionId.set(image.id);
    this.api
      .deleteImage(this.productId, image.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingImageDeletionId.set(null)),
      )
      .subscribe({
        next: () => {
          this.images.update((images) => images.filter((item) => item.id !== image.id));
          this.confirmingImageDeletionId.set(null);
          this.toastService.success(
            this.transloco.translate('admin.products.messages.imageDeleted'),
          );
        },
        error: (error: unknown) => {
          this.confirmingImageDeletionId.set(null);
          this.toastService.error(this.getErrorMessage(error));
        },
      });
  }

  openCreateSpecificationForm(): void {
    this.resetSpecificationForm();
    this.specificationFormOpen.set(true);
  }

  openEditSpecificationForm(specification: ProductSpecification): void {
    this.resetSpecificationForm();
    this.specificationForm.setValue({
      specKey: specification.specKey,
      specValue: specification.specValue,
      displayOrder: specification.displayOrder,
    });
    this.editingSpecificationId.set(specification.id);
    this.specificationFormOpen.set(true);
  }

  closeSpecificationForm(): void {
    this.specificationFormOpen.set(false);
    this.editingSpecificationId.set(null);
    this.resetSpecificationForm();
  }

  submitSpecification(): void {
    if (this.specificationForm.invalid || this.savingSpecification() || !this.productId) {
      this.specificationForm.markAllAsTouched();
      return;
    }

    const values = this.specificationForm.getRawValue();
    const specificationId = this.editingSpecificationId();
    const current = specificationId
      ? this.specifications().find((specification) => specification.id === specificationId)
      : undefined;
    if (specificationId && !current) {
      this.specificationError.set(
        this.transloco.translate('admin.products.errors.specificationUnavailable'),
      );
      return;
    }

    this.savingSpecification.set(true);
    this.specificationError.set(null);
    const input = current ? this.createSpecificationUpdateInput(values, current) : null;
    if (input && !Object.keys(input).length) {
      this.savingSpecification.set(false);
      this.closeSpecificationForm();
      this.toastService.success(this.transloco.translate('admin.products.messages.noChanges'));
      return;
    }

    const request =
      current && specificationId && input
        ? this.api.updateSpecification(this.productId, specificationId, input)
        : this.api.createSpecification(this.productId, {
            specKey: values.specKey.trim(),
            specValue: values.specValue.trim(),
            displayOrder: values.displayOrder,
          });

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.savingSpecification.set(false)),
      )
      .subscribe({
        next: (specification) => {
          this.specifications.update((specifications) =>
            this.sortSpecifications(
              current
                ? specifications.map((item) =>
                    item.id === specification.id ? specification : item,
                  )
                : [...specifications, specification],
            ),
          );
          this.closeSpecificationForm();
          this.toastService.success(
            this.transloco.translate(
              current
                ? 'admin.products.messages.specificationUpdated'
                : 'admin.products.messages.specificationCreated',
            ),
          );
        },
        error: (error: unknown) => this.specificationError.set(this.getErrorMessage(error)),
      });
  }

  requestDeleteSpecification(specification: ProductSpecification): void {
    this.confirmingSpecificationDeletionId.set(specification.id);
  }

  cancelDeleteSpecification(): void {
    this.confirmingSpecificationDeletionId.set(null);
  }

  confirmDeleteSpecification(specification: ProductSpecification): void {
    if (!this.productId || this.pendingSpecificationDeletionId()) {
      return;
    }
    this.pendingSpecificationDeletionId.set(specification.id);
    this.api
      .deleteSpecification(this.productId, specification.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingSpecificationDeletionId.set(null)),
      )
      .subscribe({
        next: () => {
          this.specifications.update((items) =>
            items.filter((item) => item.id !== specification.id),
          );
          this.confirmingSpecificationDeletionId.set(null);
          this.toastService.success(
            this.transloco.translate('admin.products.messages.specificationDeleted'),
          );
        },
        error: (error: unknown) => {
          this.confirmingSpecificationDeletionId.set(null);
          this.toastService.error(this.getErrorMessage(error));
        },
      });
  }

  private createProductUpdateInput(
    values: ReturnType<typeof this.form.getRawValue>,
    current: Product,
  ): AdminUpdateProductInput {
    const input: AdminUpdateProductInput = {};
    const name = values.name.trim();
    const description = values.description.trim();
    const badge = values.badge.trim();

    if (values.categoryId !== current.categoryId) {
      input.categoryId = values.categoryId;
    }
    if (name !== current.name) {
      input.name = name;
    }
    if (description !== (current.description ?? '')) {
      input.description = description || null;
    }
    if (values.price !== current.price) {
      input.price = values.price;
    }
    if (values.originalPrice !== (current.originalPrice ?? 0)) {
      input.originalPrice = values.originalPrice > 0 ? values.originalPrice : null;
    }
    if (badge !== (current.badge ?? '')) {
      input.badge = badge || null;
    }

    return input;
  }

  private createImageUpdateInput(
    values: ReturnType<typeof this.imageForm.getRawValue>,
    current: ProductImage,
  ): AdminUpdateProductImageInput {
    const input: AdminUpdateProductImageInput = {};
    const url = values.url.trim();
    if (url !== current.url) {
      input.url = url;
    }
    if (values.displayOrder !== current.displayOrder) {
      input.displayOrder = values.displayOrder;
    }
    return input;
  }

  private createSpecificationUpdateInput(
    values: ReturnType<typeof this.specificationForm.getRawValue>,
    current: ProductSpecification,
  ): AdminUpdateProductSpecificationInput {
    const input: AdminUpdateProductSpecificationInput = {};
    const specKey = values.specKey.trim();
    const specValue = values.specValue.trim();
    if (specKey !== current.specKey) {
      input.specKey = specKey;
    }
    if (specValue !== current.specValue) {
      input.specValue = specValue;
    }
    if (values.displayOrder !== current.displayOrder) {
      input.displayOrder = values.displayOrder;
    }
    return input;
  }

  private resetImageForm(): void {
    const nextDisplayOrder =
      this.images().reduce((highest, image) => Math.max(highest, image.displayOrder), -1) + 1;
    this.imageForm.reset({ url: '', displayOrder: nextDisplayOrder });
    this.imageError.set(null);
  }

  private resetSpecificationForm(): void {
    const nextDisplayOrder =
      this.specifications().reduce(
        (highest, specification) => Math.max(highest, specification.displayOrder),
        -1,
      ) + 1;
    this.specificationForm.reset({
      specKey: '',
      specValue: '',
      displayOrder: nextDisplayOrder,
    });
    this.specificationError.set(null);
  }

  private sortImages(images: ProductImage[]): ProductImage[] {
    return [...images].sort((first, second) => first.displayOrder - second.displayOrder);
  }

  private sortSpecifications(specifications: ProductSpecification[]): ProductSpecification[] {
    return [...specifications].sort((first, second) => first.displayOrder - second.displayOrder);
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : this.transloco.translate('common.error');
  }
}

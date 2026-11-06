import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { EMPTY, catchError, map, switchMap } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { CommerceApiService } from '../../commerce/data-access/commerce-api.service';
import { ProductApiService } from '../data-access/product-api.service';
import { Product, ProductDetail } from '../models/product.model';
import { ProductCardComponent } from '../../../shared/ui/product-card.component';
import { IconComponent } from '../../../shared/ui/icon.component';

@Component({
  selector: 'qd-product-page',
  imports: [CurrencyPipe, RouterLink, ProductCardComponent, TranslocoPipe, IconComponent],
  templateUrl: './product.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authStore = inject(AuthStore);
  private readonly commerceApi = inject(CommerceApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly product = signal<ProductDetail | null>(null);
  readonly galleryImages = computed(() => {
    const product = this.product();
    if (!product) {
      return [];
    }

    const images = [...product.images].sort(
      (first, second) => first.displayOrder - second.displayOrder,
    );
    if (!product.mainImage || images.some((image) => image.id === product.mainImage?.id)) {
      return images;
    }

    return [product.mainImage, ...images];
  });
  readonly activeImageId = signal<string | null>(null);
  readonly activeImage = computed(
    () =>
      this.galleryImages().find((image) => image.id === this.activeImageId()) ??
      this.product()?.mainImage ??
      this.galleryImages()[0] ??
      null,
  );
  readonly relatedProducts = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly relatedError = signal<string | null>(null);
  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly cartBusy = signal(false);
  readonly wishlistBusy = signal(false);
  readonly isWishlisted = signal(false);
  readonly shareCompleted = signal(false);
  readonly discountPercent = computed(() => {
    const product = this.product();
    if (!product?.originalPrice || product.originalPrice <= product.price) {
      return null;
    }

    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const productId = params.get('id');
          if (!productId) {
            this.error.set('public.errors.product');
            this.loading.set(false);
            return EMPTY;
          }

          this.loading.set(true);
          this.error.set(null);
          this.product.set(null);
          this.activeImageId.set(null);
          this.isWishlisted.set(false);
          this.relatedError.set(null);
          this.relatedProducts.set([]);
          this.seo.setPage({
            title: this.transloco.translate('seo.product.loadingTitle'),
            description: this.transloco.translate('seo.product.loadingDescription'),
            canonicalPath: `/produtos/${encodeURIComponent(productId)}`,
            robots: 'noindex, follow',
          });
          return this.productApi.getProductById(productId).pipe(
            catchError(() => {
              this.error.set('public.errors.product');
              this.loading.set(false);
              this.seo.setPage({
                title: this.transloco.translate('seo.product.notFoundTitle'),
                description: this.transloco.translate('seo.product.notFoundDescription'),
                canonicalPath: null,
                robots: 'noindex, nofollow',
              });
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (product) => {
          this.product.set(product);
          this.activeImageId.set(product.mainImage?.id ?? product.images[0]?.id ?? null);
          this.seo.setPage(
            {
              title: this.transloco.translate('seo.product.title', { name: product.name }),
              description:
                product.description ??
                this.transloco.translate('seo.product.description', { name: product.name }),
              canonicalPath: `/produtos/${encodeURIComponent(product.id)}`,
              imageUrl: product.mainImage?.url,
            },
            product,
          );
          this.loadWishlistState(product.id);
          this.loadRelatedProducts(product);
          this.loading.set(false);
        },
      });
  }

  private loadRelatedProducts(product: ProductDetail): void {
    this.productApi
      .listProducts({ categoryId: product.categoryId, limit: 4, status: 'active' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          if (this.product()?.id === product.id) {
            this.relatedProducts.set(
              page.items.filter((item) => item.id !== product.id).slice(0, 4),
            );
          }
        },
        error: () => this.relatedError.set('public.errors.relatedProducts'),
      });
  }

  selectImage(imageId: string): void {
    if (this.galleryImages().some((image) => image.id === imageId)) {
      this.activeImageId.set(imageId);
    }
  }

  addToCart(): void {
    const productId = this.product()?.id;
    if (!productId || !this.isAuthenticated() || this.cartBusy()) {
      return;
    }

    this.cartBusy.set(true);
    this.commerceApi
      .addCartItem(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cartBusy.set(false);
          this.toast.success(this.transloco.translate('commerce.cart.added'));
        },
        error: (error: unknown) => {
          this.cartBusy.set(false);
          this.showError(error);
        },
      });
  }

  toggleWishlist(): void {
    const productId = this.product()?.id;
    if (!productId || !this.isAuthenticated() || this.wishlistBusy()) {
      return;
    }

    this.wishlistBusy.set(true);
    const request = this.isWishlisted()
      ? this.commerceApi.removeWishlistItem(productId)
      : this.commerceApi.addWishlistItem(productId).pipe(map(() => undefined));
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.wishlistBusy.set(false);
        this.isWishlisted.update((isWishlisted) => !isWishlisted);
        this.toast.success(
          this.transloco.translate(
            this.isWishlisted()
              ? 'public.product.addedToFavorites'
              : 'public.product.removedFromFavorites',
          ),
        );
      },
      error: (error: unknown) => {
        this.wishlistBusy.set(false);
        this.showError(error);
      },
    });
  }

  async shareProduct(): Promise<void> {
    const product = this.product();
    if (!product) {
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: window.location.href });
        return;
      }

      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is unavailable.');
      }

      await navigator.clipboard.writeText(window.location.href);
      this.shareCompleted.set(true);
      this.toast.success(this.transloco.translate('public.product.linkCopied'));
      window.setTimeout(() => this.shareCompleted.set(false), 2000);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      this.toast.error(this.transloco.translate('public.product.shareError'));
    }
  }

  private loadWishlistState(productId: string): void {
    if (!this.isAuthenticated()) {
      return;
    }

    this.commerceApi
      .getWishlist()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          if (this.product()?.id === productId) {
            this.isWishlisted.set(items.some((item) => item.productId === productId));
          }
        },
        error: (error: unknown) => this.showError(error),
      });
  }

  private showError(error: unknown): void {
    this.toast.error(
      error instanceof ApiError ? error.message : this.transloco.translate('common.error'),
    );
  }
}

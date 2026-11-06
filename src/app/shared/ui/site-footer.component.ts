import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ProductApiService } from '../../features/public/data-access/product-api.service';
import { ProductCategory } from '../../features/public/models/product.model';

@Component({
  selector: 'qd-site-footer',
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './site-footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productApi = inject(ProductApiService);

  readonly currentYear = new Date().getFullYear();
  readonly categories = signal<ProductCategory[]>([]);
  readonly categoriesError = signal(false);

  constructor() {
    this.productApi
      .listCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => this.categoriesError.set(true),
      });
  }
}

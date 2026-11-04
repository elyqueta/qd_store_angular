import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Product } from '../../features/public/models/product.model';

@Component({
  selector: 'qd-product-card',
  imports: [RouterLink, CurrencyPipe, TranslocoPipe],
  templateUrl: './product-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly mainImageUrl = computed(() => this.product().mainImage?.url ?? null);

  readonly discountPercent = computed<number | null>(() => {
    const product = this.product();
    if (!product.originalPrice || product.originalPrice <= product.price) {
      return null;
    }

    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  });
}

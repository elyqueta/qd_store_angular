import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { DeliveryTypeApiService } from '../data-access/delivery-type-api.service';
import { DeliveryMode, DeliveryType } from '../models/delivery-type.model';
import { SeoService } from '../../../core/seo/seo.service';

@Component({
  selector: 'qd-delivery-types-page',
  imports: [DecimalPipe, TranslocoPipe],
  templateUrl: './delivery-types.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryTypesPage {
  private readonly api = inject(DeliveryTypeApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);

  readonly deliveryTypes = signal<DeliveryType[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal(false);

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('seo.deliveryTypes.title'),
      description: this.transloco.translate('seo.deliveryTypes.description'),
      canonicalPath: '/tipos-entrega',
    });
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(false);
    this.api
      .listActive()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (deliveryTypes) => {
          this.deliveryTypes.set(
            [...deliveryTypes].sort((first, second) => first.name.localeCompare(second.name)),
          );
        },
        error: () => {
          this.deliveryTypes.set([]);
          this.loadError.set(true);
        },
      });
  }

  typeLabel(type: DeliveryMode): string {
    return this.transloco.translate(`public.deliveryTypes.types.${type}`);
  }
}

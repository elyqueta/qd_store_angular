import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent, IconName } from '../../../shared/ui/icon.component';

interface BusinessBenefit {
  icon: IconName;
  titleKey: string;
  descriptionKey: string;
}

@Component({
  selector: 'qd-business-page',
  imports: [IconComponent, TranslocoPipe],
  templateUrl: './business.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessPage {
  readonly whatsappUrl =
    'https://wa.me/244923000000?text=Ol%C3%A1%2C%20quero%20informa%C3%A7%C3%B5es%20para%20empresas';
  readonly benefits: readonly BusinessBenefit[] = [
    {
      icon: 'credit-card',
      titleKey: 'public.business.benefits.invoice.title',
      descriptionKey: 'public.business.benefits.invoice.description',
    },
    {
      icon: 'user',
      titleKey: 'public.business.benefits.manager.title',
      descriptionKey: 'public.business.benefits.manager.description',
    },
    {
      icon: 'circle-check',
      titleKey: 'public.business.benefits.pricing.title',
      descriptionKey: 'public.business.benefits.pricing.description',
    },
    {
      icon: 'shield',
      titleKey: 'public.business.benefits.support.title',
      descriptionKey: 'public.business.benefits.support.description',
    },
    {
      icon: 'whatsapp',
      titleKey: 'public.business.benefits.whatsapp.title',
      descriptionKey: 'public.business.benefits.whatsapp.description',
    },
    {
      icon: 'box',
      titleKey: 'public.business.benefits.delivery.title',
      descriptionKey: 'public.business.benefits.delivery.description',
    },
  ];
}

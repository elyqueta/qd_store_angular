import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { SeoService } from '../../../core/seo/seo.service';

@Component({
  selector: 'qd-contact-page',
  imports: [TranslocoPipe],
  templateUrl: './contact.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('seo.contact.title'),
      description: this.transloco.translate('seo.contact.description'),
      canonicalPath: '/contactos',
    });
  }
}

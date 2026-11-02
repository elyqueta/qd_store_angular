import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { SeoService } from '../../../core/seo/seo.service';

@Component({
  selector: 'qd-about-page',
  imports: [TranslocoPipe],
  templateUrl: './about.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('seo.about.title'),
      description: this.transloco.translate('seo.about.description'),
      canonicalPath: '/sobre',
    });
  }
}

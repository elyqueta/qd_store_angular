import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { SeoService } from '../../../core/seo/seo.service';

@Component({
  selector: 'qd-not-found-page',
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './not-found.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('seo.notFound.title'),
      description: this.transloco.translate('seo.notFound.description'),
      canonicalPath: null,
      robots: 'noindex, nofollow',
    });
  }
}

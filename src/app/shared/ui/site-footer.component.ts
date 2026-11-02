import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'qd-site-footer',
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './site-footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  readonly currentYear = new Date().getFullYear();
}

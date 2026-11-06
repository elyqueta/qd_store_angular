import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { SiteFooterComponent } from '../../shared/ui/site-footer.component';
import { SiteNavbarComponent } from '../../shared/ui/site-navbar.component';

@Component({
  selector: 'qd-public-layout',
  imports: [RouterOutlet, SiteNavbarComponent, SiteFooterComponent, TranslocoPipe],
  templateUrl: './public-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent {}

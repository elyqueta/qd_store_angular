import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooterComponent } from '../../shared/ui/site-footer.component';
import { SiteNavbarComponent } from '../../shared/ui/site-navbar.component';

@Component({
  selector: 'qd-account-layout',
  imports: [RouterOutlet, SiteFooterComponent, SiteNavbarComponent],
  templateUrl: './account-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountLayoutComponent {}

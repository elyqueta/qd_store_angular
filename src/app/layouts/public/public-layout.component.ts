import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { SiteFooterComponent } from '../../shared/ui/site-footer.component';
import { SiteNavbarComponent } from '../../shared/ui/site-navbar.component';
import { WhatsappButtonComponent } from '../../shared/ui/whatsapp-button.component';

@Component({
  selector: 'qd-public-layout',
  imports: [
    RouterOutlet,
    SiteNavbarComponent,
    SiteFooterComponent,
    WhatsappButtonComponent,
    TranslocoPipe,
  ],
  templateUrl: './public-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly isHome = signal(this.router.url === '/');

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.isHome.set(event.urlAfterRedirects === '/'));
  }
}

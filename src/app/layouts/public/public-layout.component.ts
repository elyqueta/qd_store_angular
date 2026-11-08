import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
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
  private readonly platformId = inject(PLATFORM_ID);

  readonly isHome = signal(this.router.url === '/');
  readonly showPreloader = signal(false);
  readonly progress = signal(8);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.isHome.set(event.urlAfterRedirects === '/'));

    if (isPlatformBrowser(this.platformId)) {
      const hasSeenHomeLoader = sessionStorage.getItem('qd-home-loader-seen');
      if (hasSeenHomeLoader === 'true') {
        this.showPreloader.set(false);
        return;
      }

      this.showPreloader.set(true);
      const progressId = window.setInterval(() => {
        this.progress.update((value) => Math.min(value + 6, 100));
      }, 180);

      const timeoutId = window.setTimeout(() => {
        this.progress.set(100);
        window.clearInterval(progressId);
        this.showPreloader.set(false);
        sessionStorage.setItem('qd-home-loader-seen', 'true');
      }, 3200);

      this.destroyRef.onDestroy(() => {
        window.clearInterval(progressId);
        window.clearTimeout(timeoutId);
      });
    }
  }
}

import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { SiteFooterComponent } from '../../shared/ui/site-footer.component';
import { SiteNavbarComponent } from '../../shared/ui/site-navbar.component';
import { IconComponent, IconName } from '../../shared/ui/icon.component';
import { AuthStore } from '../../core/auth/auth.store';

interface AccountNavigationItem {
  route: string;
  labelKey: string;
  icon: IconName;
  exact: boolean;
}

@Component({
  selector: 'qd-account-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SiteFooterComponent,
    SiteNavbarComponent,
    TranslocoPipe,
    IconComponent,
  ],
  templateUrl: './account-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountLayoutComponent {
  private readonly authStore = inject(AuthStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private hasActivatedRoute = false;

  @ViewChild('routeContent') private routeContent?: ElementRef<HTMLElement>;

  readonly isProfileRoute = signal(false);
  readonly isCheckoutRoute = signal(false);
  readonly user = this.authStore.user;
  readonly initials = computed(() =>
    this.user()
      ?.fullName.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase(),
  );
  readonly navigationItems: AccountNavigationItem[] = [
    {
      route: '/conta/perfil',
      labelKey: 'account.profile.personalData',
      icon: 'user',
      exact: true,
    },
    {
      route: '/conta/encomendas',
      labelKey: 'nav.orders',
      icon: 'box',
      exact: false,
    },
    {
      route: '/conta/favoritos',
      labelKey: 'nav.wishlist',
      icon: 'heart',
      exact: true,
    },
    {
      route: '/conta/notificacoes',
      labelKey: 'nav.notifications',
      icon: 'bell',
      exact: true,
    },
    {
      route: '/conta/moradas',
      labelKey: 'nav.addresses',
      icon: 'location-dot',
      exact: true,
    },
    {
      route: '/conta/empresas',
      labelKey: 'nav.companies',
      icon: 'building',
      exact: false,
    },
    {
      route: '/conta/carrinho',
      labelKey: 'nav.cart',
      icon: 'cart-shopping',
      exact: true,
    },
  ];

  onRouteActivate(): void {
    const path = this.router.url.split(/[?#]/, 1)[0];
    this.isProfileRoute.set(path === '/conta/perfil');
    this.isCheckoutRoute.set(path === '/conta/checkout');
    this.animateRoute();
  }

  animateRoute(): void {
    if (!this.hasActivatedRoute) {
      this.hasActivatedRoute = true;
      return;
    }

    if (
      !isPlatformBrowser(this.platformId) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const element = this.routeContent?.nativeElement;
    if (!element || typeof element.animate !== 'function') {
      return;
    }

    element.animate(
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 180, easing: 'ease-out' },
    );
  }
}

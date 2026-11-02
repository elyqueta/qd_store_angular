import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ApiError } from '../../core/http/api-error.model';
import { ToastService } from '../../core/notifications/toast.service';
import { ThemeService } from '../../core/theme/theme.service';
import { ProductApiService } from '../../features/public/data-access/product-api.service';
import { Product, ProductCategory } from '../../features/public/models/product.model';
import { NAV_ITEMS, USER_MENU_ITEMS, UserMenuAction } from './navigation.config';
import { finalize, Subscription } from 'rxjs';

@Component({
  selector: 'qd-site-navbar',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './site-navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteNavbarComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly productApi = inject(ProductApiService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  readonly themeService = inject(ThemeService);

  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly user = this.authStore.user;
  readonly mobileOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly categories = signal<ProductCategory[]>([]);
  readonly categoriesError = signal(false);
  readonly activeCategory = signal<ProductCategory | null>(null);
  readonly menuProducts = signal<Product[]>([]);
  readonly menuLoading = signal(false);
  readonly menuError = signal(false);
  private menuSubscription: Subscription | null = null;
  readonly userInitials = computed(() => {
    const name = this.user()?.fullName;
    return (
      name
        ?.split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'QD'
    );
  });

  readonly navItems = NAV_ITEMS;
  readonly userMenuItems = USER_MENU_ITEMS;

  constructor() {
    this.productApi
      .listCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories.slice(0, 6)),
        error: () => this.categoriesError.set(true),
      });
  }

  toggleTheme(): void {
    const nextTheme = this.themeService.effective() === 'dark' ? 'light' : 'dark';
    this.themeService.setPreference(nextTheme);
  }

  handleUserMenuAction(action: UserMenuAction): void {
    if (action === 'theme') {
      this.toggleTheme();
    } else {
      this.logout();
    }

    this.userMenuOpen.set(false);
  }

  toggleCategoryMenu(category: ProductCategory): void {
    if (this.activeCategory()?.id === category.id) {
      this.closeCategoryMenu();
      return;
    }

    this.menuSubscription?.unsubscribe();
    this.userMenuOpen.set(false);
    this.activeCategory.set(category);
    this.menuProducts.set([]);
    this.menuError.set(false);
    this.menuLoading.set(true);

    this.menuSubscription = this.productApi
      .listProducts({ categoryId: category.id, limit: 3, status: 'active' })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.menuLoading.set(false)),
      )
      .subscribe({
        next: (page) => {
          if (this.activeCategory()?.id === category.id) {
            this.menuProducts.set(page.items);
          }
        },
        error: () => this.menuError.set(true),
      });
  }

  focusMenuItem(event: Event, menuId: string, direction: -1 | 1): void {
    event.preventDefault();
    const menu = this.document.getElementById(menuId);
    const items = menu?.querySelectorAll<HTMLElement>('[role="menuitem"]');

    if (!items?.length) {
      return;
    }

    const currentIndex = Array.from(items).findIndex(
      (item) => item === this.document.activeElement,
    );
    const nextIndex =
      currentIndex < 0 ? 0 : (currentIndex + direction + items.length) % items.length;
    items.item(nextIndex)?.focus();
  }

  closeCategoryMenu(): void {
    this.menuSubscription?.unsubscribe();
    this.menuSubscription = null;
    this.activeCategory.set(null);
    this.menuLoading.set(false);
  }

  toggleUserMenu(): void {
    this.closeCategoryMenu();
    this.userMenuOpen.update((isOpen) => !isOpen);
  }

  @HostListener('document:click', ['$event'])
  closeMenuOnOutsideClick(event: Event): void {
    const nodeConstructor = this.document.defaultView?.Node;
    if (
      !nodeConstructor ||
      !(event.target instanceof nodeConstructor) ||
      !this.element.nativeElement.contains(event.target)
    ) {
      this.closeCategoryMenu();
      this.userMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  closeMenuOnEscape(): void {
    const category = this.activeCategory();
    const userMenuWasOpen = this.userMenuOpen();
    this.closeCategoryMenu();
    this.userMenuOpen.set(false);
    this.mobileOpen.set(false);

    if (category) {
      this.document.getElementById(`qd-category-trigger-${category.id}`)?.focus();
    } else if (userMenuWasOpen) {
      this.document.getElementById('qd-user-menu-trigger')?.focus();
    }
  }

  logout(): void {
    this.authService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.toastService.error(
            error instanceof ApiError ? error.message : this.transloco.translate('common.error'),
          );
        },
      });
  }
}

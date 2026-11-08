import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error.model';
import { ToastService } from '../../core/notifications/toast.service';
import { ThemeService } from '../../core/theme/theme.service';
import { IconComponent } from '../../shared/ui/icon.component';

@Component({
  selector: 'qd-admin-layout',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslocoPipe,
    IconComponent,
  ],
  templateUrl: './admin-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  readonly themeService = inject(ThemeService);
  readonly sidebarOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.closeSidebar());
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleTheme(): void {
    const nextTheme = this.themeService.effective() === 'dark' ? 'light' : 'dark';
    this.themeService.setPreference(nextTheme);
    this.closeSidebar();
  }

  logout(): void {
    this.closeSidebar();
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

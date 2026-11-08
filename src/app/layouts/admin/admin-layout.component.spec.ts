import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { provideAppI18n } from '../../core/i18n/i18n.providers';
import { ToastService } from '../../core/notifications/toast.service';
import { ThemeService } from '../../core/theme/theme.service';
import { AdminLayoutComponent } from './admin-layout.component';

describe('AdminLayoutComponent', () => {
  it('opens and closes the mobile navigation from the hamburger menu', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: AuthService, useValue: { logout: () => EMPTY } },
        { provide: ToastService, useValue: { error: () => undefined } },
        {
          provide: ThemeService,
          useValue: { effective: () => 'light', setPreference: () => undefined },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const menuButton = page.querySelector<HTMLButtonElement>(
      'button[aria-controls="qd-admin-mobile-sidebar"]',
    );
    expect(menuButton).not.toBeNull();
    expect(menuButton?.getAttribute('aria-expanded')).toBe('false');
    expect(page.querySelector('#qd-admin-mobile-sidebar')).toBeNull();

    menuButton?.click();
    fixture.detectChanges();

    expect(menuButton?.getAttribute('aria-expanded')).toBe('true');
    expect(page.querySelector('#qd-admin-mobile-sidebar')).not.toBeNull();

    page
      .querySelector<HTMLButtonElement>(
        '#qd-admin-mobile-sidebar button[aria-label="Fechar menu administrativo"]',
      )
      ?.click();
    fixture.detectChanges();

    expect(menuButton?.getAttribute('aria-expanded')).toBe('false');
    expect(page.querySelector('#qd-admin-mobile-sidebar')).toBeNull();
  });
});

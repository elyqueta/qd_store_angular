import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { provideAppI18n } from '../../core/i18n/i18n.providers';
import { ToastService } from '../../core/notifications/toast.service';
import { ThemeService } from '../../core/theme/theme.service';
import { ProductApiService } from '../../features/public/data-access/product-api.service';
import { SiteNavbarComponent } from './site-navbar.component';

describe('SiteNavbarComponent', () => {
  it('uses the profile photo in the authenticated user menu trigger', async () => {
    const user = {
      fullName: 'Ana Silva',
      email: 'ana@example.com',
      profilePhoto: {
        url: 'https://example.com/profile.jpg',
        width: 400,
        height: 400,
        format: 'jpg',
        sizeBytes: 1200,
      },
    };

    await TestBed.configureTestingModule({
      imports: [SiteNavbarComponent],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        {
          provide: ProductApiService,
          useValue: { listCategories: () => of([]), listProducts: () => of({ items: [] }) },
        },
        {
          provide: AuthStore,
          useValue: { isAuthenticated: () => true, user: () => user },
        },
        { provide: ThemeService, useValue: { effective: () => 'light', setPreference: vi.fn() } },
        { provide: AuthService, useValue: { logout: () => of(undefined) } },
        { provide: ToastService, useValue: { error: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SiteNavbarComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '#qd-user-menu-trigger',
    ) as HTMLButtonElement;
    expect(trigger.querySelector('img')?.getAttribute('src')).toBe(user.profilePhoto.url);
    expect(trigger.textContent?.trim()).toBe('');
  });

  it('opens a category menu from the keyboard and focuses its first item', async () => {
    const category = {
      id: 'category-1',
      slug: 'computadores',
      label: 'Computadores',
      icon: null,
    };

    await TestBed.configureTestingModule({
      imports: [SiteNavbarComponent],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        {
          provide: ProductApiService,
          useValue: {
            listCategories: () => of([category]),
            listProducts: () => of({ items: [] }),
          },
        },
        {
          provide: AuthStore,
          useValue: { isAuthenticated: () => false, user: () => null },
        },
        {
          provide: ThemeService,
          useValue: { effective: () => 'light', setPreference: vi.fn() },
        },
        { provide: AuthService, useValue: { logout: () => of(undefined) } },
        { provide: ToastService, useValue: { error: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SiteNavbarComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '#qd-category-trigger-category-1',
    ) as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 30));
    fixture.detectChanges();

    const menuItem = fixture.nativeElement.querySelector(
      '#qd-category-menu-category-1 [role="menuitem"]',
    ) as HTMLElement | null;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(menuItem).not.toBeNull();
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(menuItem);
  });

  it('returns focus to the mobile menu button when Escape closes the menu', async () => {
    await TestBed.configureTestingModule({
      imports: [SiteNavbarComponent],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        {
          provide: ProductApiService,
          useValue: { listCategories: () => of([]), listProducts: () => of({ items: [] }) },
        },
        {
          provide: AuthStore,
          useValue: { isAuthenticated: () => false, user: () => null },
        },
        {
          provide: ThemeService,
          useValue: { effective: () => 'light', setPreference: vi.fn() },
        },
        { provide: AuthService, useValue: { logout: () => of(undefined) } },
        { provide: ToastService, useValue: { error: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SiteNavbarComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '#qd-mobile-menu-trigger',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });
});

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { provideAppI18n } from '../../core/i18n/i18n.providers';
import { AuthStore } from '../../core/auth/auth.store';
import { AuthUser } from '../../core/auth/auth.models';
import { AccountLayoutComponent } from './account-layout.component';
import { SiteFooterComponent } from '../../shared/ui/site-footer.component';
import { SiteNavbarComponent } from '../../shared/ui/site-navbar.component';

describe('AccountLayoutComponent', () => {
  let accountUser: AuthUser;

  beforeEach(async () => {
    accountUser = {
      id: 'user-1',
      fullName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '923456789',
      nif: null,
      accountType: 'personal',
      role: 'customer',
      status: 'active',
      deactivatedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      profilePhoto: null,
    };
    await TestBed.configureTestingModule({
      imports: [AccountLayoutComponent],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { user: () => accountUser },
        },
      ],
    })
      .overrideComponent(AccountLayoutComponent, {
        remove: { imports: [SiteFooterComponent, SiteNavbarComponent] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
  });

  it('shows supported account sections without unavailable payment or security tabs', async () => {
    const fixture = TestBed.createComponent(AccountLayoutComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    const links = Array.from(page.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );

    expect(page.textContent).toContain('Ana Silva');
    expect(links).toEqual([
      'Dados pessoais',
      'Encomendas',
      'Favoritos',
      'Notificações',
      'Moradas',
      'As minhas empresas',
      'Carrinho',
    ]);
    expect(page.textContent).not.toContain('Pagamento');
    expect(page.textContent).not.toContain('Segurança');
  });

  it('uses the profile photo instead of initials when it is available', async () => {
    accountUser.profilePhoto = {
      url: 'https://example.com/profile.jpg',
      width: 400,
      height: 400,
      format: 'jpg',
      sizeBytes: 1200,
    };

    const fixture = TestBed.createComponent(AccountLayoutComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const avatar = fixture.nativeElement.querySelector('aside img') as HTMLImageElement | null;
    expect(avatar?.src).toBe('https://example.com/profile.jpg');
    expect(fixture.nativeElement.querySelector('aside')?.textContent).not.toContain('AS');
  });

  it('shows the shared page heading only on the profile route', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    const fixture = TestBed.createComponent(AccountLayoutComponent);
    const router = TestBed.inject(Router);
    const component = fixture.componentInstance;
    const page = fixture.nativeElement as HTMLElement;
    const routerUrl = vi.spyOn(router, 'url', 'get');

    routerUrl.mockReturnValue('/conta/perfil');
    component.onRouteActivate();
    fixture.detectChanges();

    expect(page.querySelector('#qd-main-content > header h1')?.textContent?.trim()).toBe(
      'O meu perfil',
    );

    routerUrl.mockReturnValue('/conta/encomendas');
    component.onRouteActivate();
    fixture.detectChanges();

    expect(page.querySelector('#qd-main-content > header')).toBeNull();
  });
});

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { provideAppI18n } from '../../core/i18n/i18n.providers';
import { AuthStore } from '../../core/auth/auth.store';
import { AccountLayoutComponent } from './account-layout.component';
import { SiteFooterComponent } from '../../shared/ui/site-footer.component';
import { SiteNavbarComponent } from '../../shared/ui/site-navbar.component';

describe('AccountLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountLayoutComponent],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            user: () => ({
              fullName: 'Ana Silva',
              email: 'ana@example.com',
            }),
          },
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

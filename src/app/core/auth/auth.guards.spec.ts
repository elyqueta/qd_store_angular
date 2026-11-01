import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { provideAppI18n } from '../i18n/i18n.providers';
import { LoginPage } from '../../features/auth/pages/login.page';
import { AuthResult } from './auth.models';
import { adminGuard, authGuard, guestGuard } from './auth.guards';
import { AuthStore } from './auth.store';

const session: AuthResult = {
  user: {
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
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

describe('authentication guards', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ...provideAppI18n(),
        provideRouter([
          { path: 'entrar', component: LoginPage, canActivate: [guestGuard] },
          { path: 'conta/perfil', component: LoginPage, canActivate: [authGuard] },
          { path: 'admin', component: LoginPage, canActivate: [adminGuard] },
          { path: '', component: LoginPage },
        ]),
      ],
    });
  });

  it('redirects unauthenticated routes to login and preserves the return URL', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/conta/perfil?tab=addresses');

    const router = TestBed.inject(Router);
    expect(router.url).toBe('/entrar?returnUrl=%2Fconta%2Fperfil%3Ftab%3Daddresses');
  });

  it('redirects authenticated guests away from login', async () => {
    TestBed.inject(AuthStore).setSession(session);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/entrar');

    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('denies admin routes to non-admin users', async () => {
    TestBed.inject(AuthStore).setSession(session);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin');

    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('allows an authenticated user to reach a protected account route', async () => {
    TestBed.inject(AuthStore).setSession(session);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/conta/perfil');

    expect(TestBed.inject(Router).url).toBe('/conta/perfil');
  });
});

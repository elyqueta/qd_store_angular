import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiErrorInterceptor } from '../http/api-error.interceptor';
import { AuthResult, AuthUser } from './auth.models';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

const user: AuthUser = {
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
};

const session: AuthResult = {
  user,
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};
const authEndpoint = `${environment.apiUrl}/api/v1/auth`;

describe('AuthService', () => {
  let authService: AuthService;
  let authStore: AuthStore;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    authService = TestBed.inject(AuthService);
    authStore = TestBed.inject(AuthStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    window.localStorage.clear();
  });

  it('creates a personal account using the versioned API contract', async () => {
    const result = firstValueFrom(
      authService.register({
        fullName: user.fullName,
        email: user.email,
        password: 'StrongPass1',
        phone: user.phone,
        accountType: 'personal',
      }),
    );

    const request = httpTesting.expectOne(`${authEndpoint}/register`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.accountType).toBe('personal');
    request.flush({ status: 'success', data: user });

    await expect(result).resolves.toEqual(user);
    expect(authStore.status()).toBe('unknown');
  });

  it('keeps the access token in memory and stores only the refresh token', async () => {
    const result = firstValueFrom(
      authService.login({ email: user.email, password: 'StrongPass1' }),
    );
    httpTesting.expectOne(`${authEndpoint}/login`).flush({ status: 'success', data: session });

    await expect(result).resolves.toEqual(user);
    expect(authStore.accessToken()).toBe(session.accessToken);
    expect(authStore.user()).toEqual(user);
    expect(authStore.status()).toBe('authenticated');
    expect(window.localStorage.getItem('qd.refresh')).toBe(session.refreshToken);
    expect(window.localStorage.getItem('qd.access')).toBeNull();
  });

  it('rotates the saved refresh token and clears the local session on logout', async () => {
    window.localStorage.setItem('qd.refresh', 'old-refresh-token');
    const refreshResult = firstValueFrom(authService.refresh());
    const refreshRequest = httpTesting.expectOne(`${authEndpoint}/refresh`);
    expect(refreshRequest.request.body).toEqual({ refreshToken: 'old-refresh-token' });
    refreshRequest.flush({
      status: 'success',
      data: { ...session, refreshToken: 'rotated-refresh-token' },
    });

    await expect(refreshResult).resolves.toEqual({
      ...session,
      refreshToken: 'rotated-refresh-token',
    });
    expect(window.localStorage.getItem('qd.refresh')).toBe('rotated-refresh-token');

    const logoutResult = firstValueFrom(authService.logout());
    const logoutRequest = httpTesting.expectOne(`${authEndpoint}/logout`);
    expect(logoutRequest.request.body).toEqual({ refreshToken: 'rotated-refresh-token' });
    logoutRequest.flush(null, { status: 204, statusText: 'No Content' });

    await expect(logoutResult).resolves.toBeUndefined();
    expect(authStore.status()).toBe('anonymous');
    expect(window.localStorage.getItem('qd.refresh')).toBeNull();
  });

  it('restores a session and persists the rotated refresh token at startup', async () => {
    window.localStorage.setItem('qd.refresh', 'old-refresh-token');
    const restoration = authService.restoreSession();
    const request = httpTesting.expectOne(`${authEndpoint}/refresh`);

    expect(request.request.body).toEqual({ refreshToken: 'old-refresh-token' });
    request.flush({ status: 'success', data: session });

    await expect(restoration).resolves.toBeUndefined();
    expect(authStore.status()).toBe('authenticated');
    expect(authStore.accessToken()).toBe(session.accessToken);
    expect(window.localStorage.getItem('qd.refresh')).toBe(session.refreshToken);
  });
});

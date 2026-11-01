import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResult, AuthUser } from './auth.models';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from './auth.store';
import { apiErrorInterceptor } from '../http/api-error.interceptor';

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
  } satisfies AuthUser,
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
};
const apiRoot = `${environment.apiUrl}/api/v1`;

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authStore: AuthStore;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: TranslocoService,
          useValue: { translate: () => 'A tua sessão expirou.' },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    httpTesting.verify();
    window.localStorage.clear();
  });

  it('does not attach the access token to authentication endpoints', async () => {
    authStore.setSession(session);
    const response = firstValueFrom(http.post<{ ok: boolean }>(`${apiRoot}/auth/login`, {}));
    const request = httpTesting.expectOne(`${apiRoot}/auth/login`);

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ ok: true });

    await expect(response).resolves.toEqual({ ok: true });
  });

  it('attaches the access token, shares a refresh, and retries concurrent requests', async () => {
    authStore.setSession({ ...session, accessToken: 'expired-access-token' });
    window.localStorage.setItem('qd.refresh', 'old-refresh-token');

    const responses = firstValueFrom(
      forkJoin([
        firstValueFrom(http.get<{ id: number }>(`${apiRoot}/products/1`)),
        firstValueFrom(http.get<{ id: number }>(`${apiRoot}/products/2`)),
      ]),
    );

    const initialRequests = httpTesting.match((request) =>
      request.url.startsWith(`${apiRoot}/products/`),
    );
    expect(initialRequests).toHaveLength(2);
    for (const request of initialRequests) {
      expect(request.request.headers.get('Authorization')).toBe('Bearer expired-access-token');
      request.flush(
        { status: 'error', message: 'Token expirado.' },
        { status: 401, statusText: 'Unauthorized' },
      );
    }

    const refreshRequest = httpTesting.expectOne(`${apiRoot}/auth/refresh`);
    expect(refreshRequest.request.headers.has('Authorization')).toBe(false);
    expect(refreshRequest.request.body).toEqual({ refreshToken: 'old-refresh-token' });
    refreshRequest.flush({ status: 'success', data: session });

    const retriedRequests = httpTesting.match((request) =>
      request.url.startsWith(`${apiRoot}/products/`),
    );
    expect(retriedRequests).toHaveLength(2);
    for (const request of retriedRequests) {
      expect(request.request.headers.get('Authorization')).toBe('Bearer new-access-token');
      const id = request.request.url.endsWith('/1') ? 1 : 2;
      request.flush({ id });
    }

    await expect(responses).resolves.toEqual([{ id: 1 }, { id: 2 }]);
    expect(window.localStorage.getItem('qd.refresh')).toBe('new-refresh-token');
  });
});

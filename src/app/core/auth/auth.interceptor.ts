import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { API_URL } from '../config/api-url.token';
import { ApiError } from '../http/api-error.model';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';
import { TokenStorage } from './token-storage';
import { ToastService } from '../notifications/toast.service';
import { TranslocoService } from '@jsverse/transloco';

const SKIP_AUTH_RETRY = new HttpContextToken<boolean>(() => false);
let refreshInFlight: ReturnType<AuthService['refresh']> | null = null;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiUrl = inject(API_URL);
  const store = inject(AuthStore);
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const transloco = inject(TranslocoService);
  const tokenStorage = inject(TokenStorage);
  const router = inject(Router);
  const document = inject(DOCUMENT);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const apiRoot = `${apiUrl.replace(/\/+$/, '')}/api/v1/`;
  const isApiRequest = request.url.startsWith(apiRoot);
  const isAuthRequest = request.url.startsWith(`${apiRoot}auth/`);

  if (!isBrowser || !isApiRequest || isAuthRequest) {
    return next(request);
  }

  const accessToken = store.accessToken();
  const authenticatedRequest = accessToken
    ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof ApiError) ||
        error.status !== 401 ||
        request.context.get(SKIP_AUTH_RETRY)
      ) {
        return throwError(() => error);
      }

      const returnUrl = `${document.location.pathname}${document.location.search}${document.location.hash}`;
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        if (accessToken) {
          store.clearSession();
          void router.navigate(['/entrar'], { queryParams: { returnUrl } });
        }

        return throwError(() => error);
      }

      if (!refreshInFlight) {
        refreshInFlight = authService.refresh().pipe(
          catchError((refreshError: unknown) => {
            if (refreshError instanceof ApiError && refreshError.status === 401) {
              toastService.error(transloco.translate('auth.sessionExpired'));
              tokenStorage.clear();
              store.clearSession();
              void router.navigate(['/entrar'], { queryParams: { returnUrl } });
            }

            return throwError(() => refreshError);
          }),
          finalize(() => {
            refreshInFlight = null;
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      }

      return refreshInFlight.pipe(
        switchMap((session) =>
          next(
            request.clone({
              context: request.context.set(SKIP_AUTH_RETRY, true),
              setHeaders: { Authorization: `Bearer ${session.accessToken}` },
            }),
          ),
        ),
      );
    }),
  );
};

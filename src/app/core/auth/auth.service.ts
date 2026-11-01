import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { EMPTY, Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { API_URL } from '../config/api-url.token';
import { ApiError } from '../http/api-error.model';
import { AuthResult, ApiEnvelope, AuthUser, LoginInput, RegisterInput } from './auth.models';
import { AuthStore } from './auth.store';
import { TokenStorage } from './token-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly store = inject(AuthStore);
  private readonly tokenStorage = inject(TokenStorage);

  register(input: RegisterInput): Observable<AuthUser> {
    return this.http
      .post<ApiEnvelope<AuthUser>>(`${this.apiUrl}/api/v1/auth/register`, input)
      .pipe(map((response) => response.data));
  }

  login(input: LoginInput): Observable<AuthUser> {
    return this.http.post<ApiEnvelope<AuthResult>>(`${this.apiUrl}/api/v1/auth/login`, input).pipe(
      map((response) => response.data),
      tap((session) => this.setSession(session)),
      map((session) => session.user),
    );
  }

  refresh(): Observable<AuthResult> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Não existe um token de sessão para renovar.'));
    }

    return this.http
      .post<ApiEnvelope<AuthResult>>(`${this.apiUrl}/api/v1/auth/refresh`, { refreshToken })
      .pipe(
        map((response) => response.data),
        tap((session) => this.setSession(session)),
        catchError((error: unknown) => {
          if (error instanceof ApiError && error.status === 401) {
            this.clearSession();
          }

          return throwError(() => error);
        }),
      );
  }

  logout(): Observable<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    this.clearSession();

    if (!refreshToken) {
      return EMPTY;
    }

    return this.http.post<void>(`${this.apiUrl}/api/v1/auth/logout`, { refreshToken }).pipe(
      map(() => undefined),
      finalize(() => this.clearSession()),
    );
  }

  restoreSession(): Promise<void> {
    if (!this.isBrowser) {
      this.store.setAnonymous();
      return Promise.resolve();
    }

    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      this.store.setAnonymous();
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      this.refresh().subscribe({
        next: () => resolve(),
        error: (error: unknown) => {
          if (error instanceof ApiError && error.status === 401) {
            resolve();
            return;
          }

          this.store.setAnonymous();
          console.error(
            'Não foi possível restaurar a sessão; a aplicação continuará sem autenticação.',
            error,
          );
          resolve();
        },
      });
    });
  }

  private setSession(session: AuthResult): void {
    this.tokenStorage.setRefreshToken(session.refreshToken);
    this.store.setSession(session);
  }

  private clearSession(): void {
    try {
      this.tokenStorage.clear();
    } finally {
      this.store.clearSession();
    }
  }
}

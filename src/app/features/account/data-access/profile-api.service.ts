import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { API_URL } from '../../../core/config/api-url.token';
import { ApiError, ApiErrorDetail } from '../../../core/http/api-error.model';
import { UserProfile } from '../models/profile.model';

interface ApiResponse<T> {
  status: 'success';
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly endpoint = `${inject(API_URL).replace(/\/+$/, '')}/api/v1/users`;

  getMine(): Observable<UserProfile> {
    return this.http
      .get<ApiResponse<UserProfile>>(`${this.endpoint}/me`)
      .pipe(map((response) => response.data));
  }

  updateMine(input: FormData): Observable<UserProfile> {
    return this.http
      .patch<ApiResponse<UserProfile>>(`${this.endpoint}/me`, input)
      .pipe(map((response) => response.data));
  }

  uploadMine(input: FormData, onProgress: (progress: number) => void): Observable<UserProfile> {
    return new Observable<UserProfile>((subscriber) => {
      const request = new XMLHttpRequest();
      request.open('PATCH', `${this.endpoint}/me`);
      const accessToken = this.authStore.accessToken();
      if (accessToken) {
        request.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      }

      request.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      request.addEventListener('load', () => {
        const body = parseResponse(request.responseText);
        if (request.status >= 200 && request.status < 300 && isApiResponse<UserProfile>(body)) {
          subscriber.next(body.data);
          subscriber.complete();
          return;
        }

        subscriber.error(toApiError(request.status, body));
      });
      request.addEventListener('error', () =>
        subscriber.error(new Error('Não foi possível concluir o upload.')),
      );
      request.addEventListener('abort', () => subscriber.complete());
      request.send(input);

      return () => request.abort();
    });
  }

  removePhoto(): Observable<UserProfile> {
    return this.http
      .delete<ApiResponse<UserProfile>>(`${this.endpoint}/me/photo`)
      .pipe(map((response) => response.data));
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return isRecord(value) && value['status'] === 'success' && 'data' in value;
}

function parseResponse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function toApiError(status: number, body: unknown): ApiError {
  const message =
    isRecord(body) && typeof body['message'] === 'string'
      ? body['message']
      : 'Não foi possível concluir o upload.';
  const details: ApiErrorDetail[] =
    isRecord(body) && Array.isArray(body['details'])
      ? body['details'].flatMap((detail): ApiErrorDetail[] =>
          isRecord(detail) &&
          typeof detail['field'] === 'string' &&
          typeof detail['message'] === 'string'
            ? [{ field: detail['field'], message: detail['message'] }]
            : [],
        )
      : [];

  return new ApiError(status, message, details, body, null);
}

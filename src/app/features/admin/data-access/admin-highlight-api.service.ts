import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import {
  AdminHighlight,
  CreateAdminHighlightInput,
  HighlightReorderItem,
  UpdateAdminHighlightInput,
} from '../models/admin-highlight.model';

interface ApiSingleResponse<T> {
  status: 'success';
  data: T;
}

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class AdminHighlightApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');
  private readonly endpoint = `${this.apiUrl}/api/v1/highlights`;

  listHighlights(): Observable<AdminHighlight[]> {
    return this.http
      .get<ApiListResponse<AdminHighlight>>(`${this.endpoint}/admin`)
      .pipe(map((response) => response.data));
  }

  createHighlight(input: CreateAdminHighlightInput): Observable<AdminHighlight> {
    const formData = this.toFormData(input);

    return this.http
      .post<ApiSingleResponse<AdminHighlight>>(this.endpoint, formData)
      .pipe(map((response) => response.data));
  }

  updateHighlight(id: string, input: UpdateAdminHighlightInput): Observable<AdminHighlight> {
    const formData = this.toFormData(input);

    return this.http
      .patch<ApiSingleResponse<AdminHighlight>>(
        `${this.endpoint}/${encodeURIComponent(id)}`,
        formData,
      )
      .pipe(map((response) => response.data));
  }

  reorder(items: HighlightReorderItem[]): Observable<AdminHighlight[]> {
    return this.http
      .patch<ApiListResponse<AdminHighlight>>(`${this.endpoint}/reorder`, { items })
      .pipe(map((response) => response.data));
  }

  deleteHighlight(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${encodeURIComponent(id)}`).pipe(map(() => undefined));
  }

  private toFormData(input: Partial<CreateAdminHighlightInput>): FormData {
    const formData = new FormData();

    if (input.title !== undefined) {
      formData.append('title', input.title.trim());
    }

    if (input.subtitle !== undefined) {
      formData.append('subtitle', input.subtitle?.trim() ?? '');
    }

    if (input.label !== undefined) {
      formData.append('label', input.label?.trim() ?? '');
    }

    if (input.ctaLabel !== undefined) {
      formData.append('ctaLabel', input.ctaLabel?.trim() ?? '');
    }

    if (input.ctaUrl !== undefined) {
      formData.append('ctaUrl', input.ctaUrl?.trim() ?? '');
    }

    if (input.productId !== undefined) {
      formData.append('productId', input.productId ?? '');
    }

    if (input.placement !== undefined) {
      formData.append('placement', input.placement);
    }

    if (input.theme !== undefined) {
      formData.append('theme', input.theme);
    }

    if (input.startsAt !== undefined && input.startsAt) {
      formData.append('startsAt', input.startsAt);
    }

    if (input.endsAt !== undefined && input.endsAt) {
      formData.append('endsAt', input.endsAt);
    }

    if (input.isActive !== undefined) {
      formData.append('isActive', String(input.isActive));
    }

    if (input.image instanceof File) {
      formData.append('image', input.image);
    }

    return formData;
  }
}

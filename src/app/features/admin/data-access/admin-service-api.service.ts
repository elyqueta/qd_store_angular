import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import {
  AdminService,
  CreateAdminServiceInput,
  UpdateAdminServiceInput,
} from '../models/admin-service.model';

interface ApiSingleResponse<T> {
  status: 'success';
  data: T;
}

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminServiceApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL).replace(/\/+$/, '')}/api/v1/services`;

  listAll(): Observable<AdminService[]> {
    return this.http
      .get<ApiListResponse<AdminService>>(`${this.endpoint}/admin`)
      .pipe(map((response) => response.data));
  }

  create(input: CreateAdminServiceInput): Observable<AdminService> {
    return this.http
      .post<ApiSingleResponse<AdminService>>(this.endpoint, this.toFormData(input))
      .pipe(map((response) => response.data));
  }

  update(id: string, input: UpdateAdminServiceInput): Observable<AdminService> {
    return this.http
      .patch<ApiSingleResponse<AdminService>>(
        `${this.endpoint}/${encodeURIComponent(id)}`,
        this.toFormData(input),
      )
      .pipe(map((response) => response.data));
  }

  deactivate(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/${encodeURIComponent(id)}`)
      .pipe(map(() => undefined));
  }

  private toFormData(input: UpdateAdminServiceInput): FormData {
    const formData = new FormData();

    if (input.name !== undefined) {
      formData.append('name', input.name.trim());
    }
    if (input.description !== undefined) {
      formData.append('description', input.description?.trim() ?? '');
    }
    if (input.icon !== undefined) {
      formData.append('icon', input.icon);
    }
    if (input.startsFromPrice !== undefined) {
      formData.append('startsFromPrice', String(input.startsFromPrice));
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

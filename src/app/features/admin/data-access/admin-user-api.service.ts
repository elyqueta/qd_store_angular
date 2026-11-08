import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import {
  AdminUser,
  AdminUserDetail,
  AdminUserListPage,
  AdminUserListParams,
  UpdateAdminUserRoleInput,
  UpdateAdminUserStatusInput,
} from '../models/admin-user.model';

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
  pagination: AdminUserListPage['pagination'];
}

interface ApiSingleResponse<T> {
  status: 'success';
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminUserApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL).replace(/\/+$/, '')}/api/v1/admin/users`;

  list(params: AdminUserListParams): Observable<AdminUserListPage> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('limit', params.limit)
      .set('sort', params.sort);

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.role) {
      httpParams = httpParams.set('role', params.role);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.accountType) {
      httpParams = httpParams.set('accountType', params.accountType);
    }

    return this.http.get<ApiListResponse<AdminUser>>(this.endpoint, { params: httpParams }).pipe(
      map((response) => ({
        items: response.data,
        pagination: response.pagination,
      })),
    );
  }

  getById(id: string): Observable<AdminUserDetail> {
    return this.http
      .get<ApiSingleResponse<AdminUserDetail>>(`${this.endpoint}/${encodeURIComponent(id)}`)
      .pipe(map((response) => response.data));
  }

  updateStatus(id: string, input: UpdateAdminUserStatusInput): Observable<AdminUserDetail> {
    return this.http
      .patch<ApiSingleResponse<AdminUserDetail>>(
        `${this.endpoint}/${encodeURIComponent(id)}/status`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  updateRole(id: string, input: UpdateAdminUserRoleInput): Observable<AdminUserDetail> {
    return this.http
      .patch<ApiSingleResponse<AdminUserDetail>>(
        `${this.endpoint}/${encodeURIComponent(id)}/role`,
        input,
      )
      .pipe(map((response) => response.data));
  }
}

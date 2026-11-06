import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import { AdminCompany } from '../models/admin-company.model';
import { AdminCompanyWithUsers } from '../models/admin-dashboard.model';
import { UpdateAdminCompanyInput } from '../models/admin-company.model';

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
  count?: number;
}

interface ApiSingleResponse<T> {
  status: 'success';
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminCompanyApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');
  private readonly companiesEndpoint = `${this.apiUrl}/api/v1/companies`;

  list(): Observable<AdminCompanyWithUsers[]> {
    return this.http
      .get<ApiListResponse<AdminCompanyWithUsers>>(`${this.apiUrl}/api/v1/admin/companies`)
      .pipe(map((response) => response.data));
  }

  update(id: string, input: UpdateAdminCompanyInput): Observable<AdminCompany> {
    return this.http
      .patch<ApiSingleResponse<AdminCompany>>(
        `${this.companiesEndpoint}/${encodeURIComponent(id)}`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  deactivate(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.companiesEndpoint}/${encodeURIComponent(id)}`)
      .pipe(map(() => undefined));
  }
}

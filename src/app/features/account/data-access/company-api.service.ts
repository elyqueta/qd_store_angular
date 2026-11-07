import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import { Company, CompanyWithUsers, CreateCompanyInput } from '../models/company.model';

interface ApiSingleResponse<T> {
  status: 'success';
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CompanyApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL).replace(/\/+$/, '')}/api/v1/companies`;

  listMine(): Observable<CompanyWithUsers[]> {
    return this.http
      .get<ApiSingleResponse<CompanyWithUsers[]>>(`${this.endpoint}/mine`)
      .pipe(map((response) => response.data));
  }

  createCompany(input: CreateCompanyInput, idempotencyKey?: string): Observable<Company> {
    return this.http
      .post<ApiSingleResponse<Company>>(this.endpoint, input, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      })
      .pipe(map((response) => response.data));
  }
}

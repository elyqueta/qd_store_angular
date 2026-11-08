import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import {
  CreateQuoteRequestInput,
  ListQuoteRequestsParams,
  QuoteRequest,
  QuoteRequestListPage,
  QuoteRequestPagination,
  UpdateQuoteRequestStatusInput,
} from '../models/quote-request.model';

interface ApiSingleResponse<T> {
  status: 'success';
  data: T;
}

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
  pagination: QuoteRequestPagination;
}

@Injectable({ providedIn: 'root' })
export class QuoteRequestApiService {
  private readonly http = inject(HttpClient);
  private readonly apiV1 = `${inject(API_URL).replace(/\/+$/, '')}/api/v1`;
  private readonly endpoint = `${this.apiV1}/quote-requests`;

  create(input: CreateQuoteRequestInput): Observable<QuoteRequest> {
    return this.http
      .post<ApiSingleResponse<QuoteRequest>>(this.endpoint, input)
      .pipe(map((response) => response.data));
  }

  listAdmin(params: ListQuoteRequestsParams): Observable<QuoteRequestListPage> {
    let httpParams = new HttpParams().set('page', params.page).set('limit', params.limit);
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http
      .get<ApiListResponse<QuoteRequest>>(`${this.apiV1}/admin/quote-requests`, {
        params: httpParams,
      })
      .pipe(
        map((response) => ({
          items: response.data,
          pagination: response.pagination,
        })),
      );
  }

  updateAdminStatus(id: string, input: UpdateQuoteRequestStatusInput): Observable<QuoteRequest> {
    return this.http
      .patch<ApiSingleResponse<QuoteRequest>>(
        `${this.apiV1}/admin/quote-requests/${encodeURIComponent(id)}/status`,
        input,
      )
      .pipe(map((response) => response.data));
  }
}

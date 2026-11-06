import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import { ApiSingleResponse } from '../../public/models/product.model';
import { AdminDeliveryType } from '../models/admin-dashboard.model';
import {
  CreateAdminDeliveryTypeInput,
  UpdateAdminDeliveryTypeInput,
} from '../models/admin-delivery-type.model';

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class AdminDeliveryTypeApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL).replace(/\/+$/, '')}/api/v1/delivery-types`;

  listActive(): Observable<AdminDeliveryType[]> {
    return this.http
      .get<ApiListResponse<AdminDeliveryType>>(this.endpoint)
      .pipe(map((response) => response.data));
  }

  create(input: CreateAdminDeliveryTypeInput): Observable<AdminDeliveryType> {
    return this.http
      .post<ApiSingleResponse<AdminDeliveryType>>(this.endpoint, input)
      .pipe(map((response) => response.data));
  }

  update(id: string, input: UpdateAdminDeliveryTypeInput): Observable<AdminDeliveryType> {
    return this.http
      .patch<ApiSingleResponse<AdminDeliveryType>>(
        `${this.endpoint}/${encodeURIComponent(id)}`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  deactivate(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/${encodeURIComponent(id)}`)
      .pipe(map(() => undefined));
  }
}

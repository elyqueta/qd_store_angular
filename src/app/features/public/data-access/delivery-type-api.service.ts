import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import { DeliveryType } from '../models/delivery-type.model';

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class DeliveryTypeApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL).replace(/\/+$/, '')}/api/v1/delivery-types`;

  listActive(): Observable<DeliveryType[]> {
    return this.http
      .get<ApiListResponse<DeliveryType>>(this.endpoint)
      .pipe(map((response) => response.data));
  }
}

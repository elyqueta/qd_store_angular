import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import { StoreService } from '../models/store-service.model';

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class ServiceApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL).replace(/\/+$/, '')}/api/v1/services`;

  listActive(): Observable<StoreService[]> {
    return this.http
      .get<ApiListResponse<StoreService>>(this.endpoint)
      .pipe(map((response) => response.data));
  }
}

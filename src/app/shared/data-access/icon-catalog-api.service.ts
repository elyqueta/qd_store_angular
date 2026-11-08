import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { API_URL } from '../../core/config/api-url.token';
import { IconCatalogEntry } from '../models/icon-catalog.model';

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class IconCatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL).replace(/\/+$/, '')}/api/v1/icons`;
  private iconsRequest: Observable<IconCatalogEntry[]> | null = null;

  listIcons(): Observable<IconCatalogEntry[]> {
    this.iconsRequest ??= this.http.get<ApiListResponse<IconCatalogEntry>>(this.endpoint).pipe(
      map((response) => response.data),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.iconsRequest;
  }
}

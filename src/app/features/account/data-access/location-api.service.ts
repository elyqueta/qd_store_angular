import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay, tap } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import { ApiListResponse, ProvinceWithMunicipalities } from '../models/address.model';

@Injectable({ providedIn: 'root' })
export class LocationApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');
  private locationsRequest: Observable<ProvinceWithMunicipalities[]> | null = null;

  listProvinceLocations(): Observable<ProvinceWithMunicipalities[]> {
    this.locationsRequest ??= this.http
      .get<ApiListResponse<ProvinceWithMunicipalities>>(`${this.apiUrl}/api/v1/locations`)
      .pipe(
        map((response) => response.data),
        tap({
          error: () => {
            this.locationsRequest = null;
          },
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.locationsRequest;
  }
}

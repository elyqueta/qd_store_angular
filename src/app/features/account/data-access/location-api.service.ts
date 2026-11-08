import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay, tap } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import { ApiListResponse, Province, ProvinceWithMunicipalities } from '../models/address.model';

@Injectable({ providedIn: 'root' })
export class LocationApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');
  private locationsRequest: Observable<ProvinceWithMunicipalities[]> | null = null;
  private provincesRequest: Observable<Province[]> | null = null;
  private readonly municipalityRequests = new Map<string, Observable<string[]>>();

  listProvinces(): Observable<Province[]> {
    this.provincesRequest ??= this.http
      .get<ApiListResponse<Province>>(`${this.apiUrl}/api/v1/locations/provinces`)
      .pipe(
        map((response) => response.data),
        tap({
          error: () => {
            this.provincesRequest = null;
          },
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.provincesRequest;
  }

  listMunicipalities(provinceSlug: string): Observable<string[]> {
    const cachedRequest = this.municipalityRequests.get(provinceSlug);
    if (cachedRequest) {
      return cachedRequest;
    }

    const request = this.http
      .get<ApiListResponse<string>>(
        `${this.apiUrl}/api/v1/locations/provinces/${encodeURIComponent(provinceSlug)}/municipalities`,
      )
      .pipe(
        map((response) => response.data),
        tap({
          error: () => {
            this.municipalityRequests.delete(provinceSlug);
          },
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    this.municipalityRequests.set(provinceSlug, request);
    return request;
  }

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

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import { UserProfile } from '../models/profile.model';

interface ApiResponse<T> {
  status: 'success';
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_URL).replace(/\/+$/, '')}/api/v1/users`;

  getMine(): Observable<UserProfile> {
    return this.http
      .get<ApiResponse<UserProfile>>(`${this.endpoint}/me`)
      .pipe(map((response) => response.data));
  }

  updateMine(input: FormData): Observable<UserProfile> {
    return this.http
      .patch<ApiResponse<UserProfile>>(`${this.endpoint}/me`, input)
      .pipe(map((response) => response.data));
  }

  removePhoto(): Observable<UserProfile> {
    return this.http
      .delete<ApiResponse<UserProfile>>(`${this.endpoint}/me/photo`)
      .pipe(map((response) => response.data));
  }
}

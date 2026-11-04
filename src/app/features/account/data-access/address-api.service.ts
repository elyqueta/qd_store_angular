import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import {
  Address,
  ApiListResponse,
  ApiSingleResponse,
  CreateAddressInput,
  UpdateAddressInput,
} from '../models/address.model';

@Injectable({ providedIn: 'root' })
export class AddressApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');
  private readonly endpoint = `${this.apiUrl}/api/v1/addresses`;

  listAddresses(): Observable<Address[]> {
    return this.http
      .get<ApiListResponse<Address>>(this.endpoint)
      .pipe(map((response) => response.data));
  }

  createAddress(input: CreateAddressInput): Observable<Address> {
    return this.http
      .post<ApiSingleResponse<Address>>(this.endpoint, input)
      .pipe(map((response) => response.data));
  }

  updateAddress(id: string, input: UpdateAddressInput): Observable<Address> {
    return this.http
      .patch<ApiSingleResponse<Address>>(`${this.endpoint}/${encodeURIComponent(id)}`, input)
      .pipe(map((response) => response.data));
  }

  setDefaultAddress(id: string): Observable<Address> {
    return this.http
      .patch<ApiSingleResponse<Address>>(`${this.endpoint}/${encodeURIComponent(id)}/default`, null)
      .pipe(map((response) => response.data));
  }

  deleteAddress(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/${encodeURIComponent(id)}`)
      .pipe(map(() => undefined));
  }
}

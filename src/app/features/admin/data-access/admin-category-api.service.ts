import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import { ProductApiService } from '../../public/data-access/product-api.service';
import { ApiSingleResponse, ProductCategory } from '../../public/models/product.model';
import { CreateAdminCategoryInput, UpdateAdminCategoryInput } from '../models/admin-category.model';

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
  count?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminCategoryApiService {
  private readonly http = inject(HttpClient);
  private readonly productApi = inject(ProductApiService);
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');
  private readonly endpoint = `${this.apiUrl}/api/v1/categories`;

  listCategories(): Observable<ProductCategory[]> {
    return this.http
      .get<ApiListResponse<ProductCategory>>(this.endpoint)
      .pipe(map((response) => response.data));
  }

  createCategory(input: CreateAdminCategoryInput): Observable<ProductCategory> {
    return this.http.post<ApiSingleResponse<ProductCategory>>(this.endpoint, input).pipe(
      map((response) => response.data),
      tap(() => this.productApi.invalidateCategories()),
    );
  }

  updateCategory(id: string, input: UpdateAdminCategoryInput): Observable<ProductCategory> {
    return this.http
      .patch<ApiSingleResponse<ProductCategory>>(
        `${this.endpoint}/${encodeURIComponent(id)}`,
        input,
      )
      .pipe(
        map((response) => response.data),
        tap(() => this.productApi.invalidateCategories()),
      );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${encodeURIComponent(id)}`).pipe(
      map(() => undefined),
      tap(() => this.productApi.invalidateCategories()),
    );
  }
}

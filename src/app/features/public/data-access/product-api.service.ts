import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import {
  ApiCollectionResponse,
  ApiSingleResponse,
  Product,
  ProductCategory,
  ProductDetail,
  ProductListPage,
} from '../models/product.model';

interface ListProductsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  status?: 'active' | 'inactive' | 'out_of_stock';
  search?: string;
  sort?: 'createdAt_desc' | 'createdAt_asc' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
  priceMin?: number;
  priceMax?: number;
  availableOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');
  private categoriesRequest: Observable<ProductCategory[]> | null = null;

  listCategories(): Observable<ProductCategory[]> {
    this.categoriesRequest ??= this.http
      .get<ApiSingleResponse<ProductCategory[]>>(`${this.apiUrl}/api/v1/categories`)
      .pipe(
        map((response) => response.data),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.categoriesRequest;
  }

  invalidateCategories(): void {
    this.categoriesRequest = null;
  }

  listProducts(params: ListProductsParams = {}): Observable<ProductListPage> {
    let requestParams = new HttpParams();

    if (params.page !== undefined) {
      requestParams = requestParams.set('page', String(params.page));
    }

    if (params.limit !== undefined) {
      requestParams = requestParams.set('limit', String(params.limit));
    }

    if (params.categoryId) {
      requestParams = requestParams.set('categoryId', params.categoryId);
    }

    if (params.status) {
      requestParams = requestParams.set('status', params.status);
    }

    if (params.search) {
      requestParams = requestParams.set('search', params.search);
    }

    if (params.sort) {
      requestParams = requestParams.set('sort', params.sort);
    }

    if (params.priceMin !== undefined) {
      requestParams = requestParams.set('priceMin', String(params.priceMin));
    }

    if (params.priceMax !== undefined) {
      requestParams = requestParams.set('priceMax', String(params.priceMax));
    }

    if (params.availableOnly !== undefined) {
      requestParams = requestParams.set('availableOnly', String(params.availableOnly));
    }

    return this.http
      .get<ApiCollectionResponse<Product>>(`${this.apiUrl}/api/v1/products`, {
        params: requestParams,
      })
      .pipe(
        map((response) => ({
          items: response.data,
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        })),
      );
  }

  getProductById(productId: string): Observable<ProductDetail> {
    return this.http
      .get<ApiSingleResponse<ProductDetail>>(`${this.apiUrl}/api/v1/products/${productId}`, {
        params: new HttpParams().set('include', 'images,specifications'),
      })
      .pipe(map((response) => response.data));
  }
}

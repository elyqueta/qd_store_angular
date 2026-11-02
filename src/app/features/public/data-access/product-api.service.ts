import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, map, shareReplay } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import {
  ApiCollectionResponse,
  ApiSingleResponse,
  Product,
  ProductCategory,
  ProductDetail,
  ProductImage,
  ProductListPage,
  ProductSpecification,
} from '../models/product.model';

interface ListProductsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  status?: 'active' | 'inactive' | 'out_of_stock';
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
    return forkJoin({
      product: this.http.get<ApiSingleResponse<Product>>(
        `${this.apiUrl}/api/v1/products/${productId}`,
      ),
      images: this.http.get<ApiSingleResponse<ProductImage[]>>(
        `${this.apiUrl}/api/v1/products/${productId}/images`,
      ),
      specifications: this.http.get<ApiSingleResponse<ProductSpecification[]>>(
        `${this.apiUrl}/api/v1/products/${productId}/specifications`,
      ),
    }).pipe(
      map(({ product, images, specifications }) => ({
        ...product.data,
        images: images.data,
        specifications: specifications.data,
      })),
    );
  }
}

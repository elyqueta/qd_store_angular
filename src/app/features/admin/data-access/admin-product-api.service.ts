import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import { ProductApiService } from '../../public/data-access/product-api.service';
import {
  ApiSingleResponse,
  Product,
  ProductImage,
  ProductSpecification,
} from '../../public/models/product.model';
import {
  AdminCreateProductImageInput,
  AdminCreateProductInput,
  AdminCreateProductSpecificationInput,
  AdminUpdateProductImageInput,
  AdminUpdateProductInput,
  AdminUpdateProductSpecificationInput,
} from '../models/admin-product.model';

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class AdminProductApiService {
  private readonly http = inject(HttpClient);
  private readonly productApi = inject(ProductApiService);
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');
  private readonly endpoint = `${this.apiUrl}/api/v1/products`;

  listProducts(params: {
    page: number;
    limit: number;
    status?: Product['status'];
    search?: string;
  }) {
    return this.productApi.listProducts(params);
  }

  getProduct(id: string) {
    return this.productApi.getProductById(id);
  }

  createProduct(input: AdminCreateProductInput): Observable<Product> {
    return this.http
      .post<ApiSingleResponse<Product>>(this.endpoint, input)
      .pipe(map((response) => response.data));
  }

  updateProduct(id: string, input: AdminUpdateProductInput): Observable<Product> {
    return this.http
      .patch<ApiSingleResponse<Product>>(`${this.endpoint}/${encodeURIComponent(id)}`, input)
      .pipe(map((response) => response.data));
  }

  deleteProduct(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/${encodeURIComponent(id)}`)
      .pipe(map(() => undefined));
  }

  createImage(productId: string, input: AdminCreateProductImageInput): Observable<ProductImage> {
    return this.http
      .post<ApiSingleResponse<ProductImage>>(this.imageEndpoint(productId), input)
      .pipe(map((response) => response.data));
  }

  updateImage(
    productId: string,
    imageId: string,
    input: AdminUpdateProductImageInput,
  ): Observable<ProductImage> {
    return this.http
      .patch<ApiSingleResponse<ProductImage>>(
        `${this.imageEndpoint(productId)}/${encodeURIComponent(imageId)}`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  deleteImage(productId: string, imageId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.imageEndpoint(productId)}/${encodeURIComponent(imageId)}`)
      .pipe(map(() => undefined));
  }

  createSpecification(
    productId: string,
    input: AdminCreateProductSpecificationInput,
  ): Observable<ProductSpecification> {
    return this.http
      .post<ApiSingleResponse<ProductSpecification>>(this.specificationEndpoint(productId), input)
      .pipe(map((response) => response.data));
  }

  updateSpecification(
    productId: string,
    specificationId: string,
    input: AdminUpdateProductSpecificationInput,
  ): Observable<ProductSpecification> {
    return this.http
      .patch<ApiSingleResponse<ProductSpecification>>(
        `${this.specificationEndpoint(productId)}/${encodeURIComponent(specificationId)}`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  deleteSpecification(productId: string, specificationId: string): Observable<void> {
    return this.http
      .delete<void>(
        `${this.specificationEndpoint(productId)}/${encodeURIComponent(specificationId)}`,
      )
      .pipe(map(() => undefined));
  }

  private imageEndpoint(productId: string): string {
    return `${this.endpoint}/${encodeURIComponent(productId)}/images`;
  }

  private specificationEndpoint(productId: string): string {
    return `${this.endpoint}/${encodeURIComponent(productId)}/specifications`;
  }
}

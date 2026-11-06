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
  AdminCreateProductInput,
  AdminCreateProductSpecificationInput,
  AdminUploadProductImageMetadata,
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
    const formData = new FormData();
    formData.append('categoryId', input.categoryId);
    formData.append('name', input.name);
    formData.append('price', String(input.price));
    if (input.description !== undefined) {
      formData.append('description', input.description);
    }
    if (input.originalPrice !== undefined) {
      formData.append('originalPrice', String(input.originalPrice));
    }
    if (input.badge !== undefined) {
      formData.append('badge', input.badge);
    }
    if (input.image) {
      formData.append('image', input.image);
    }

    return this.http
      .post<ApiSingleResponse<Product>>(this.endpoint, formData)
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

  uploadImage(
    productId: string,
    file: File,
    metadata: AdminUploadProductImageMetadata = {},
  ): Observable<ProductImage> {
    const formData = new FormData();
    formData.append('image', file);
    this.appendImageMetadata(formData, metadata);

    return this.http
      .post<ApiSingleResponse<ProductImage>>(this.imageEndpoint(productId), formData)
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

  replaceImage(
    productId: string,
    imageId: string,
    file: File,
    metadata: AdminUploadProductImageMetadata = {},
  ): Observable<ProductImage> {
    const formData = new FormData();
    formData.append('image', file);
    this.appendImageMetadata(formData, metadata);

    return this.http
      .patch<ApiSingleResponse<ProductImage>>(
        `${this.imageEndpoint(productId)}/${encodeURIComponent(imageId)}`,
        formData,
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

  private appendImageMetadata(formData: FormData, metadata: AdminUploadProductImageMetadata): void {
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    }
  }

  private specificationEndpoint(productId: string): string {
    return `${this.endpoint}/${encodeURIComponent(productId)}/specifications`;
  }
}

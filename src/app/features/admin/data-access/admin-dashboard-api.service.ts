import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api-url.token';
import { ProductApiService } from '../../public/data-access/product-api.service';
import {
  AdminCompanyWithUsers,
  AdminDashboardSummary,
  AdminDeliveryType,
} from '../models/admin-dashboard.model';

interface ApiListResponse<T> {
  status: 'success';
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly productApi = inject(ProductApiService);
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');

  getSummary(): Observable<AdminDashboardSummary> {
    return forkJoin({
      products: this.productApi.listProducts({ page: 1, limit: 1 }),
      categories: this.productApi.listCategories(),
      deliveryTypes: this.http.get<ApiListResponse<AdminDeliveryType>>(
        `${this.apiUrl}/api/v1/delivery-types`,
      ),
      companies: this.http.get<ApiListResponse<AdminCompanyWithUsers>>(
        `${this.apiUrl}/api/v1/admin/companies`,
      ),
    }).pipe(
      map(({ products, categories, deliveryTypes, companies }) => ({
        products: products.total,
        categories: categories.length,
        deliveryTypes: deliveryTypes.data.length,
        companies: companies.data.length,
      })),
    );
  }
}

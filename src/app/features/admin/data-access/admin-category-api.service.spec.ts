import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductApiService } from '../../public/data-access/product-api.service';
import { AdminCategoryApiService } from './admin-category-api.service';

const apiRoot = `${environment.apiUrl}/api/v1`;

const category = {
  id: 'category-1',
  slug: 'portateis',
  label: 'Portáteis',
  icon: 'laptop',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminCategoryApiService', () => {
  let api: AdminCategoryApiService;
  let productApi: ProductApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AdminCategoryApiService);
    productApi = TestBed.inject(ProductApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('unwraps the category list response', async () => {
    const categoriesPromise = firstValueFrom(api.listCategories());
    httpTesting.expectOne(`${apiRoot}/categories`).flush({
      status: 'success',
      count: 1,
      data: [category],
    });

    await expect(categoriesPromise).resolves.toEqual([category]);
  });

  it('creates categories and invalidates the public category cache', async () => {
    const cachedCategories = firstValueFrom(productApi.listCategories());
    httpTesting.expectOne(`${apiRoot}/categories`).flush({
      status: 'success',
      data: [category],
    });
    await expect(cachedCategories).resolves.toEqual([category]);

    const createdPromise = firstValueFrom(api.createCategory({ label: 'Acessórios', icon: 'usb' }));
    const createRequest = httpTesting.expectOne(`${apiRoot}/categories`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({ label: 'Acessórios', icon: 'usb' });
    createRequest.flush({
      status: 'success',
      data: { ...category, id: 'category-2', label: 'Acessórios', slug: 'acessorios' },
    });

    await expect(createdPromise).resolves.toMatchObject({
      id: 'category-2',
      label: 'Acessórios',
    });

    const refreshedCategories = firstValueFrom(productApi.listCategories());
    httpTesting.expectOne(`${apiRoot}/categories`).flush({
      status: 'success',
      data: [category, { ...category, id: 'category-2', label: 'Acessórios' }],
    });
    await expect(refreshedCategories).resolves.toHaveLength(2);
  });

  it('sends partial updates and removes categories using their encoded ids', async () => {
    const updatePromise = firstValueFrom(api.updateCategory('category/1', { icon: null }));
    const updateRequest = httpTesting.expectOne(`${apiRoot}/categories/category%2F1`);
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ icon: null });
    updateRequest.flush({ status: 'success', data: { ...category, icon: null } });
    await expect(updatePromise).resolves.toMatchObject({ icon: null });

    const deletePromise = firstValueFrom(api.deleteCategory('category/1'));
    const deleteRequest = httpTesting.expectOne(`${apiRoot}/categories/category%2F1`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null, { status: 204, statusText: 'No Content' });
    await expect(deletePromise).resolves.toBeUndefined();
  });
});

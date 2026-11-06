import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminProductApiService } from './admin-product-api.service';

const apiRoot = `${environment.apiUrl}/api/v1`;

const product = {
  id: 'product-1',
  categoryId: 'category-1',
  name: 'Computador portátil',
  description: null,
  price: 250000,
  originalPrice: null,
  badge: null,
  status: 'active' as const,
  mainImage: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminProductApiService', () => {
  let api: AdminProductApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AdminProductApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('creates, updates, and deletes products using the supported API contract', async () => {
    const createPromise = firstValueFrom(
      api.createProduct({ categoryId: 'category-1', name: product.name, price: product.price }),
    );
    const createRequest = httpTesting.expectOne(`${apiRoot}/products`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      categoryId: 'category-1',
      name: product.name,
      price: product.price,
    });
    createRequest.flush({ status: 'success', data: product });
    await expect(createPromise).resolves.toEqual(product);

    const updatePromise = firstValueFrom(
      api.updateProduct('product-1', { description: null, originalPrice: 300000 }),
    );
    const updateRequest = httpTesting.expectOne(`${apiRoot}/products/product-1`);
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ description: null, originalPrice: 300000 });
    updateRequest.flush({
      status: 'success',
      data: { ...product, description: null, originalPrice: 300000 },
    });
    await expect(updatePromise).resolves.toMatchObject({ originalPrice: 300000 });

    const deletePromise = firstValueFrom(api.deleteProduct('product-1'));
    const deleteRequest = httpTesting.expectOne(`${apiRoot}/products/product-1`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null, { status: 204, statusText: 'No Content' });
    await expect(deletePromise).resolves.toBeUndefined();
  });

  it('creates, updates, and deletes product images by URL', async () => {
    const image = {
      id: 'image-1',
      productId: 'product-1',
      url: 'https://example.test/product.webp',
      displayOrder: 0,
      width: null,
      height: null,
      format: null,
      sizeBytes: null,
    };

    const createPromise = firstValueFrom(
      api.createImage('product-1', { url: image.url, displayOrder: 0 }),
    );
    const createRequest = httpTesting.expectOne(`${apiRoot}/products/product-1/images`);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({ status: 'success', data: image });
    await expect(createPromise).resolves.toEqual(image);

    const updatePromise = firstValueFrom(
      api.updateImage('product-1', 'image-1', { displayOrder: 1 }),
    );
    const updateRequest = httpTesting.expectOne(`${apiRoot}/products/product-1/images/image-1`);
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ displayOrder: 1 });
    updateRequest.flush({ status: 'success', data: { ...image, displayOrder: 1 } });
    await expect(updatePromise).resolves.toMatchObject({ displayOrder: 1 });

    const deletePromise = firstValueFrom(api.deleteImage('product-1', 'image-1'));
    const deleteRequest = httpTesting.expectOne(`${apiRoot}/products/product-1/images/image-1`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null, { status: 204, statusText: 'No Content' });
    await expect(deletePromise).resolves.toBeUndefined();
  });

  it('creates, updates, and deletes product specifications', async () => {
    const specification = {
      id: 'spec-1',
      productId: 'product-1',
      specKey: 'Memória',
      specValue: '16 GB',
      displayOrder: 0,
    };

    const createPromise = firstValueFrom(
      api.createSpecification('product-1', {
        specKey: specification.specKey,
        specValue: specification.specValue,
        displayOrder: 0,
      }),
    );
    const createRequest = httpTesting.expectOne(`${apiRoot}/products/product-1/specifications`);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({ status: 'success', data: specification });
    await expect(createPromise).resolves.toEqual(specification);

    const updatePromise = firstValueFrom(
      api.updateSpecification('product-1', 'spec-1', { specValue: '32 GB' }),
    );
    const updateRequest = httpTesting.expectOne(
      `${apiRoot}/products/product-1/specifications/spec-1`,
    );
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ specValue: '32 GB' });
    updateRequest.flush({
      status: 'success',
      data: { ...specification, specValue: '32 GB' },
    });
    await expect(updatePromise).resolves.toMatchObject({ specValue: '32 GB' });

    const deletePromise = firstValueFrom(api.deleteSpecification('product-1', 'spec-1'));
    const deleteRequest = httpTesting.expectOne(
      `${apiRoot}/products/product-1/specifications/spec-1`,
    );
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null, { status: 204, statusText: 'No Content' });
    await expect(deletePromise).resolves.toBeUndefined();
  });
});

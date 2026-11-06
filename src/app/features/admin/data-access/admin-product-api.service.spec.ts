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
    expect(createRequest.request.body).toBeInstanceOf(FormData);
    expect(createRequest.request.body.get('categoryId')).toBe('category-1');
    expect(createRequest.request.body.get('name')).toBe(product.name);
    expect(createRequest.request.body.get('price')).toBe(String(product.price));
    expect(createRequest.request.body.get('image')).toBeNull();
    expect(createRequest.request.body.get('url')).toBeNull();
    expect(createRequest.request.headers.has('Content-Type')).toBe(false);
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

  it('creates products with optional fields and an image using multipart form data', async () => {
    const file = new File(['image'], 'product.webp', { type: 'image/webp' });
    const createPromise = firstValueFrom(
      api.createProduct({
        categoryId: 'category-1',
        name: product.name,
        description: 'Descrição do produto',
        price: product.price,
        originalPrice: 300000,
        badge: 'Destaque',
        image: file,
      }),
    );
    const createRequest = httpTesting.expectOne(`${apiRoot}/products`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toBeInstanceOf(FormData);
    expect(createRequest.request.body.get('categoryId')).toBe('category-1');
    expect(createRequest.request.body.get('name')).toBe(product.name);
    expect(createRequest.request.body.get('description')).toBe('Descrição do produto');
    expect(createRequest.request.body.get('price')).toBe(String(product.price));
    expect(createRequest.request.body.get('originalPrice')).toBe('300000');
    expect(createRequest.request.body.get('badge')).toBe('Destaque');
    expect(createRequest.request.body.get('image')).toBe(file);
    expect(createRequest.request.body.get('url')).toBeNull();
    expect(createRequest.request.body.get('mainImage')).toBeNull();
    expect(createRequest.request.body.get('width')).toBeNull();
    expect(createRequest.request.body.get('height')).toBeNull();
    expect(createRequest.request.body.get('format')).toBeNull();
    expect(createRequest.request.body.get('sizeBytes')).toBeNull();
    expect(createRequest.request.headers.has('Content-Type')).toBe(false);
    createRequest.flush({ status: 'success', data: product });
    await expect(createPromise).resolves.toEqual(product);
  });

  it('updates and deletes product image metadata without sending a URL', async () => {
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

  it('uploads and replaces product images using multipart form data', async () => {
    const image = {
      id: 'image-1',
      productId: 'product-1',
      url: 'https://example.test/product.webp',
      displayOrder: 2,
      width: 1200,
      height: 900,
      format: 'webp',
      sizeBytes: 12000,
    };
    const file = new File(['image'], 'product.webp', { type: 'image/webp' });

    const createPromise = firstValueFrom(
      api.uploadImage('product-1', file, {
        displayOrder: 2,
        width: 1200,
        height: 900,
        format: 'webp',
        sizeBytes: 12000,
      }),
    );
    const createRequest = httpTesting.expectOne(`${apiRoot}/products/product-1/images`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toBeInstanceOf(FormData);
    expect(createRequest.request.body.get('image')).toBe(file);
    expect(createRequest.request.body.get('displayOrder')).toBe('2');
    expect(createRequest.request.body.get('width')).toBe('1200');
    expect(createRequest.request.body.get('height')).toBe('900');
    expect(createRequest.request.body.get('format')).toBe('webp');
    expect(createRequest.request.body.get('sizeBytes')).toBe('12000');
    expect(createRequest.request.body.get('url')).toBeNull();
    createRequest.flush({ status: 'success', data: image });
    await expect(createPromise).resolves.toEqual(image);

    const replacePromise = firstValueFrom(
      api.replaceImage('product-1', 'image-1', file, { displayOrder: 3 }),
    );
    const replaceRequest = httpTesting.expectOne(`${apiRoot}/products/product-1/images/image-1`);
    expect(replaceRequest.request.method).toBe('PATCH');
    expect(replaceRequest.request.body).toBeInstanceOf(FormData);
    expect(replaceRequest.request.body.get('image')).toBe(file);
    expect(replaceRequest.request.body.get('displayOrder')).toBe('3');
    expect(replaceRequest.request.body.get('url')).toBeNull();
    replaceRequest.flush({ status: 'success', data: { ...image, displayOrder: 3 } });
    await expect(replacePromise).resolves.toMatchObject({ displayOrder: 3 });
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

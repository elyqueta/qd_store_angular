import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductApiService } from './product-api.service';

const apiRoot = `${environment.apiUrl}/api/v1`;

describe('ProductApiService', () => {
  let api: ProductApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProductApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('keeps the optional main image returned with catalog products', async () => {
    const responsePromise = firstValueFrom(api.listProducts({ limit: 1 }));
    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${apiRoot}/products` && candidate.params.get('limit') === '1',
    );

    request.flush({
      status: 'success',
      data: [
        {
          id: 'product-1',
          categoryId: 'category-1',
          name: 'Computador portátil',
          description: null,
          price: 250000,
          originalPrice: null,
          badge: null,
          status: 'active',
          mainImage: {
            id: 'image-1',
            productId: 'product-1',
            url: 'https://example.test/product-1.webp',
            displayOrder: 0,
            width: 1200,
            height: 900,
            format: 'webp',
            sizeBytes: 12000,
          },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, limit: 1, total: 1, totalPages: 1 },
    });

    await expect(responsePromise).resolves.toMatchObject({
      items: [{ mainImage: { id: 'image-1', displayOrder: 0 } }],
    });
  });

  it('sends the supported catalog filters and unwraps pagination', async () => {
    const responsePromise = firstValueFrom(
      api.listProducts({
        page: 2,
        limit: 12,
        categoryId: 'category-1',
        status: 'out_of_stock',
      }),
    );
    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${apiRoot}/products` &&
        candidate.params.get('page') === '2' &&
        candidate.params.get('limit') === '12' &&
        candidate.params.get('categoryId') === 'category-1' &&
        candidate.params.get('status') === 'out_of_stock',
    );

    request.flush({
      status: 'success',
      data: [],
      pagination: { page: 2, limit: 12, total: 13, totalPages: 2 },
    });

    await expect(responsePromise).resolves.toEqual({
      items: [],
      page: 2,
      limit: 12,
      total: 13,
      totalPages: 2,
    });
  });

  it('combines product, image, and specification endpoints for detail pages', async () => {
    const responsePromise = firstValueFrom(api.getProductById('product-1'));
    const productRequest = httpTesting.expectOne(`${apiRoot}/products/product-1`);
    const imagesRequest = httpTesting.expectOne(`${apiRoot}/products/product-1/images`);
    const specificationsRequest = httpTesting.expectOne(
      `${apiRoot}/products/product-1/specifications`,
    );

    productRequest.flush({
      status: 'success',
      data: {
        id: 'product-1',
        categoryId: 'category-1',
        categoryName: 'Portáteis',
        name: 'Computador portátil',
        description: null,
        price: 250000,
        originalPrice: null,
        badge: null,
        status: 'active',
        mainImage: {
          id: 'main-image-1',
          productId: 'product-1',
          url: 'https://example.test/product-1-main.webp',
          displayOrder: 0,
          width: 1200,
          height: 900,
          format: 'webp',
          sizeBytes: 12000,
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    imagesRequest.flush({
      status: 'success',
      data: [
        {
          id: 'image-1',
          productId: 'product-1',
          url: 'https://example.test/product-1.webp',
          displayOrder: 0,
          width: 1200,
          height: 900,
          format: 'webp',
          sizeBytes: 12000,
        },
      ],
    });
    specificationsRequest.flush({
      status: 'success',
      data: [
        {
          id: 'spec-1',
          productId: 'product-1',
          specKey: 'Memória',
          specValue: '16 GB',
          displayOrder: 0,
        },
      ],
    });

    await expect(responsePromise).resolves.toMatchObject({
      id: 'product-1',
      mainImage: { id: 'main-image-1', displayOrder: 0 },
      images: [{ id: 'image-1' }],
      specifications: [{ specKey: 'Memória', specValue: '16 GB' }],
    });
  });

  it('shares and caches the categories request', async () => {
    const firstResponse = firstValueFrom(api.listCategories());
    const request = httpTesting.expectOne(`${apiRoot}/categories`);
    request.flush({
      status: 'success',
      data: [
        {
          id: 'category-1',
          slug: 'portateis',
          label: 'Portáteis',
          icon: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    await expect(firstResponse).resolves.toHaveLength(1);
    await expect(firstValueFrom(api.listCategories())).resolves.toHaveLength(1);
    httpTesting.expectNone(`${apiRoot}/categories`);
  });
});

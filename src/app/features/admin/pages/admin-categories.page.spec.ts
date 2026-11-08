import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { ProductCategory } from '../../public/models/product.model';
import { AdminCategoryApiService } from '../data-access/admin-category-api.service';
import { IconCatalogApiService } from '../../../shared/data-access/icon-catalog-api.service';
import { AdminCategoriesPage } from './admin-categories.page';

const category: ProductCategory = {
  id: 'category-1',
  slug: 'portateis',
  label: 'Portáteis',
  icon: 'laptop',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminCategoriesPage', () => {
  it('shows categories and creates a new category through the API', async () => {
    const createdCategory: ProductCategory = {
      ...category,
      id: 'category-2',
      slug: 'acessorios',
      label: 'Acessórios',
      icon: null,
    };
    const createdInputs: unknown[] = [];
    const successMessages: string[] = [];
    const api = {
      listCategories: () => of([category]),
      createCategory: (input: unknown) => {
        createdInputs.push(input);
        return of(createdCategory);
      },
      updateCategory: () => of(category),
      deleteCategory: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AdminCategoriesPage],
      providers: [
        ...provideAppI18n(),
        { provide: AdminCategoryApiService, useValue: api },
        {
          provide: IconCatalogApiService,
          useValue: {
            listIcons: () => of([{ name: 'laptop', label: 'Portátil', keywords: ['computador'] }]),
          },
        },
        { provide: SeoService, useValue: { setPage: () => undefined } },
        {
          provide: ToastService,
          useValue: {
            success: (message: string) => successMessages.push(message),
            error: () => undefined,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminCategoriesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Portáteis');

    fixture.componentInstance.openCreateForm();
    fixture.detectChanges();
    expect(page.querySelector('[role="dialog"]')).not.toBeNull();
    expect(page.querySelector('select option[value="laptop"]')?.textContent).toContain('Portátil');
    fixture.componentInstance.form.setValue({ label: '  Acessórios  ', icon: 'laptop' });
    fixture.componentInstance.submitForm();
    fixture.detectChanges();

    expect(createdInputs).toEqual([{ label: 'Acessórios', icon: 'laptop' }]);
    expect(fixture.componentInstance.categories().map((item) => item.label)).toEqual([
      'Acessórios',
      'Portáteis',
    ]);
    expect(successMessages).toContain('Categoria criada.');
    fixture.detectChanges();
    expect(page.querySelector('[role="dialog"]')).toBeNull();
  });

  it('shows an explicit load error and allows retry', async () => {
    let requestCount = 0;
    const api = {
      listCategories: (): Observable<ProductCategory[]> => {
        requestCount += 1;
        return requestCount === 1 ? throwError(() => new Error('Request failed')) : of([category]);
      },
      createCategory: () => of(category),
      updateCategory: () => of(category),
      deleteCategory: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AdminCategoriesPage],
      providers: [
        ...provideAppI18n(),
        { provide: AdminCategoryApiService, useValue: api },
        {
          provide: IconCatalogApiService,
          useValue: { listIcons: () => of([]) },
        },
        { provide: SeoService, useValue: { setPage: () => undefined } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminCategoriesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível carregar as categorias.',
    );

    fixture.componentInstance.loadCategories();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(requestCount).toBe(2);
    expect(page.querySelector('[role="alert"]')).toBeNull();
    expect(page.textContent).toContain('Portáteis');
  });
});

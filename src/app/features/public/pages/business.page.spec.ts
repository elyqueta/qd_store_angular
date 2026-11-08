import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { SeoService } from '../../../core/seo/seo.service';
import { LocationApiService } from '../../account/data-access/location-api.service';
import { ProductApiService } from '../data-access/product-api.service';
import { ProductCategory } from '../models/product.model';
import {
  CreateQuoteRequestInput,
  QuoteRequest,
} from '../../quote-requests/models/quote-request.model';
import { QuoteRequestApiService } from '../../quote-requests/data-access/quote-request-api.service';
import { BusinessPage } from './business.page';

const categories: ProductCategory[] = [
  {
    id: 'category-1',
    slug: 'portateis',
    label: 'Portáteis',
    icon: 'laptop',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const quoteRequest: QuoteRequest = {
  id: 'quote-1',
  companyName: 'QD Tecnologia',
  nif: '123456789',
  contactName: 'Ana Silva',
  email: 'ana@example.com',
  phone: '+244 923 456 789',
  province: 'Luanda',
  municipality: 'Talatona',
  sector: 'Tecnologia',
  volume: '10 computadores',
  categories: ['Portáteis'],
  message: null,
  status: 'new',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('BusinessPage', () => {
  let createQuote: (input: CreateQuoteRequestInput) => Observable<QuoteRequest>;

  beforeEach(async () => {
    createQuote = vi.fn(() => of(quoteRequest));
    await TestBed.configureTestingModule({
      imports: [BusinessPage],
      providers: [
        ...provideAppI18n(),
        {
          provide: LocationApiService,
          useValue: {
            listProvinces: () => of([{ slug: 'luanda', name: 'Luanda' }]),
            listMunicipalities: () => of(['Belas', 'Talatona']),
          },
        },
        { provide: ProductApiService, useValue: { listCategories: () => of(categories) } },
        {
          provide: QuoteRequestApiService,
          useValue: { create: (input: CreateQuoteRequestInput) => createQuote(input) },
        },
        { provide: SeoService, useValue: { setPage: () => undefined } },
      ],
    }).compileComponents();

    await firstValueFrom(TestBed.inject(TranslocoService).load('pt'));
    TestBed.inject(TranslocoService).setActiveLang('pt');
  });

  it('submits the validated form with canonical location and category values', () => {
    createQuote = vi.fn(() => of(quoteRequest));
    const fixture = TestBed.createComponent(BusinessPage);
    const page = fixture.componentInstance;
    page.form.setValue({
      companyName: ' QD Tecnologia ',
      nif: '123456789',
      contactName: ' Ana Silva ',
      email: 'ana@example.com',
      phone: '+244 923 456 789',
      province: 'luanda',
      municipality: '',
      sector: ' Tecnologia ',
      volume: ' 10 computadores ',
      categories: ['Portáteis'],
      message: ' Proposta para o escritório ',
    });
    page.onProvinceChange();
    page.form.controls.municipality.setValue('Talatona');

    page.submitForm();
    page.submitForm();

    expect(
      Object.entries(page.form.controls)
        .filter(([, control]) => control.invalid)
        .map(([field]) => field),
    ).toEqual([]);
    page.submitForm();

    expect(createQuote).toHaveBeenCalledOnce();
    expect(createQuote).toHaveBeenCalledWith({
      companyName: 'QD Tecnologia',
      nif: '123456789',
      contactName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '+244 923 456 789',
      province: 'Luanda',
      municipality: 'Talatona',
      sector: 'Tecnologia',
      volume: '10 computadores',
      categories: ['Portáteis'],
      message: 'Proposta para o escritório',
    });
    expect(page.submitted()).toBe(true);
    fixture.destroy();
  });

  it('clears the selected municipality when the province changes', () => {
    const fixture = TestBed.createComponent(BusinessPage);
    const page = fixture.componentInstance;
    page.form.controls.province.setValue('luanda');
    page.form.controls.municipality.setValue('Talatona');

    page.onProvinceChange();

    expect(page.form.controls.municipality.value).toBe('');
    expect(page.municipalities()).toEqual(['Belas', 'Talatona']);
    fixture.destroy();
  });

  it('rejects duplicate categories in the client-side form model', () => {
    const fixture = TestBed.createComponent(BusinessPage);
    const page = fixture.componentInstance;

    page.form.controls.categories.setValue(['Portáteis', 'Portáteis']);

    expect(page.form.controls.categories.hasError('duplicate')).toBe(true);
    expect(page.form.controls.categories.invalid).toBe(true);
    fixture.destroy();
  });

  it('does not send invalid data and displays 422 field validation errors', () => {
    createQuote = vi.fn(() =>
      throwError(
        () =>
          new ApiError(422, 'Invalid input', [{ field: 'nif', message: 'Invalid NIF' }], {}, null),
      ),
    );
    const fixture = TestBed.createComponent(BusinessPage);
    const page = fixture.componentInstance;

    page.submitForm();
    expect(createQuote).not.toHaveBeenCalled();

    page.form.setValue({
      companyName: 'QD Tecnologia',
      nif: '123456789',
      contactName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '+244 923 456 789',
      province: 'luanda',
      municipality: '',
      sector: 'Tecnologia',
      volume: '10 computadores',
      categories: ['Portáteis'],
      message: '',
    });
    page.onProvinceChange();
    page.form.controls.municipality.setValue('Talatona');
    page.submitForm();

    expect(createQuote).toHaveBeenCalledOnce();
    expect(page.fieldErrors().nif).toBe(true);
    expect(page.formError()).toBe(
      TestBed.inject(TranslocoService).translate('public.business.form.errors.validation'),
    );
    fixture.destroy();
  });

  it('shows the rate-limit message without retrying the submission', () => {
    createQuote = vi.fn(() =>
      throwError(() => new ApiError(429, 'Too many requests', [], {}, null)),
    );
    const fixture = TestBed.createComponent(BusinessPage);
    const page = fixture.componentInstance;
    page.form.setValue({
      companyName: 'QD Tecnologia',
      nif: '123456789',
      contactName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '+244 923 456 789',
      province: 'luanda',
      municipality: '',
      sector: 'Tecnologia',
      volume: '10 computadores',
      categories: ['Portáteis'],
      message: '',
    });
    page.onProvinceChange();
    page.form.controls.municipality.setValue('Talatona');

    page.submitForm();

    expect(createQuote).toHaveBeenCalledOnce();
    expect(page.formError()).toBe(
      TestBed.inject(TranslocoService).translate('public.business.form.errors.rateLimit'),
    );
    fixture.destroy();
  });
});

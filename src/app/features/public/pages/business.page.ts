import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { SeoService } from '../../../core/seo/seo.service';
import { IconComponent, IconName } from '../../../shared/ui/icon.component';
import { ProductApiService } from '../data-access/product-api.service';
import { LocationApiService } from '../../account/data-access/location-api.service';
import { Province } from '../../account/models/address.model';
import { ProductCategory } from '../models/product.model';
import { CreateQuoteRequestInput } from '../../quote-requests/models/quote-request.model';
import { QuoteRequestApiService } from '../../quote-requests/data-access/quote-request-api.service';

type QuoteRequestField = keyof CreateQuoteRequestInput;

const QUOTE_REQUEST_FIELD_NAMES: Readonly<Record<string, QuoteRequestField>> = {
  companyName: 'companyName',
  nif: 'nif',
  contactName: 'contactName',
  email: 'email',
  phone: 'phone',
  province: 'province',
  municipality: 'municipality',
  sector: 'sector',
  volume: 'volume',
  categories: 'categories',
  message: 'message',
};

const CATEGORIES_VALIDATOR = (control: { value: unknown }) => {
  const selected: unknown = control.value;
  if (!Array.isArray(selected)) {
    return { invalidSelection: true };
  }
  const values = selected.filter((item: unknown): item is string => typeof item === 'string');
  if (new Set(values).size !== values.length) {
    return { duplicate: true };
  }
  return null;
};

interface BusinessBenefit {
  icon: IconName;
  titleKey: string;
  descriptionKey: string;
}

@Component({
  selector: 'qd-business-page',
  imports: [IconComponent, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './business.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly locationApi = inject(LocationApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly quoteRequestApi = inject(QuoteRequestApiService);
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private municipalitiesRequestSequence = 0;

  readonly form = this.formBuilder.group({
    companyName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    nif: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
    contactName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^(?:\+?244[\s().-]*)?[239][0-9](?:[\s().-]*[0-9]){7}$/),
      ],
    ],
    province: ['', Validators.required],
    municipality: ['', Validators.required],
    sector: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    volume: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    categories: this.formBuilder.control<string[]>(
      [],
      [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(30),
        CATEGORIES_VALIDATOR,
      ],
    ),
    message: ['', Validators.maxLength(5000)],
  });

  readonly provinces = signal<Province[]>([]);
  readonly municipalities = signal<string[]>([]);
  readonly categories = signal<ProductCategory[]>([]);
  readonly provincesLoading = signal(true);
  readonly municipalitiesLoading = signal(false);
  readonly categoriesLoading = signal(true);
  readonly provincesError = signal(false);
  readonly municipalitiesError = signal(false);
  readonly categoriesError = signal(false);
  readonly formError = signal<string | null>(null);
  readonly fieldErrors = signal<Partial<Record<QuoteRequestField, true>>>({});
  readonly submitting = signal(false);
  readonly submitted = signal(false);

  readonly whatsappUrl =
    'https://wa.me/244923000000?text=Ol%C3%A1%2C%20quero%20informa%C3%A7%C3%B5es%20para%20empresas';
  readonly benefits: readonly BusinessBenefit[] = [
    {
      icon: 'credit-card',
      titleKey: 'public.business.benefits.invoice.title',
      descriptionKey: 'public.business.benefits.invoice.description',
    },
    {
      icon: 'user',
      titleKey: 'public.business.benefits.manager.title',
      descriptionKey: 'public.business.benefits.manager.description',
    },
    {
      icon: 'circle-check',
      titleKey: 'public.business.benefits.pricing.title',
      descriptionKey: 'public.business.benefits.pricing.description',
    },
    {
      icon: 'shield',
      titleKey: 'public.business.benefits.support.title',
      descriptionKey: 'public.business.benefits.support.description',
    },
    {
      icon: 'whatsapp',
      titleKey: 'public.business.benefits.whatsapp.title',
      descriptionKey: 'public.business.benefits.whatsapp.description',
    },
    {
      icon: 'box',
      titleKey: 'public.business.benefits.delivery.title',
      descriptionKey: 'public.business.benefits.delivery.description',
    },
  ];

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('seo.business.title'),
      description: this.transloco.translate('seo.business.description'),
      canonicalPath: '/empresas',
    });
    this.loadProvinces();
    this.loadCategories();
  }

  loadProvinces(): void {
    this.provincesLoading.set(true);
    this.provincesError.set(false);
    this.locationApi
      .listProvinces()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.provincesLoading.set(false)),
      )
      .subscribe({
        next: (provinces) => this.provinces.set(provinces),
        error: () => this.provincesError.set(true),
      });
  }

  loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoriesError.set(false);
    this.productApi
      .listCategories()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.categoriesLoading.set(false)),
      )
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => this.categoriesError.set(true),
      });
  }

  onProvinceChange(): void {
    this.municipalitiesRequestSequence += 1;
    const provinceSlug = this.form.controls.province.value;
    this.form.controls.municipality.setValue('');
    this.municipalities.set([]);
    this.municipalitiesError.set(false);
    this.formError.set(null);

    if (provinceSlug) {
      this.loadMunicipalities(provinceSlug);
    }
  }

  loadMunicipalities(provinceSlug = this.form.controls.province.value): void {
    if (!provinceSlug) {
      return;
    }

    const requestSequence = ++this.municipalitiesRequestSequence;
    this.municipalitiesLoading.set(true);
    this.municipalitiesError.set(false);
    this.locationApi
      .listMunicipalities(provinceSlug)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (requestSequence === this.municipalitiesRequestSequence) {
            this.municipalitiesLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: (municipalities) => {
          if (
            requestSequence === this.municipalitiesRequestSequence &&
            this.form.controls.province.value === provinceSlug
          ) {
            this.municipalities.set(municipalities);
          }
        },
        error: () => {
          if (requestSequence === this.municipalitiesRequestSequence) {
            this.municipalitiesError.set(true);
          }
        },
      });
  }

  toggleCategory(label: string, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const selected = this.form.controls.categories.value;
    this.form.controls.categories.setValue(
      target.checked
        ? selected.includes(label)
          ? selected
          : [...selected, label]
        : selected.filter((item) => item !== label),
    );
    this.form.controls.categories.markAsTouched();
  }

  hasFieldError(field: QuoteRequestField): boolean {
    return !!this.fieldErrors()[field] || this.form.controls[field].invalid;
  }

  fieldErrorKey(field: QuoteRequestField): string {
    return this.fieldErrors()[field]
      ? 'public.business.form.serverFieldError'
      : `public.business.form.validation.${field}`;
  }

  submitForm(): void {
    if (
      this.form.invalid ||
      this.submitting() ||
      this.submitted() ||
      this.provincesLoading() ||
      this.categoriesLoading() ||
      this.provincesError() ||
      this.categoriesError()
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const province = this.provinces().find((item) => item.slug === values.province);
    if (!province || !this.municipalities().includes(values.municipality)) {
      this.fieldErrors.set({ province: true, municipality: true });
      this.formError.set(this.transloco.translate('public.business.form.validation.location'));
      return;
    }

    const input: CreateQuoteRequestInput = {
      companyName: values.companyName.trim(),
      nif: values.nif.trim(),
      contactName: values.contactName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      province: province.name,
      municipality: values.municipality,
      sector: values.sector.trim(),
      volume: values.volume.trim(),
      categories: values.categories,
      ...(values.message.trim() ? { message: values.message.trim() } : {}),
    };

    this.submitting.set(true);
    this.formError.set(null);
    this.fieldErrors.set({});
    this.quoteRequestApi
      .create(input)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: () => this.submitted.set(true),
        error: (error: unknown) => this.handleSubmitError(error),
      });
  }

  private handleSubmitError(error: unknown): void {
    if (!(error instanceof ApiError)) {
      this.formError.set(this.transloco.translate('public.business.form.errors.network'));
      return;
    }

    if (error.status === 429) {
      this.formError.set(this.transloco.translate('public.business.form.errors.rateLimit'));
      return;
    }

    if (error.status === 422) {
      const fieldErrors: Partial<Record<QuoteRequestField, true>> = {};
      for (const detail of error.details) {
        const fieldName = detail.field.split('.')[0].split('[')[0];
        const field = QUOTE_REQUEST_FIELD_NAMES[fieldName];
        if (field) {
          fieldErrors[field] = true;
          this.form.controls[field].markAsTouched();
        }
      }
      this.fieldErrors.set(fieldErrors);
      this.formError.set(this.transloco.translate('public.business.form.errors.validation'));
      return;
    }

    this.formError.set(this.transloco.translate('public.business.form.errors.network'));
  }
}

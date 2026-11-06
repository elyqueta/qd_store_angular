import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SeoService } from '../../../core/seo/seo.service';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { DeliveryTypeApiService } from '../data-access/delivery-type-api.service';
import { DeliveryType } from '../models/delivery-type.model';
import { DeliveryTypesPage } from './delivery-types.page';

const deliveryTypes: DeliveryType[] = [
  {
    id: 'delivery-express',
    name: 'Entrega expresso',
    description: 'Entrega prioritária.',
    price: 5000,
    type: 'express',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'delivery-standard',
    name: 'Entrega padrão',
    description: null,
    price: 2500,
    type: 'standard',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('DeliveryTypesPage', () => {
  it('shows active delivery types sorted by name with their descriptions and prices', async () => {
    const listActive = vi.fn(() => of(deliveryTypes));
    await TestBed.configureTestingModule({
      imports: [DeliveryTypesPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: DeliveryTypeApiService, useValue: { listActive } },
        { provide: SeoService, useValue: { setPage: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DeliveryTypesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(listActive).toHaveBeenCalledOnce();
    expect(page.textContent).toContain('Entrega expresso');
    expect(page.textContent).toContain('Entrega padrão');
    expect(page.textContent).toContain('Entrega prioritária.');
    expect(page.textContent).toContain('5,000 Kz');
    expect(page.querySelectorAll('li')).toHaveLength(2);
    expect(page.querySelectorAll('li h3')[0]?.textContent?.trim()).toBe('Entrega expresso');
  });

  it('shows an empty state when no active delivery types exist', async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryTypesPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: DeliveryTypeApiService, useValue: { listActive: () => of([]) } },
        { provide: SeoService, useValue: { setPage: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DeliveryTypesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Não existem opções de entrega disponíveis neste momento.',
    );
  });

  it('shows a loading error and retries the request', async () => {
    const listActive = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('network error')))
      .mockReturnValueOnce(of(deliveryTypes));
    await TestBed.configureTestingModule({
      imports: [DeliveryTypesPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: DeliveryTypeApiService, useValue: { listActive } },
        { provide: SeoService, useValue: { setPage: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DeliveryTypesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Não foi possível carregar as opções de entrega.');
    (page.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listActive).toHaveBeenCalledTimes(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Entrega expresso');
  });
});

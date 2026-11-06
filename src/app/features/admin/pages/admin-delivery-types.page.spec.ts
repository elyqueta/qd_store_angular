import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { AdminDeliveryTypeApiService } from '../data-access/admin-delivery-type-api.service';
import { AdminDeliveryType } from '../models/admin-dashboard.model';
import { AdminDeliveryTypesPage } from './admin-delivery-types.page';

const deliveryType: AdminDeliveryType = {
  id: 'delivery-1',
  name: 'Entrega padrão',
  description: 'Entrega normal',
  price: 2500,
  type: 'standard',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminDeliveryTypesPage', () => {
  it('creates a delivery type and inserts it in sorted order', async () => {
    const createInputs: unknown[] = [];
    const successMessages: string[] = [];
    const secondDeliveryType: AdminDeliveryType = {
      ...deliveryType,
      id: 'delivery-2',
      name: 'Entrega expresso',
      description: null,
      type: 'express',
    };
    const api = {
      listActive: () => of([deliveryType]),
      create: (input: unknown) => {
        createInputs.push(input);
        return of(secondDeliveryType);
      },
      update: () => of(deliveryType),
      deactivate: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AdminDeliveryTypesPage],
      providers: [
        ...provideAppI18n(),
        { provide: AdminDeliveryTypeApiService, useValue: api },
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

    const fixture = TestBed.createComponent(AdminDeliveryTypesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Entrega padrão');

    fixture.componentInstance.openCreateForm();
    fixture.componentInstance.form.setValue({
      name: ' Entrega expresso ',
      description: ' ',
      price: 4000,
      type: 'express',
    });
    fixture.componentInstance.submitForm();

    expect(createInputs).toEqual([{ name: 'Entrega expresso', price: 4000, type: 'express' }]);
    expect(fixture.componentInstance.deliveryTypes().map((item) => item.name)).toEqual([
      'Entrega expresso',
      'Entrega padrão',
    ]);
    expect(successMessages).toContain('Tipo de entrega criado.');
  });

  it('clears descriptions with null when editing and deactivates a type from the list', async () => {
    const updateInputs: unknown[] = [];
    const deactivatedIds: string[] = [];
    const api = {
      listActive: (): Observable<AdminDeliveryType[]> => of([deliveryType]),
      create: () => of(deliveryType),
      update: (id: string, input: unknown) => {
        updateInputs.push({ id, input });
        return of({ ...deliveryType, description: null });
      },
      deactivate: (id: string) => {
        deactivatedIds.push(id);
        return of(undefined);
      },
    };

    await TestBed.configureTestingModule({
      imports: [AdminDeliveryTypesPage],
      providers: [
        ...provideAppI18n(),
        { provide: AdminDeliveryTypeApiService, useValue: api },
        { provide: SeoService, useValue: { setPage: () => undefined } },
        { provide: ToastService, useValue: { success: () => undefined, error: () => undefined } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminDeliveryTypesPage);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.openEditForm(deliveryType);
    fixture.componentInstance.form.controls.description.setValue('');
    fixture.componentInstance.submitForm();
    expect(updateInputs).toEqual([{ id: 'delivery-1', input: { description: null } }]);

    fixture.componentInstance.requestDeactivation(deliveryType);
    fixture.componentInstance.confirmDeactivation(deliveryType);
    expect(deactivatedIds).toEqual(['delivery-1']);
    expect(fixture.componentInstance.deliveryTypes()).toEqual([]);
  });
});

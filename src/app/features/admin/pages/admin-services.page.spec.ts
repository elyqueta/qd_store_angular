import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { IconCatalogApiService } from '../../../shared/data-access/icon-catalog-api.service';
import { AdminServiceApiService } from '../data-access/admin-service-api.service';
import { AdminService } from '../models/admin-service.model';
import { AdminServicesPage } from './admin-services.page';

const service: AdminService = {
  id: 'service-1',
  name: 'Assistência técnica',
  description: 'Apoio técnico especializado.',
  icon: 'screwdriver-wrench',
  imageUrl: null,
  startsFromPrice: 5000,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AdminServicesPage', () => {
  it('creates a service using the icon catalog and sends the selected image', async () => {
    const createInputs: unknown[] = [];
    const successMessages: string[] = [];
    const api = {
      listAll: () => of([service]),
      create: (input: unknown) => {
        createInputs.push(input);
        return of({ ...service, id: 'service-2', name: 'Instalação' });
      },
      update: () => of(service),
      deactivate: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AdminServicesPage],
      providers: [
        ...provideAppI18n(),
        { provide: AdminServiceApiService, useValue: api },
        {
          provide: IconCatalogApiService,
          useValue: {
            listIcons: () =>
              of([{ name: 'screwdriver-wrench', label: 'Ferramentas', keywords: ['reparação'] }]),
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

    const fixture = TestBed.createComponent(AdminServicesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.openCreateForm();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    fixture.componentInstance.form.setValue({
      name: ' Instalação ',
      description: ' Configuração no local ',
      icon: 'screwdriver-wrench',
      startsFromPrice: 0,
    });
    const image = new File(['image'], 'instalacao.png', { type: 'image/png' });
    fixture.componentInstance.selectedImage.set(image);
    fixture.componentInstance.submitForm();

    expect(createInputs).toEqual([
      {
        name: 'Instalação',
        icon: 'screwdriver-wrench',
        isActive: true,
        description: 'Configuração no local',
        startsFromPrice: 0,
        image,
      },
    ]);
    expect(fixture.componentInstance.services().map((item) => item.name)).toEqual([
      'Assistência técnica',
      'Instalação',
    ]);
    expect(successMessages).toContain('Serviço criado.');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();

    fixture.componentInstance.openCreateForm();
    fixture.componentInstance.form.setValue({
      name: 'Montagem',
      description: '',
      icon: 'screwdriver-wrench',
      startsFromPrice: null,
    });
    fixture.componentInstance.submitForm();

    expect(createInputs[1]).toEqual({
      name: 'Montagem',
      icon: 'screwdriver-wrench',
      isActive: true,
    });
  });

  it('reactivates an inactive service and deactivates an active service', async () => {
    const updates: Array<{ id: string; input: unknown }> = [];
    const deactivatedIds: string[] = [];
    const inactiveService = { ...service, isActive: false };
    const api = {
      listAll: () => of([service, inactiveService]),
      create: () => of(service),
      update: (id: string, input: unknown) => {
        updates.push({ id, input });
        return of({ ...inactiveService, isActive: true });
      },
      deactivate: (id: string) => {
        deactivatedIds.push(id);
        return of(undefined);
      },
    };

    await TestBed.configureTestingModule({
      imports: [AdminServicesPage],
      providers: [
        ...provideAppI18n(),
        { provide: AdminServiceApiService, useValue: api },
        { provide: IconCatalogApiService, useValue: { listIcons: () => of([]) } },
        { provide: SeoService, useValue: { setPage: () => undefined } },
        { provide: ToastService, useValue: { success: () => undefined, error: () => undefined } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminServicesPage);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.activate(inactiveService);
    expect(updates).toEqual([{ id: service.id, input: { isActive: true } }]);
    expect(
      fixture.componentInstance.services().find((item) => item.id === service.id)?.isActive,
    ).toBe(true);

    fixture.componentInstance.confirmDeactivation(service);
    expect(deactivatedIds).toEqual([service.id]);
    expect(
      fixture.componentInstance.services().find((item) => item.id === service.id)?.isActive,
    ).toBe(false);
  });
});

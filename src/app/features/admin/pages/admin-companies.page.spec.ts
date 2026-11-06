import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { AdminCompanyApiService } from '../data-access/admin-company-api.service';
import { AdminCompanyWithUsers } from '../models/admin-dashboard.model';
import { AdminCompaniesPage } from './admin-companies.page';

const company: AdminCompanyWithUsers = {
  id: 'company-1',
  ownerId: 'owner-1',
  name: 'QD Tecnologia',
  nif: '123456789',
  sector: 'Tecnologia',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  users: [
    {
      id: 'owner-1',
      fullName: 'Utilizador Proprietário',
      email: 'owner@example.com',
      companyRole: 'Proprietário',
    },
  ],
};

describe('AdminCompaniesPage', () => {
  it('shows company members and submits only changed company fields', async () => {
    const updates: Array<{ id: string; input: unknown }> = [];
    const successMessages: string[] = [];
    const api = {
      list: () => of([company]),
      update: (id: string, input: unknown) => {
        updates.push({ id, input });
        return of({
          id: company.id,
          ownerId: company.ownerId,
          name: 'QD Store',
          nif: company.nif,
          sector: null,
          status: company.status,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
        });
      },
      deactivate: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AdminCompaniesPage],
      providers: [
        ...provideAppI18n(),
        { provide: AdminCompanyApiService, useValue: api },
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

    const fixture = TestBed.createComponent(AdminCompaniesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('owner@example.com');

    fixture.componentInstance.openEditForm(company);
    fixture.componentInstance.form.setValue({ name: ' QD Store ', sector: '' });
    fixture.componentInstance.submitForm();

    expect(updates).toEqual([{ id: 'company-1', input: { name: 'QD Store', sector: null } }]);
    expect(fixture.componentInstance.companies()[0].name).toBe('QD Store');
    expect(fixture.componentInstance.companies()[0].users).toEqual(company.users);
    expect(successMessages).toContain('Empresa actualizada.');
  });

  it('deactivates a company and updates its visible status without removing its record', async () => {
    const deactivatedIds: string[] = [];
    const api = {
      list: (): Observable<AdminCompanyWithUsers[]> => of([company]),
      update: () => of(company),
      deactivate: (id: string) => {
        deactivatedIds.push(id);
        return of(undefined);
      },
    };

    await TestBed.configureTestingModule({
      imports: [AdminCompaniesPage],
      providers: [
        ...provideAppI18n(),
        { provide: AdminCompanyApiService, useValue: api },
        { provide: SeoService, useValue: { setPage: () => undefined } },
        { provide: ToastService, useValue: { success: () => undefined, error: () => undefined } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminCompaniesPage);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.requestDeactivation(company);
    fixture.componentInstance.confirmDeactivation(company);

    expect(deactivatedIds).toEqual(['company-1']);
    expect(fixture.componentInstance.companies()[0].status).toBe('inactive');
  });
});

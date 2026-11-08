import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { ApiError } from '../../../core/http/api-error.model';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { ToastService } from '../../../core/notifications/toast.service';
import { CompanyApiService } from '../data-access/company-api.service';
import { CompanyWithUsers } from '../models/company.model';
import { CompanyListPage } from './company-list.page';

const company: CompanyWithUsers = {
  id: 'company-1',
  ownerId: 'user-1',
  name: 'QD Tecnologia',
  nif: '005123456LA042',
  sector: 'Tecnologia',
  status: 'inactive',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  users: [
    {
      id: 'user-2',
      fullName: 'Maria Fernandes',
      email: 'maria@example.test',
      companyRole: 'Gerente',
    },
  ],
};

describe('CompanyListPage', () => {
  it('shows companies, their API-provided members, and inactive status', async () => {
    const listMine = vi.fn(() => of([company]));
    await TestBed.configureTestingModule({
      imports: [CompanyListPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: CompanyApiService, useValue: { listMine } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CompanyListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(listMine).toHaveBeenCalledOnce();
    expect(text).toContain('QD Tecnologia');
    expect(text).toContain('Maria Fernandes');
    expect(text).toContain('maria@example.test');
    expect(text).toContain('Gerente');
    expect(text).toContain('Inactiva');
  });

  it('shows an empty state when the API returns no companies', async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyListPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: CompanyApiService, useValue: { listMine: () => of([]) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CompanyListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Ainda não tens empresas associadas à tua conta.',
    );
  });

  it('shows API errors and retries the list request', async () => {
    const listMine = vi
      .fn()
      .mockReturnValueOnce(
        throwError(() => new ApiError(503, 'Serviço indisponível', [], null, null)),
      )
      .mockReturnValueOnce(of([company]));
    await TestBed.configureTestingModule({
      imports: [CompanyListPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: CompanyApiService, useValue: { listMine } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CompanyListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Serviço indisponível');
    const retryButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listMine).toHaveBeenCalledTimes(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('QD Tecnologia');
  });

  it('lets only an owner or admin associate a member by email and optional role', async () => {
    const associateUser = vi.fn(() =>
      of({
        userId: 'user-3',
        companyId: company.id,
        role: 'Gerente',
        createdAt: '2026-01-02T00:00:00.000Z',
      }),
    );
    const listMine = vi.fn(() => of([company]));
    const success = vi.fn();

    await TestBed.configureTestingModule({
      imports: [CompanyListPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: CompanyApiService, useValue: { listMine, associateUser } },
        {
          provide: AuthStore,
          useValue: { user: () => ({ id: company.ownerId, role: 'customer' }) },
        },
        { provide: ToastService, useValue: { success, error: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CompanyListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Associar membro');
    fixture.componentInstance.openAssociationForm(company);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    fixture.componentInstance.associationForm.setValue({
      email: 'MARIA@example.test',
      role: ' Gerente ',
    });
    fixture.componentInstance.submitAssociation();

    expect(associateUser).toHaveBeenCalledOnce();
    expect(associateUser).toHaveBeenCalledWith(company.id, {
      email: 'maria@example.test',
      role: 'Gerente',
    });
    expect(success).toHaveBeenCalledWith('Membro associado à empresa.');
    expect(listMine).toHaveBeenCalledTimes(2);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('shows a clear duplicate-association error from the API', async () => {
    const associateUser = vi.fn(() =>
      throwError(
        () =>
          new ApiError(409, 'Este utilizador já está associado a esta empresa.', [], null, null),
      ),
    );

    await TestBed.configureTestingModule({
      imports: [CompanyListPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: CompanyApiService, useValue: { listMine: () => of([company]), associateUser } },
        {
          provide: AuthStore,
          useValue: { user: () => ({ id: company.ownerId, role: 'customer' }) },
        },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CompanyListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.openAssociationForm(company);
    fixture.detectChanges();
    fixture.componentInstance.associationForm.setValue({ email: 'maria@example.test', role: '' });
    fixture.componentInstance.submitAssociation();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(fixture.componentInstance.associationError()).toBe(
      'Este utilizador já está associado a esta empresa.',
    );
  });

  it('validates the email before sending an association request', async () => {
    const associateUser = vi.fn();

    await TestBed.configureTestingModule({
      imports: [CompanyListPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: CompanyApiService, useValue: { listMine: () => of([company]), associateUser } },
        {
          provide: AuthStore,
          useValue: { user: () => ({ id: company.ownerId, role: 'customer' }) },
        },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CompanyListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.openAssociationForm(company);
    fixture.componentInstance.associationForm.setValue({ email: 'email-invalido', role: '' });
    fixture.componentInstance.submitAssociation();
    fixture.detectChanges();

    expect(associateUser).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Indica um endereço de e-mail válido.',
    );
  });

  it('does not expose member association controls to a non-owner customer', async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyListPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: CompanyApiService, useValue: { listMine: () => of([company]) } },
        { provide: AuthStore, useValue: { user: () => ({ id: 'user-2', role: 'customer' }) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CompanyListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Associar membro');
  });
});

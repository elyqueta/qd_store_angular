import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
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
});

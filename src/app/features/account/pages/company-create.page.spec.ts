import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { CompanyApiService } from '../data-access/company-api.service';
import { CreateCompanyInput } from '../models/company.model';
import { CompanyCreatePage } from './company-create.page';

const company = {
  id: 'company-1',
  ownerId: 'user-1',
  name: 'QD Tecnologia',
  nif: '005123456LA042',
  sector: 'Tecnologia',
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('CompanyCreatePage', () => {
  let createCompany: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createCompany = vi.fn((_input: CreateCompanyInput) => of(company));
    await TestBed.configureTestingModule({
      imports: [CompanyCreatePage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: CompanyApiService, useValue: { createCompany } },
      ],
    }).compileComponents();
  });

  it('creates a company using trimmed values and displays the returned company', async () => {
    const fixture = TestBed.createComponent(CompanyCreatePage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    fixture.componentInstance.form.setValue({
      name: '  QD Tecnologia  ',
      nif: '  005123456LA042  ',
      sector: '  Tecnologia  ',
    });
    fixture.componentInstance.submitForm();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(createCompany).toHaveBeenCalledWith({
      name: 'QD Tecnologia',
      nif: '005123456LA042',
      sector: 'Tecnologia',
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('QD Tecnologia');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('does not send an invalid company form', async () => {
    const fixture = TestBed.createComponent(CompanyCreatePage);
    fixture.detectChanges();

    fixture.componentInstance.submitForm();
    fixture.detectChanges();

    expect(createCompany).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.name.touched).toBe(true);
    expect(fixture.componentInstance.form.controls.nif.touched).toBe(true);
  });
});

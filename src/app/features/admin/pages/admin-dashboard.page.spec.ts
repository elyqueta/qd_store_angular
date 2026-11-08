import { TestBed } from '@angular/core/testing';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { AdminDashboardApiService } from '../data-access/admin-dashboard-api.service';
import { AdminDashboardSummary } from '../models/admin-dashboard.model';
import { AdminDashboardPage } from './admin-dashboard.page';
import { Observable, of, Subject, throwError } from 'rxjs';

const summary: AdminDashboardSummary = {
  products: 17,
  categories: 2,
  deliveryTypes: 1,
  companies: 2,
};

describe('AdminDashboardPage', () => {
  it('shows skeleton metric cards while the dashboard request is pending', async () => {
    const response = new Subject<AdminDashboardSummary>();
    await TestBed.configureTestingModule({
      imports: [AdminDashboardPage],
      providers: [
        ...provideAppI18n(),
        { provide: AdminDashboardApiService, useValue: { getSummary: () => response.asObservable() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminDashboardPage);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const loadingStatus = page.querySelector('[role="status"]');
    expect(loadingStatus?.getAttribute('aria-busy')).toBe('true');
    expect(loadingStatus?.querySelectorAll('.animate-pulse')).toHaveLength(8);

    response.next(summary);
    response.complete();
    fixture.detectChanges();

    expect(page.querySelector('[role="status"]')).toBeNull();
    expect(page.textContent).toContain('17');
  });

  it('shows the metrics returned by the API', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardPage],
      providers: [
        ...provideAppI18n(),
        { provide: AdminDashboardApiService, useValue: { getSummary: () => of(summary) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminDashboardPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Painel de administração');
    expect(page.textContent).toContain('17');
    expect(page.textContent).toContain('2');
    expect(page.textContent).toContain('Tipos de entrega activos');
  });

  it('shows an explicit error and allows retry when the API fails', async () => {
    let requestCount = 0;
    const api = {
      getSummary: (): Observable<AdminDashboardSummary> => {
        requestCount += 1;
        return requestCount === 1 ? throwError(() => new Error('Request failed')) : of(summary);
      },
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboardPage],
      providers: [...provideAppI18n(), { provide: AdminDashboardApiService, useValue: api }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminDashboardPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível carregar o painel.',
    );

    const retryButton = page.querySelector('button');
    expect(retryButton).not.toBeNull();
    retryButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(requestCount).toBe(2);
    expect(page.querySelector('[role="alert"]')).toBeNull();
    expect(page.textContent).toContain('17');
  });
});

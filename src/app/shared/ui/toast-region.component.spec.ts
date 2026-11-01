import { TestBed } from '@angular/core/testing';
import { provideAppI18n } from '../../core/i18n/i18n.providers';
import { ToastService } from '../../core/notifications/toast.service';
import { ToastRegionComponent } from './toast-region.component';

describe('ToastRegionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastRegionComponent],
      providers: [...provideAppI18n()],
    }).compileComponents();
  });

  it('announces errors assertively and allows keyboard-accessible dismissal', async () => {
    const fixture = TestBed.createComponent(ToastRegionComponent);
    const toast = TestBed.inject(ToastService);
    toast.error('A sessão expirou.');

    fixture.detectChanges();
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement | null;
    expect(alert).toBeTruthy();
    expect(alert?.getAttribute('aria-live')).toBe('assertive');
    expect(alert?.textContent).toContain('A sessão expirou.');

    const closeButton = alert?.querySelector('button') as HTMLButtonElement | null;
    expect(closeButton?.getAttribute('aria-label')).toBe('Fechar');
    closeButton?.click();
    fixture.detectChanges();

    expect(toast.messages()).toHaveLength(0);
  });
});

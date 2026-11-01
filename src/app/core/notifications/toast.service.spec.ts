import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates typed notifications and dismisses a notification manually', () => {
    const toast = TestBed.inject(ToastService);

    toast.success('Guardado.');
    toast.error('Falhou.');
    toast.warning('Atenção.');

    expect(toast.messages()).toEqual([
      { id: 1, kind: 'success', message: 'Guardado.' },
      { id: 2, kind: 'error', message: 'Falhou.' },
      { id: 3, kind: 'warning', message: 'Atenção.' },
    ]);

    toast.dismiss(2);
    expect(toast.messages().map((message) => message.id)).toEqual([1, 3]);
  });

  it('dismisses notifications automatically after five seconds', () => {
    const toast = TestBed.inject(ToastService);
    toast.success('Guardado.');

    vi.advanceTimersByTime(4999);
    expect(toast.messages()).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(toast.messages()).toHaveLength(0);
  });
});

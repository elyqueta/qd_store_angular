import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { I18nService } from './i18n.service';
import { provideAppI18n } from './i18n.providers';

describe('I18nService', () => {
  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      providers: [I18nService, ...provideAppI18n()],
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = 'pt';
  });

  it('initialises Portuguese and reflects it in the document language', () => {
    TestBed.inject(I18nService);
    TestBed.tick();

    expect(document.documentElement.lang).toBe('pt');
    expect(window.localStorage.getItem('qd.lang')).toBeNull();
  });

  it('loads the global Portuguese translations', async () => {
    const i18n = TestBed.inject(I18nService);
    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load('pt'));

    expect(transloco.translate('common.retry')).toBe('Tentar novamente');
    i18n.setLanguage('pt');
    TestBed.tick();
    expect(window.localStorage.getItem('qd.lang')).toBe('pt');
  });
});

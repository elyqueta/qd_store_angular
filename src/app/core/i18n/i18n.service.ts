import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

const LANGUAGE_STORAGE_KEY = 'qd.lang';
const DEFAULT_LANGUAGE = 'pt';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly transloco = inject(TranslocoService);

  constructor() {
    const language = this.isBrowser ? this.readLanguage() : DEFAULT_LANGUAGE;
    this.activateLanguage(language);
  }

  setLanguage(language: 'pt'): void {
    this.activateLanguage(language);

    if (!this.isBrowser) {
      return;
    }

    try {
      this.document.defaultView?.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error: unknown) {
      console.error('Não foi possível guardar o idioma seleccionado.', error);
    }
  }

  private readLanguage(): 'pt' {
    try {
      const savedLanguage = this.document.defaultView?.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return savedLanguage === 'pt' ? savedLanguage : DEFAULT_LANGUAGE;
    } catch (error: unknown) {
      console.error('Não foi possível ler o idioma guardado.', error);
      return DEFAULT_LANGUAGE;
    }
  }

  private activateLanguage(language: 'pt'): void {
    this.transloco.setActiveLang(language);
    this.document.documentElement.setAttribute('lang', language);
  }
}

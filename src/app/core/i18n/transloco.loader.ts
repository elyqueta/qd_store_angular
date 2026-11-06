import { Injectable } from '@angular/core';
import { TranslocoLoader, Translation } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import account from '../../../assets/i18n/pt/account.json';
import admin from '../../../assets/i18n/pt/admin.json';
import auth from '../../../assets/i18n/pt/auth.json';
import commerce from '../../../assets/i18n/pt/commerce.json';
import publicTranslations from '../../../assets/i18n/pt/public.json';
import seo from '../../../assets/i18n/pt/seo.json';
import shared from '../../../assets/i18n/pt/shared.json';

@Injectable()
export class AppTranslocoLoader implements TranslocoLoader {
  private readonly portuguese: Translation = {
    ...shared,
    ...auth,
    ...account,
    ...commerce,
    ...admin,
    ...seo,
    ...publicTranslations,
  };

  getTranslation(lang: string): Observable<Translation> {
    if (lang !== 'pt') {
      throw new Error(`Não existe um ficheiro de traduções para o idioma "${lang}".`);
    }

    return of(this.portuguese);
  }
}

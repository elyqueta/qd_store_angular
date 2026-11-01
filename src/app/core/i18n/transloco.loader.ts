import { Injectable } from '@angular/core';
import { TranslocoLoader, Translation } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import portuguese from '../../../assets/i18n/pt.json';

@Injectable()
export class AppTranslocoLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> {
    if (lang !== 'pt') {
      throw new Error(`Não existe um ficheiro de traduções para o idioma "${lang}".`);
    }

    return of(portuguese);
  }
}

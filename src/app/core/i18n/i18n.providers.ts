import { isDevMode } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { AppTranslocoLoader } from './transloco.loader';

export function provideAppI18n() {
  return provideTransloco({
    config: {
      availableLangs: ['pt'],
      defaultLang: 'pt',
      fallbackLang: 'pt',
      prodMode: !isDevMode(),
      reRenderOnLangChange: true,
    },
    loader: AppTranslocoLoader,
  });
}

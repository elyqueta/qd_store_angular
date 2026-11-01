import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'qd.theme';
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly preferenceState = signal<ThemePreference>('system');
  private readonly systemPrefersDark = signal(false);

  readonly preference = this.preferenceState.asReadonly();
  readonly effective = computed<EffectiveTheme>(() => {
    const preference = this.preference();
    if (preference === 'system') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }

    return preference;
  });

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    this.preferenceState.set(this.readPreference());
    this.watchSystemPreference();

    effect(() => {
      this.applyTheme(this.effective());
      this.persistPreference(this.preference());
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preferenceState.set(preference);
  }

  private readPreference(): ThemePreference {
    try {
      const value = this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY);
      return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
    } catch (error: unknown) {
      console.error('Não foi possível ler a preferência de tema guardada.', error);
      return 'system';
    }
  }

  private persistPreference(preference: ThemePreference): void {
    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch (error: unknown) {
      console.error('Não foi possível guardar a preferência de tema.', error);
    }
  }

  private watchSystemPreference(): void {
    const window = this.document.defaultView;
    if (!window || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia(DARK_MODE_QUERY);
    const updatePreference = (event: MediaQueryListEvent): void => {
      this.systemPrefersDark.set(event.matches);
    };

    this.systemPrefersDark.set(mediaQuery.matches);
    mediaQuery.addEventListener('change', updatePreference);
    this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', updatePreference));
  }

  private applyTheme(theme: EffectiveTheme): void {
    this.document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

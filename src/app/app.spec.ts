import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideAppI18n } from './core/i18n/i18n.providers';
import { ThemeService } from './core/theme/theme.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [...provideAppI18n()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});

describe('ThemeService', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('uses the system preference by default and applies an explicit choice', () => {
    const theme = TestBed.inject(ThemeService);
    TestBed.tick();

    expect(theme.preference()).toBe('system');
    expect(theme.effective()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    theme.setPreference('dark');
    TestBed.tick();

    expect(theme.effective()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem('qd.theme')).toBe('dark');
  });

  it('restores a saved theme preference', () => {
    window.localStorage.setItem('qd.theme', 'dark');

    const theme = TestBed.inject(ThemeService);
    TestBed.tick();

    expect(theme.preference()).toBe('dark');
    expect(theme.effective()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});

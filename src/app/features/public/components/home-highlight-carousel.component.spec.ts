import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { Highlight } from '../models/highlight.model';
import { HomeHighlightCarouselComponent } from './home-highlight-carousel.component';

const highlights: Highlight[] = [
  {
    id: 'hero-1',
    placement: 'hero',
    displayOrder: 1,
    title: 'Destaque de teste 1',
    subtitle: 'Primeiro destaque.',
    label: 'Novidade',
    ctaLabel: 'Explorar',
    ctaUrl: '/produtos',
    imageUrl: null,
    theme: 'dark',
  },
  {
    id: 'hero-2',
    placement: 'hero',
    displayOrder: 2,
    title: 'Destaque de teste 2',
    subtitle: 'Segundo destaque.',
    label: null,
    ctaLabel: null,
    ctaUrl: 'https://example.com/oferta',
    imageUrl: null,
    theme: 'light',
  },
];

describe('HomeHighlightCarouselComponent', () => {
  const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeHighlightCarouselComponent],
      providers: [...provideAppI18n(), provideRouter([])],
    }).compileComponents();

    await firstValueFrom(TestBed.inject(TranslocoService).load('pt'));
    TestBed.inject(TranslocoService).setActiveLang('pt');
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
  });

  function createHeroCarousel(): ComponentFixture<HomeHighlightCarouselComponent> {
    const fixture = TestBed.createComponent(HomeHighlightCarouselComponent);
    fixture.componentRef.setInput('variant', 'hero');
    fixture.componentRef.setInput('highlights', highlights);
    fixture.componentRef.setInput('label', 'Destaques principais');
    fixture.detectChanges();
    return fixture;
  }

  it('navigates between configured hero slides and validates CTA destinations', () => {
    const fixture = createHeroCarousel();
    const carousel = fixture.componentInstance;

    expect(carousel.activeIndex()).toBe(0);
    carousel.next();
    fixture.detectChanges();
    expect(carousel.activeIndex()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Destaque de teste 2');
    expect(carousel.safeCtaUrl('javascript:alert(1)')).toBeNull();
    expect(carousel.safeCtaUrl('//malicious.example')).toBeNull();
    expect(carousel.safeCtaUrl('https://example.com/oferta')).toBe('https://example.com/oferta');

    fixture.destroy();
  });

  it('automatically advances the hero carousel every seven seconds', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
    vi.useFakeTimers();

    const fixture = createHeroCarousel();
    vi.advanceTimersByTime(7000);

    expect(fixture.componentInstance.activeIndex()).toBe(1);
    fixture.destroy();
  });

  it('does not automatically advance when reduced motion is enabled', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
    vi.useFakeTimers();

    const fixture = createHeroCarousel();
    vi.advanceTimersByTime(14000);

    expect(fixture.componentInstance.activeIndex()).toBe(0);
    fixture.destroy();
  });

  it('pauses automatic rotation while the carousel is being interacted with', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
    vi.useFakeTimers();

    const fixture = createHeroCarousel();
    fixture.componentInstance.onPointerEnter();
    vi.advanceTimersByTime(7000);
    expect(fixture.componentInstance.activeIndex()).toBe(0);

    fixture.componentInstance.onPointerLeave();
    vi.advanceTimersByTime(7000);
    expect(fixture.componentInstance.activeIndex()).toBe(1);
    fixture.destroy();
  });
});

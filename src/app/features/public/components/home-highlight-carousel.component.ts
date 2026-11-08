import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  PLATFORM_ID,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { interval } from 'rxjs';
import { IconComponent } from '../../../shared/ui/icon.component';
import { Highlight } from '../models/highlight.model';

export type HomeHighlightCarouselVariant = 'hero' | 'cards';

@Component({
  selector: 'qd-home-highlight-carousel',
  imports: [IconComponent, RouterLink, TranslocoPipe],
  templateUrl: './home-highlight-carousel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHighlightCarouselComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cardsTrack = viewChild<ElementRef<HTMLDivElement>>('cardsTrack');
  private readonly cardElements = viewChildren<ElementRef<HTMLElement>>('cardItem');
  private observer: IntersectionObserver | null = null;

  readonly highlights = input.required<Highlight[]>();
  readonly variant = input<HomeHighlightCarouselVariant>('cards');
  readonly label = input.required<string>();
  readonly activeIndex = signal(0);
  readonly paused = signal(false);
  readonly interacting = signal(false);
  readonly visibleCardIds = signal<ReadonlySet<string>>(new Set());
  readonly canScrollPrevious = signal(false);
  readonly canScrollNext = signal(false);
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      interval(7000)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (
            this.variant() === 'hero' &&
            this.highlights().length > 1 &&
            !this.paused() &&
            !this.interacting() &&
            !window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ) {
            this.goTo(this.activeIndex() + 1);
          }
        });

      afterNextRender(() => this.observeCards());

      this.destroyRef.onDestroy(() => this.observer?.disconnect());
    }

    effect(() => {
      const count = this.highlights().length;
      if (count === 0 || this.activeIndex() >= count) {
        this.activeIndex.set(0);
      }
    });
  }

  goTo(index: number): void {
    const count = this.highlights().length;
    if (count > 0) {
      this.activeIndex.set((index + count) % count);
    }
  }

  next(): void {
    this.goTo(this.activeIndex() + 1);
  }

  previous(): void {
    this.goTo(this.activeIndex() - 1);
  }

  togglePaused(): void {
    this.paused.update((value) => !value);
  }

  onPointerEnter(): void {
    this.interacting.set(true);
  }

  onPointerLeave(): void {
    this.interacting.set(false);
  }

  onFocusIn(): void {
    this.interacting.set(true);
  }

  onFocusOut(event: FocusEvent): void {
    const section = event.currentTarget;
    const nextTarget = event.relatedTarget;
    if (
      !(section instanceof HTMLElement) ||
      !(nextTarget instanceof Node) ||
      !section.contains(nextTarget)
    ) {
      this.interacting.set(false);
    }
  }

  scrollCards(direction: -1 | 1): void {
    const track = this.cardsTrack()?.nativeElement;
    if (!track) {
      return;
    }

    track.scrollBy({
      left: direction * track.clientWidth * 0.85,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  updateScrollControls(): void {
    const track = this.cardsTrack()?.nativeElement;
    if (!track) {
      this.canScrollPrevious.set(false);
      this.canScrollNext.set(false);
      return;
    }

    this.canScrollPrevious.set(track.scrollLeft > 2);
    this.canScrollNext.set(track.scrollLeft + track.clientWidth < track.scrollWidth - 2);
  }

  safeCtaUrl(value: string | null | undefined): string | null {
    const candidate = value?.trim();
    if (!candidate || /[\u0000-\u001f\\]/.test(candidate)) {
      return null;
    }

    if (candidate.startsWith('/') && !candidate.startsWith('//')) {
      return candidate;
    }

    if (/^https?:\/\//i.test(candidate)) {
      try {
        const parsed = new URL(candidate);
        return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password
          ? parsed.href
          : null;
      } catch {
        return null;
      }
    }

    return null;
  }

  isExternalUrl(value: string | null | undefined): boolean {
    const candidate = this.safeCtaUrl(value);
    return !!candidate && /^https?:\/\//i.test(candidate);
  }

  isCardVisible(id: string): boolean {
    return (
      !isPlatformBrowser(this.platformId) ||
      typeof IntersectionObserver === 'undefined' ||
      this.visibleCardIds().has(id)
    );
  }

  isLightTheme(highlight: Highlight): boolean {
    return highlight.theme === 'light';
  }

  private observeCards(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      this.visibleCardIds.set(new Set(this.highlights().map((highlight) => highlight.id)));
      return;
    }

    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        const visibleIds = new Set(this.visibleCardIds());
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset['highlightId'];
            if (id) {
              visibleIds.add(id);
            }
            this.observer?.unobserve(entry.target);
          }
        }
        this.visibleCardIds.set(visibleIds);
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.1 },
    );

    for (const card of this.cardElements()) {
      this.observer.observe(card.nativeElement);
    }
  }
}

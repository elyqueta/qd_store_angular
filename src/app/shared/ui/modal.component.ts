import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  HostListener,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { IconComponent } from './icon.component';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'qd-modal',
  imports: [IconComponent, TranslocoPipe],
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  private readonly document = inject(DOCUMENT);
  private readonly previousActiveElement = signal<HTMLElement | null>(null);

  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;

  readonly open = input(false);
  readonly titleId = input.required<string>();
  readonly descriptionId = input.required<string>();
  readonly labelledBy = input.required<string>();
  readonly describedBy = input.required<string>();
  readonly alert = input(false);
  readonly closeOnOverlay = input(true);
  readonly closeable = input(true);
  readonly size = input<'md' | 'lg'>('md');
  readonly closed = output<void>();

  constructor() {
    effect(() => {
      if (this.open()) {
        this.show();
      } else {
        this.restoreFocus();
      }
    });
  }

  show(): void {
    const activeElement = this.document.activeElement;
    this.previousActiveElement.set(activeElement instanceof HTMLElement ? activeElement : null);
    this.document.body.classList.add('overflow-hidden');
    queueMicrotask(() =>
      this.dialog?.nativeElement.querySelector<HTMLElement>('[autofocus]')?.focus(),
    );
  }

  hide(): void {
    this.closed.emit();
  }

  handleOverlayClick(): void {
    if (this.closeOnOverlay()) this.hide();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.closeOnOverlay()) {
      event.preventDefault();
      this.hide();
      return;
    }
    if (event.key !== 'Tab' || !this.dialog) return;
    const focusable = this.dialog.nativeElement.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable.item(0);
    const last = focusable.item(focusable.length - 1);
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open() && this.closeOnOverlay()) this.hide();
  }

  private restoreFocus(): void {
    this.document.body.classList.remove('overflow-hidden');
    this.previousActiveElement()?.focus();
    this.previousActiveElement.set(null);
  }
}

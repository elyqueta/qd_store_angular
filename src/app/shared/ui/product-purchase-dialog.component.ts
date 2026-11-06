import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  ViewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from './icon.component';

@Component({
  selector: 'qd-product-purchase-dialog',
  imports: [TranslocoPipe, IconComponent],
  templateUrl: './product-purchase-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductPurchaseDialogComponent {
  private dialog?: ElementRef<HTMLElement>;

  @ViewChild('dialog')
  set dialogElement(dialog: ElementRef<HTMLElement> | undefined) {
    this.dialog = dialog;
    if (dialog && this.open()) {
      dialog.nativeElement.querySelector<HTMLElement>('[data-buy-dialog-close]')?.focus();
    }
  }

  readonly open = input(false);
  readonly productName = input.required<string>();
  readonly priceLabel = input.required<string>();
  readonly imageUrl = input<string | null>(null);
  readonly whatsappUrl = input.required<string>();
  readonly cartBusy = input(false);
  readonly canPurchase = input(true);
  readonly closed = output<void>();
  readonly purchaseRequested = output<void>();

  requestClose(): void {
    this.closed.emit();
  }

  requestPurchase(): void {
    this.purchaseRequested.emit();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.dialog) {
      return;
    }

    const focusableElements = this.dialog.nativeElement.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements.item(0);
    const lastElement = focusableElements.item(focusableElements.length - 1);
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.open()) {
      this.requestClose();
    }
  }
}

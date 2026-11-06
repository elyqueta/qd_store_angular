import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from './icon.component';

const WHATSAPP_URL =
  'https://wa.me/244923000000?text=Ol%C3%A1%20QD%20%C2%B7%20ItSOLUTIONS!%20Preciso%20de%20ajuda%20com%20um%20produto.';

@Component({
  selector: 'qd-whatsapp-button',
  imports: [IconComponent, TranslocoPipe],
  templateUrl: './whatsapp-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsappButtonComponent {
  readonly expanded = signal(false);
  readonly whatsappUrl = WHATSAPP_URL;

  toggle(): void {
    this.expanded.update((open) => !open);
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.expanded.set(false);
  }
}

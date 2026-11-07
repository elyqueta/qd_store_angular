import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent, IconName } from './icon.component';

export type StateMessageTone = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'qd-state-message',
  imports: [IconComponent],
  templateUrl: './state-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateMessageComponent {
  readonly icon = input<IconName>('circle-info');
  readonly tone = input<StateMessageTone>('info');
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}

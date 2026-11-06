import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent, IconName } from './icon.component';

export type FeedbackStateKind = 'empty' | 'error' | 'info' | 'success';

@Component({
  selector: 'qd-feedback-state',
  imports: [IconComponent],
  templateUrl: './feedback-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackStateComponent {
  readonly kind = input<FeedbackStateKind>('info');
  readonly icon = input<IconName>('circle-info');
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly actionLabel = input<string | null>(null);
  readonly action = output<void>();
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { FeedbackService } from '../../core/notifications/feedback.service';
import { IconComponent } from './icon.component';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'qd-feedback-dialog',
  imports: [IconComponent, ModalComponent, TranslocoPipe],
  templateUrl: './feedback-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackDialogComponent {
  readonly feedback = inject(FeedbackService);
}

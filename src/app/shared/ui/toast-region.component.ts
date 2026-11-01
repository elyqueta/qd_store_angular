import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ToastMessage } from '../../core/notifications/toast.model';
import { ToastService } from '../../core/notifications/toast.service';

@Component({
  selector: 'qd-toast-region',
  imports: [TranslocoPipe],
  templateUrl: './toast-region.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastRegionComponent {
  readonly toastService = inject(ToastService);

  trackToast(_index: number, toast: ToastMessage): number {
    return toast.id;
  }
}

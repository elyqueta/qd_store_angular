import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ToastMessage } from '../../core/notifications/toast.model';
import { ToastService } from '../../core/notifications/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'qd-toast-region',
  imports: [TranslocoPipe, IconComponent],
  templateUrl: './toast-region.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastRegionComponent {
  readonly toastService = inject(ToastService);

  trackToast(_index: number, toast: ToastMessage): number {
    return toast.id;
  }
}

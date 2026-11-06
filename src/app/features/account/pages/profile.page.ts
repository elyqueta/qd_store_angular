import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  selector: 'qd-profile-page',
  imports: [TranslocoPipe],
  templateUrl: './profile.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly authStore = inject(AuthStore);

  readonly user = this.authStore.user;
}

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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
  readonly initials = computed(() =>
    this.user()
      ?.fullName.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase(),
  );
}

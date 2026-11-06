import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { IconComponent } from '../../../shared/ui/icon.component';

@Component({
  selector: 'qd-profile-page',
  imports: [TranslocoPipe, RouterLink, RouterLinkActive, IconComponent],
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

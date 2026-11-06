import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../../core/auth/auth.store';
import { IconComponent } from '../../../shared/ui/icon.component';

@Component({
  selector: 'qd-profile-page',
  imports: [ReactiveFormsModule, TranslocoPipe, IconComponent],
  templateUrl: './profile.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly authStore = inject(AuthStore);

  readonly user = this.authStore.user;
  readonly editMode = signal(false);
  readonly saveUnavailable = signal(false);
  readonly form = inject(FormBuilder).nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
    nif: ['', Validators.maxLength(30)],
    province: [''],
    municipality: [''],
    neighborhood: [''],
    address: [''],
  });

  constructor() {
    effect(() => {
      const profile = this.user();
      if (profile && !this.editMode()) {
        this.form.patchValue({
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          nif: profile.nif ?? '',
        });
      }
    });
  }

  toggleEdit(): void {
    this.saveUnavailable.set(false);
    this.editMode.update((editing) => !editing);
  }

  save(): void {
    this.saveUnavailable.set(true);
  }
}

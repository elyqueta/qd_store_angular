import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { IconComponent } from '../../../shared/ui/icon.component';
import { ProfileApiService } from '../data-access/profile-api.service';
import { UserProfile } from '../models/profile.model';

@Component({
  selector: 'qd-profile-page',
  imports: [ReactiveFormsModule, TranslocoPipe, IconComponent],
  templateUrl: './profile.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage implements OnInit {
  private readonly api = inject(ProfileApiService);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  @ViewChild('photoInput') private photoInput?: ElementRef<HTMLInputElement>;

  readonly user = this.authStore.user;
  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly removingPhoto = signal(false);
  readonly uploadProgress = signal(0);
  readonly error = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly selectedPhoto = signal<File | null>(null);
  readonly selectedPhotoPreview = signal<string | null>(null);
  private uploadSubscription?: { unsubscribe: () => void };

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.uploadSubscription?.unsubscribe();
      const preview = this.selectedPhotoPreview();
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    });
  }

  readonly form = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [
      '',
      [Validators.required, Validators.pattern(/^\S(?:.*\S)?$/), Validators.maxLength(20)],
    ],
    currentPassword: [''],
    newPassword: [
      '',
      [
        Validators.minLength(8),
        Validators.maxLength(72),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
      ],
    ],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getMine()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.authStore.updateUser(profile);
          this.resetForm(profile);
        },
        error: (error: unknown) => this.error.set(this.getErrorMessage(error)),
      });
  }

  startEditing(): void {
    const profile = this.profile();
    if (!profile) {
      return;
    }

    this.resetForm(profile);
    this.formError.set(null);
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.cancelUpload();
    const profile = this.profile();
    if (profile) {
      this.resetForm(profile);
    }
    this.selectedPhoto.set(null);
    this.formError.set(null);
    this.editing.set(false);
  }

  selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      return;
    }

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!acceptedTypes.includes(file.type)) {
      this.formError.set(this.transloco.translate('account.profile.validation.photoType'));
      input.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.formError.set(this.transloco.translate('account.profile.validation.photoSize'));
      input.value = '';
      return;
    }

    this.formError.set(null);
    this.setSelectedPhoto(file);
  }

  clearSelectedPhoto(): void {
    this.setSelectedPhoto(null);
    if (this.photoInput) {
      this.photoInput.nativeElement.value = '';
    }
  }

  cancelUpload(): void {
    this.uploadSubscription?.unsubscribe();
    this.uploadSubscription = undefined;
    this.uploadProgress.set(0);
    this.saving.set(false);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const current = this.profile();
    if (!current) {
      return;
    }

    const emailChanged = values.email.trim().toLowerCase() !== current.email;
    const passwordChanged = values.newPassword.trim().length > 0;
    if ((emailChanged || passwordChanged) && !values.currentPassword) {
      this.form.controls.currentPassword.setErrors({ required: true });
      this.form.controls.currentPassword.markAsTouched();
      this.formError.set(this.transloco.translate('account.profile.validation.currentPassword'));
      return;
    }

    const data = new FormData();
    data.append('fullName', values.fullName.trim());
    data.append('email', values.email.trim().toLowerCase());
    data.append('phone', values.phone.trim());
    if (values.currentPassword) {
      data.append('currentPassword', values.currentPassword);
    }
    if (values.newPassword) {
      data.append('newPassword', values.newPassword);
    }
    const photo = this.selectedPhoto();
    if (photo) {
      data.append('photo', photo, photo.name);
    }

    this.saving.set(true);
    this.formError.set(null);
    const request = photo
      ? this.api.uploadMine(data, (progress) => this.uploadProgress.set(progress))
      : this.api.updateMine(data);
    if (photo) {
      this.uploadProgress.set(0);
    }
    this.uploadSubscription = request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.authStore.updateUser(profile);
          this.resetForm(profile);
          this.setSelectedPhoto(null);
          this.uploadSubscription = undefined;
          this.editing.set(false);
          this.toast.success(this.transloco.translate('account.profile.messages.updated'));
        },
        error: (error: unknown) => {
          this.uploadSubscription = undefined;
          this.formError.set(this.getErrorMessage(error));
        },
      });
  }

  removePhoto(): void {
    if (this.removingPhoto() || !this.profile()?.profilePhoto) {
      return;
    }

    this.removingPhoto.set(true);
    this.api
      .removePhoto()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.removingPhoto.set(false)),
      )
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.authStore.updateUser(profile);
          this.toast.success(this.transloco.translate('account.profile.messages.photoRemoved'));
        },
        error: (error: unknown) => this.toast.error(this.getErrorMessage(error)),
      });
  }

  private resetForm(profile: UserProfile): void {
    this.form.reset({
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      currentPassword: '',
      newPassword: '',
    });
  }

  private setSelectedPhoto(file: File | null): void {
    const preview = this.selectedPhotoPreview();
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    this.selectedPhoto.set(file);
    this.selectedPhotoPreview.set(file ? URL.createObjectURL(file) : null);
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof ApiError
      ? error.message
      : this.transloco.translate('account.profile.loadError');
  }
}

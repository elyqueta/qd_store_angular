import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ApiError } from '../../../core/http/api-error.model';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'qd-register-page',
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './register.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly authService = inject(AuthService);
  private readonly transloco = inject(TranslocoService);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly registered = signal(false);
  readonly form = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    phone: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(20)]],
    nif: ['', Validators.maxLength(20)],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72),
        Validators.pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/),
      ],
    ],
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { nif, ...requiredFields } = this.form.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.authService
      .register({
        ...requiredFields,
        ...(nif.trim() ? { nif: nif.trim() } : {}),
        accountType: 'personal',
      })
      .subscribe({
        next: () => this.registered.set(true),
        error: (error: unknown) => {
          this.errorMessage.set(
            error instanceof ApiError ? error.message : this.transloco.translate('common.error'),
          );
          this.submitting.set(false);
        },
        complete: () => this.submitting.set(false),
      });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize, Subscription } from 'rxjs';
import { CompanyApiService } from '../../features/account/data-access/company-api.service';
import { CompanyWithUsers } from '../../features/account/models/company.model';
import { ApiError } from '../../core/http/api-error.model';
import { ToastService } from '../../core/notifications/toast.service';
import { IconComponent } from './icon.component';
import { CompanySnapshot } from '../../features/commerce/models/commerce.model';

export interface PurchaseSelection {
  companyId?: string;
  companySnapshot?: CompanySnapshot;
  quantity: number;
}

@Component({
  selector: 'qd-product-purchase-dialog',
  imports: [ReactiveFormsModule, TranslocoPipe, IconComponent],
  templateUrl: './product-purchase-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductPurchaseDialogComponent {
  private readonly companyApi = inject(CompanyApiService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private companyRequest?: Subscription;
  private dialog?: ElementRef<HTMLElement>;

  @ViewChild('dialog')
  set dialogElement(dialog: ElementRef<HTMLElement> | undefined) {
    this.dialog = dialog;
    if (dialog && this.open()) {
      dialog.nativeElement.querySelector<HTMLElement>('[data-buy-dialog-close]')?.focus();
    }
  }

  readonly open = input(false);
  readonly productName = input.required<string>();
  readonly priceLabel = input.required<string>();
  readonly imageUrl = input<string | null>(null);
  readonly whatsappUrl = input.required<string>();
  readonly cartBusy = input(false);
  readonly canPurchase = input(true);
  readonly closed = output<void>();
  readonly purchaseSelected = output<PurchaseSelection>();
  readonly purchaseStep = signal<
    'method' | 'account' | 'company-list' | 'company-create' | 'company-save'
  >(
    'method',
  );
  readonly accountType = signal<'personal' | 'business'>('personal');
  readonly quantity = signal(1);
  readonly companies = signal<CompanyWithUsers[]>([]);
  readonly companyLoading = signal(false);
  readonly companyError = signal(false);
  readonly processing = signal(false);
  readonly processingProgress = signal(0);
  readonly companyForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    nif: ['', [Validators.required, Validators.maxLength(20)]],
    role: ['', [Validators.required, Validators.maxLength(100)]],
  });

  requestClose(): void {
    this.purchaseStep.set('method');
    this.closed.emit();
  }

  requestPurchase(): void {
    this.quantity.set(1);
    this.purchaseStep.set('account');
  }

  changeQuantity(delta: number): void {
    this.quantity.update((current) => Math.min(99, Math.max(1, current + delta)));
  }

  chooseAccount(type: 'personal' | 'business'): void {
    this.accountType.set(type);
  }

  continueAccount(): void {
    if (this.accountType() === 'personal') {
      this.purchaseSelected.emit({ quantity: this.quantity() });
      return;
    }
    this.purchaseStep.set('company-list');
    this.companyLoading.set(true);
    this.companyError.set(false);
    this.companyApi
      .listMine()
      .pipe(finalize(() => this.companyLoading.set(false)))
      .subscribe({
        next: (companies) => {
          this.companies.set(companies);
          if (companies.length === 1) {
            this.purchaseSelected.emit({ companyId: companies[0].id, quantity: this.quantity() });
          }
        },
        error: (error: unknown) => {
          this.companyError.set(true);
          this.toast.error(
            error instanceof ApiError
              ? error.message
              : this.transloco.translate('commerce.checkout.companyLoadError'),
          );
        },
      });
  }

  chooseCompany(companyId: string): void {
    this.purchaseSelected.emit({ companyId, quantity: this.quantity() });
  }

  openCompanyForm(): void {
    this.companyForm.reset();
    this.purchaseStep.set('company-create');
  }

  createCompany(): void {
    if (this.companyForm.invalid || this.companyLoading()) {
      this.companyForm.markAllAsTouched();
      return;
    }

    this.purchaseStep.set('company-save');
  }

  useCompanyForThisPurchase(save: boolean): void {
    const values = this.companyForm.getRawValue();
    const snapshot: CompanySnapshot = {
      name: values.name.trim(),
      nif: values.nif.trim(),
      role: values.role.trim(),
    };

    if (!save) {
      this.purchaseSelected.emit({ companySnapshot: snapshot, quantity: this.quantity() });
      return;
    }

    this.processing.set(true);
    this.processingProgress.set(35);
    this.companyRequest = this.companyApi
      .createCompany(
        { name: snapshot.name, nif: snapshot.nif },
        globalThis.crypto?.randomUUID(),
      )
      .pipe(finalize(() => this.processing.set(false)))
      .subscribe({
        next: (company) => {
          this.processingProgress.set(100);
          this.purchaseSelected.emit({ companyId: company.id, quantity: this.quantity() });
        },
        error: (error: unknown) => {
          this.processingProgress.set(0);
          this.toast.error(
            error instanceof ApiError
              ? error.message
              : this.transloco.translate('commerce.checkout.companyCreateError'),
          );
        },
      });
  }

  cancelProcessing(): void {
    this.companyRequest?.unsubscribe();
    this.companyRequest = undefined;
    this.processing.set(false);
    this.processingProgress.set(0);
    this.purchaseStep.set('company-create');
  }

  goBack(): void {
    switch (this.purchaseStep()) {
      case 'account':
        this.purchaseStep.set('method');
        return;
      case 'company-create':
        this.purchaseStep.set('company-list');
        return;
      case 'company-list':
        this.purchaseStep.set('account');
        return;
      case 'company-save':
        this.purchaseStep.set('company-create');
        return;
      case 'method':
        return;
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.dialog) {
      return;
    }

    const focusableElements = this.dialog.nativeElement.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements.item(0);
    const lastElement = focusableElements.item(focusableElements.length - 1);
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.open()) {
      this.requestClose();
    }
  }
}

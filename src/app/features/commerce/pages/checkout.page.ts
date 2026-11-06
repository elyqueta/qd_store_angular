import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { AddressApiService } from '../../account/data-access/address-api.service';
import { DeliveryTypeApiService } from '../../public/data-access/delivery-type-api.service';
import { CommerceApiService } from '../data-access/commerce-api.service';
import {
  Cart,
  CreateOrderInput,
  CreatePaymentInput,
  PaymentMethod,
  PaymentMethodType,
} from '../models/commerce.model';
import { Address } from '../../account/models/address.model';
import { DeliveryType } from '../../public/models/delivery-type.model';

@Component({
  selector: 'qd-checkout-page',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './checkout.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage implements OnInit {
  private readonly addressApi = inject(AddressApiService);
  private readonly api = inject(CommerceApiService);
  private readonly deliveryApi = inject(DeliveryTypeApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly form = this.fb.nonNullable.group({
    addressId: ['', Validators.required],
    deliveryTypeId: ['', Validators.required],
    paymentMethodId: ['', Validators.required],
    customerPhone: ['', [Validators.minLength(9), Validators.maxLength(20)]],
    notes: ['', Validators.maxLength(1000)],
  });
  readonly addresses = signal<Address[]>([]);
  readonly deliveryTypes = signal<DeliveryType[]>([]);
  readonly paymentMethods = signal<PaymentMethod[]>([]);
  readonly cart = signal<Cart | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly submitting = signal(false);

  ngOnInit(): void {
    this.form.controls.paymentMethodId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((methodId) => {
        const method = this.paymentMethods().find((candidate) => candidate.id === methodId);
        const phoneControl = this.form.controls.customerPhone;
        phoneControl.setValidators([
          ...(method?.type === 'multicaixa_express' ? [Validators.required] : []),
          Validators.minLength(9),
          Validators.maxLength(20),
        ]);
        phoneControl.updateValueAndValidity({ emitEvent: false });
      });

    forkJoin({
      addresses: this.addressApi.listAddresses(),
      deliveryTypes: this.deliveryApi.listActive(),
      paymentMethods: this.api.getPaymentMethods(),
      cart: this.api.getCart(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ addresses, deliveryTypes, paymentMethods, cart }) => {
          this.addresses.set(addresses);
          this.deliveryTypes.set(deliveryTypes);
          this.paymentMethods.set(paymentMethods);
          this.cart.set(cart);
          this.form.patchValue({
            addressId: addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? '',
            deliveryTypeId: deliveryTypes[0]?.id ?? '',
            paymentMethodId: paymentMethods[0]?.id ?? '',
          });
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.loadError.set(true);
          this.showError(error);
        },
      });
  }

  selectedPaymentMethodType(): PaymentMethodType | null {
    const selectedId = this.form.controls.paymentMethodId.value;
    return this.paymentMethods().find((method) => method.id === selectedId)?.type ?? null;
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const paymentMethod = this.paymentMethods().find(
      (method) => method.id === values.paymentMethodId,
    );
    if (!paymentMethod || !this.cart()?.items.length) {
      this.toast.error(this.transloco.translate('commerce.checkout.invalidSelection'));
      return;
    }

    this.submitting.set(true);
    const input: CreateOrderInput = {
      addressId: values.addressId,
      deliveryTypeId: values.deliveryTypeId,
      paymentMethodId: values.paymentMethodId,
      ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
    };

    this.api
      .createOrder(input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => this.startPayment(order.id, paymentMethod, values.customerPhone),
        error: (error: unknown) => {
          this.submitting.set(false);
          this.showError(error);
        },
      });
  }

  private startPayment(orderId: string, method: PaymentMethod, customerPhone: string): void {
    const input = this.paymentInput(method, customerPhone);
    this.api
      .createPayment(orderId, input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.success(this.transloco.translate('commerce.checkout.orderCreated'));
          void this.router.navigate(['/conta/encomendas', orderId]);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.showError(error);
          void this.router.navigate(['/conta/encomendas', orderId]);
        },
      });
  }

  private paymentInput(method: PaymentMethod, customerPhone: string): CreatePaymentInput {
    switch (method.type) {
      case 'multicaixa_express':
        return { methodType: method.type, customerPhone: customerPhone.trim() };
      case 'multicaixa_reference':
      case 'bank_transfer':
        return { methodType: method.type };
    }
  }

  private showError(error: unknown): void {
    this.toast.error(
      error instanceof ApiError ? error.message : this.transloco.translate('common.error'),
    );
  }
}

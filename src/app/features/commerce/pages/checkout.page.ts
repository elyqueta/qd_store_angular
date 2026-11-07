import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { AddressApiService } from '../../account/data-access/address-api.service';
import { LocationApiService } from '../../account/data-access/location-api.service';
import { ProvinceWithMunicipalities } from '../../account/models/address.model';
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
import { CompanyApiService } from '../../account/data-access/company-api.service';
import { CompanyWithUsers } from '../../account/models/company.model';
import { DeliveryType } from '../../public/models/delivery-type.model';
import { IconComponent } from '../../../shared/ui/icon.component';

@Component({
  selector: 'qd-checkout-page',
  imports: [CurrencyPipe, IconComponent, ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './checkout.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage implements OnInit {
  @ViewChild('provinceField') private provinceField?: ElementRef<HTMLSelectElement>;
  @ViewChild('municipalityField') private municipalityField?: ElementRef<HTMLSelectElement>;
  @ViewChild('neighborhoodField') private neighborhoodField?: ElementRef<HTMLInputElement>;
  @ViewChild('addressField') private addressField?: ElementRef<HTMLInputElement>;

  private readonly addressApi = inject(AddressApiService);
  private readonly api = inject(CommerceApiService);
  private readonly deliveryApi = inject(DeliveryTypeApiService);
  private readonly locationApi = inject(LocationApiService);
  private readonly companyApi = inject(CompanyApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly form = this.fb.nonNullable.group({
    addressId: ['', Validators.required],
    deliveryTypeId: ['', Validators.required],
    paymentMethodId: ['', Validators.required],
    companyId: [''],
    newAddress: [false],
    province: [''],
    municipality: [''],
    neighborhood: [''],
    address: [''],
    reference: [''],
    saveAddress: [true],
    customerPhone: ['', [Validators.minLength(9), Validators.maxLength(20)]],
    notes: ['', Validators.maxLength(1000)],
  });
  readonly addresses = signal<Address[]>([]);
  readonly locations = signal<ProvinceWithMunicipalities[]>([]);
  readonly locationsLoading = signal(true);
  readonly selectedProvince = signal('');
  readonly municipalities = computed(
    () =>
      this.locations().find((location) => location.name === this.selectedProvince())
        ?.municipalities ?? [],
  );
  readonly deliveryTypes = signal<DeliveryType[]>([]);
  readonly paymentMethods = signal<PaymentMethod[]>([]);
  readonly cart = signal<Cart | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly submitting = signal(false);
  readonly busyItems = signal<ReadonlySet<string>>(new Set());
  readonly selectedCompany = signal<CompanyWithUsers | null>(null);
  readonly newAddressMode = signal(false);
  readonly checkoutStep = signal<'address' | 'delivery' | 'payment' | 'review'>('address');

  ngOnInit(): void {
    const companyId = this.route.snapshot.queryParamMap.get('companyId');
    this.form.controls.companyId.setValue(companyId ?? '');
    this.locationApi
      .listProvinceLocations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (locations) => {
          this.locations.set(locations);
          this.locationsLoading.set(false);
        },
        error: (error: unknown) => {
          this.locationsLoading.set(false);
          this.showError(error);
        },
      });
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
          this.newAddressMode.set(!addresses.length);
          if (companyId) {
            this.companyApi
              .listMine()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (companies) => {
                  const company = companies.find((candidate) => candidate.id === companyId) ?? null;
                  this.selectedCompany.set(company);
                },
                error: () => this.selectedCompany.set(null),
              });
          }
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.loadError.set(true);
          this.showError(error);
        },
      });
  }

  toggleNewAddress(): void {
    this.newAddressMode.update((enabled) => !enabled);
    this.form.controls.addressId.setValue('');
    if (this.newAddressMode()) {
      this.selectedProvince.set(this.form.controls.province.value);
    }
  }

  onProvinceChange(): void {
    const province = this.form.controls.province.value;
    this.selectedProvince.set(province);
    this.form.controls.municipality.setValue('');
  }

  selectedPaymentMethodType(): PaymentMethodType | null {
    const selectedId = this.form.controls.paymentMethodId.value;
    return this.paymentMethods().find((method) => method.id === selectedId)?.type ?? null;
  }

  nextStep(): void {
    const step = this.checkoutStep();
    if (step === 'address') {
      if (!this.validateAddress()) return;
      this.checkoutStep.set('delivery');
    } else if (step === 'delivery') {
      if (!this.form.controls.deliveryTypeId.valid) {
        this.form.controls.deliveryTypeId.markAsTouched();
        return;
      }
      this.checkoutStep.set('payment');
    } else if (step === 'payment') {
      if (!this.form.controls.paymentMethodId.valid || !this.form.controls.customerPhone.valid) {
        this.form.controls.paymentMethodId.markAsTouched();
        this.form.controls.customerPhone.markAsTouched();
        return;
      }
      this.checkoutStep.set('review');
    }
  }

  previousStep(): void {
    const steps: Array<'address' | 'delivery' | 'payment' | 'review'> = [
      'address',
      'delivery',
      'payment',
      'review',
    ];
    const index = steps.indexOf(this.checkoutStep());
    if (index > 0) this.checkoutStep.set(steps[index - 1]);
  }

  changeQuantity(itemId: string, quantity: number): void {
    if (quantity < 1 || quantity > 99 || this.busyItems().has(itemId)) {
      return;
    }

    this.busyItems.update((items) => new Set(items).add(itemId));
    this.api
      .updateCartItem(itemId, quantity)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cart) => {
          this.cart.set(cart);
          this.busyItems.update((items) => {
            const next = new Set(items);
            next.delete(itemId);
            return next;
          });
        },
        error: (error: unknown) => {
          this.busyItems.update((items) => {
            const next = new Set(items);
            next.delete(itemId);
            return next;
          });
          this.showError(error);
        },
      });
  }

  private validateAddress(): boolean {
    if (!this.newAddressMode() && this.form.controls.addressId.valid) return true;
    const controls = [
      this.form.controls.province,
      this.form.controls.municipality,
      this.form.controls.neighborhood,
      this.form.controls.address,
    ];
    const valid = controls.every((control) => control.value.trim().length > 0);
    if (!valid) {
      controls.forEach((control) => control.markAsTouched());
      const firstInvalidIndex = controls.findIndex((control) => !control.value.trim());
      const firstInvalidField = [
        this.provinceField,
        this.municipalityField,
        this.neighborhoodField,
        this.addressField,
      ][firstInvalidIndex];
      firstInvalidField?.nativeElement.focus();
    }
    return valid;
  }

  isAddressFieldInvalid(
    field: 'province' | 'municipality' | 'neighborhood' | 'address',
  ): boolean {
    const control = this.form.controls[field];
    return this.newAddressMode() && control.touched && !control.value.trim();
  }

  submit(): void {
    if (this.checkoutStep() !== 'review') {
      this.nextStep();
      return;
    }

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
    const saveAddress$ =
      this.newAddressMode() && values.saveAddress
        ? this.addressApi.createAddress({
            province: values.province.trim(),
            municipality: values.municipality.trim(),
            neighborhood: values.neighborhood.trim(),
            address: values.address.trim(),
            ...(values.reference.trim() ? { reference: values.reference.trim() } : {}),
          })
        : null;

    if (this.newAddressMode() && !saveAddress$) {
      this.toast.error(this.transloco.translate('commerce.checkout.addressMustBeSaved'));
      this.submitting.set(false);
      return;
    }

    const createOrder = (addressId: string): void => {
      const input: CreateOrderInput = {
        addressId,
        deliveryTypeId: values.deliveryTypeId,
        paymentMethodId: values.paymentMethodId,
        ...(values.companyId ? { companyId: values.companyId } : {}),
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
    };

    if (saveAddress$) {
      saveAddress$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (address) => createOrder(address.id),
        error: (error: unknown) => {
          this.submitting.set(false);
          this.showError(error);
        },
      });
    } else {
      createOrder(values.addressId);
    }
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

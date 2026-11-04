import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { AddressApiService } from '../data-access/address-api.service';
import { LocationApiService } from '../data-access/location-api.service';
import {
  Address,
  CreateAddressInput,
  ProvinceWithMunicipalities,
  UpdateAddressInput,
} from '../models/address.model';

@Component({
  selector: 'qd-address-list-page',
  imports: [ReactiveFormsModule, TranslocoPipe],
  templateUrl: './address-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressListPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly addressApi = inject(AddressApiService);
  private readonly locationApi = inject(LocationApiService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly addresses = signal<Address[]>([]);
  readonly locations = signal<ProvinceWithMunicipalities[]>([]);
  readonly addressesLoading = signal(true);
  readonly locationsLoading = signal(true);
  readonly addressesError = signal<string | null>(null);
  readonly locationsError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly pendingActionId = signal<string | null>(null);
  readonly confirmingDeletionId = signal<string | null>(null);
  readonly creatingAddress = signal(false);
  readonly editingAddressId = signal<string | null>(null);
  readonly formOpen = computed(() => this.creatingAddress() || this.editingAddressId() !== null);
  readonly selectedProvince = signal('');
  readonly selectedProvinceLocation = computed(
    () => this.locations().find((province) => province.name === this.selectedProvince()) ?? null,
  );

  readonly form = this.formBuilder.group({
    label: ['', Validators.maxLength(100)],
    province: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    municipality: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    neighborhood: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    address: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]],
    reference: ['', Validators.maxLength(500)],
  });

  constructor() {
    this.loadAddresses();
    this.loadLocations();
  }

  loadAddresses(): void {
    this.addressesLoading.set(true);
    this.addressesError.set(null);
    this.addressApi
      .listAddresses()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.addressesLoading.set(false)),
      )
      .subscribe({
        next: (addresses) => this.addresses.set(this.orderAddresses(addresses)),
        error: (error: unknown) => this.addressesError.set(this.getErrorMessage(error)),
      });
  }

  loadLocations(): void {
    this.locationsLoading.set(true);
    this.locationsError.set(null);
    this.locationApi
      .listProvinceLocations()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.locationsLoading.set(false)),
      )
      .subscribe({
        next: (locations) => this.locations.set(locations),
        error: (error: unknown) => this.locationsError.set(this.getErrorMessage(error)),
      });
  }

  openCreateForm(): void {
    this.resetForm();
    this.creatingAddress.set(true);
  }

  openEditForm(address: Address): void {
    this.resetForm();
    this.form.setValue({
      label: address.label ?? '',
      province: address.province,
      municipality: address.municipality,
      neighborhood: address.neighborhood,
      address: address.address,
      reference: address.reference ?? '',
    });
    this.selectedProvince.set(address.province);
    this.editingAddressId.set(address.id);
  }

  closeForm(): void {
    this.creatingAddress.set(false);
    this.editingAddressId.set(null);
    this.resetForm();
  }

  onProvinceChange(): void {
    const province = this.form.controls.province.value;
    this.selectedProvince.set(province);
    this.form.controls.municipality.setValue('');
    this.form.controls.municipality.markAsTouched();
  }

  submitForm(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const editingId = this.editingAddressId();
    this.saving.set(true);
    this.formError.set(null);

    if (editingId) {
      const currentAddress = this.addresses().find((address) => address.id === editingId);
      if (!currentAddress) {
        this.formError.set(this.transloco.translate('account.addresses.errors.addressUnavailable'));
        this.saving.set(false);
        return;
      }

      const input = this.createUpdateInput(values, currentAddress);
      if (!Object.keys(input).length) {
        this.saving.set(false);
        this.closeForm();
        return;
      }

      this.addressApi
        .updateAddress(editingId, input)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.saving.set(false)),
        )
        .subscribe({
          next: (updatedAddress) => {
            this.addresses.update((addresses) =>
              this.orderAddresses(
                addresses.map((address) =>
                  address.id === updatedAddress.id ? updatedAddress : address,
                ),
              ),
            );
            this.closeForm();
            this.toastService.success(
              this.transloco.translate('account.addresses.messages.updated'),
            );
          },
          error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
        });
      return;
    }

    const input: CreateAddressInput = {
      province: values.province.trim(),
      municipality: values.municipality.trim(),
      neighborhood: values.neighborhood.trim(),
      address: values.address.trim(),
      ...(values.label.trim() ? { label: values.label.trim() } : {}),
      ...(values.reference.trim() ? { reference: values.reference.trim() } : {}),
    };

    this.addressApi
      .createAddress(input)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (createdAddress) => {
          this.addresses.update((addresses) => this.orderAddresses([...addresses, createdAddress]));
          this.closeForm();
          this.toastService.success(this.transloco.translate('account.addresses.messages.created'));
        },
        error: (error: unknown) => this.formError.set(this.getErrorMessage(error)),
      });
  }

  setDefault(address: Address): void {
    if (address.isDefault || this.pendingActionId()) {
      return;
    }

    this.pendingActionId.set(address.id);
    this.addressApi
      .setDefaultAddress(address.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingActionId.set(null)),
      )
      .subscribe({
        next: (defaultAddress) => {
          this.addresses.update((addresses) =>
            this.orderAddresses(
              addresses.map((item) => ({
                ...item,
                isDefault: item.id === defaultAddress.id,
              })),
            ),
          );
          this.toastService.success(
            this.transloco.translate('account.addresses.messages.defaultUpdated'),
          );
        },
        error: (error: unknown) => this.toastService.error(this.getErrorMessage(error)),
      });
  }

  requestDelete(address: Address): void {
    this.confirmingDeletionId.set(address.id);
  }

  cancelDelete(): void {
    this.confirmingDeletionId.set(null);
  }

  confirmDelete(address: Address): void {
    if (this.pendingActionId()) {
      return;
    }

    this.pendingActionId.set(address.id);
    this.addressApi
      .deleteAddress(address.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingActionId.set(null)),
      )
      .subscribe({
        next: () => {
          this.addresses.update((addresses) => addresses.filter((item) => item.id !== address.id));
          this.confirmingDeletionId.set(null);
          this.toastService.success(this.transloco.translate('account.addresses.messages.deleted'));
        },
        error: (error: unknown) => {
          this.confirmingDeletionId.set(null);
          this.toastService.error(this.getErrorMessage(error));
        },
      });
  }

  private createUpdateInput(
    values: ReturnType<typeof this.form.getRawValue>,
    current: Address,
  ): UpdateAddressInput {
    const input: UpdateAddressInput = {};
    const label = values.label.trim();
    const reference = values.reference.trim();

    if (label !== (current.label ?? '')) {
      input.label = label || null;
    }
    if (values.province !== current.province || values.municipality !== current.municipality) {
      input.province = values.province.trim();
      input.municipality = values.municipality.trim();
    }
    if (values.neighborhood !== current.neighborhood) {
      input.neighborhood = values.neighborhood.trim();
    }
    if (values.address !== current.address) {
      input.address = values.address.trim();
    }
    if (reference !== (current.reference ?? '')) {
      input.reference = reference || null;
    }

    return input;
  }

  private resetForm(): void {
    this.form.reset({
      label: '',
      province: '',
      municipality: '',
      neighborhood: '',
      address: '',
      reference: '',
    });
    this.selectedProvince.set('');
    this.formError.set(null);
  }

  private orderAddresses(addresses: Address[]): Address[] {
    return [...addresses].sort(
      (first, second) => Number(second.isDefault) - Number(first.isDefault),
    );
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : this.transloco.translate('common.error');
  }
}

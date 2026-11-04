import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { AddressApiService } from '../data-access/address-api.service';
import { LocationApiService } from '../data-access/location-api.service';
import { Address, CreateAddressInput, UpdateAddressInput } from '../models/address.model';
import { AddressListPage } from './address-list.page';
import { of } from 'rxjs';

const address: Address = {
  id: 'address-1',
  userId: 'user-1',
  label: 'Casa',
  province: 'Luanda',
  municipality: 'Talatona',
  neighborhood: 'Talatona',
  address: 'Rua Direita de Talatona, casa 10',
  reference: 'Perto do mercado',
  latitude: null,
  longitude: null,
  isDefault: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const secondaryAddress: Address = {
  ...address,
  id: 'address-2',
  label: 'Escritório',
  municipality: 'Viana',
  address: 'Rua da Administração',
  isDefault: false,
};

const locations = [{ slug: 'luanda', name: 'Luanda', municipalities: ['Talatona', 'Viana'] }];

describe('AddressListPage', () => {
  let addressApi: {
    listAddresses: ReturnType<typeof vi.fn>;
    createAddress: ReturnType<typeof vi.fn>;
    updateAddress: ReturnType<typeof vi.fn>;
    setDefaultAddress: ReturnType<typeof vi.fn>;
    deleteAddress: ReturnType<typeof vi.fn>;
  };
  let locationApi: { listProvinceLocations: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    addressApi = {
      listAddresses: vi.fn(() => of([address, secondaryAddress])),
      createAddress: vi.fn((_input: CreateAddressInput) => of(address)),
      updateAddress: vi.fn((_id: string, _input: UpdateAddressInput) => of(address)),
      setDefaultAddress: vi.fn((_id: string) => of(secondaryAddress)),
      deleteAddress: vi.fn((_id: string) => of(undefined)),
    };
    locationApi = {
      listProvinceLocations: vi.fn(() => of(locations)),
    };

    await TestBed.configureTestingModule({
      imports: [AddressListPage],
      providers: [
        ...provideAppI18n(),
        provideRouter([]),
        { provide: AddressApiService, useValue: addressApi },
        { provide: LocationApiService, useValue: locationApi },
      ],
    }).compileComponents();
  });

  it('displays addresses returned by the API and marks the default address', async () => {
    const fixture = TestBed.createComponent(AddressListPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Casa');
    expect(page.textContent).toContain('Rua Direita de Talatona, casa 10');
    expect(page.textContent).toContain('Padrão');
    expect(addressApi.listAddresses).toHaveBeenCalledOnce();
    expect(locationApi.listProvinceLocations).toHaveBeenCalledOnce();
  });

  it('uses the selected province to provide the municipality options', async () => {
    const fixture = TestBed.createComponent(AddressListPage);
    const page = fixture.componentInstance;
    page.openCreateForm();
    page.form.controls.province.setValue('Luanda');
    page.onProvinceChange();
    fixture.detectChanges();
    await fixture.whenStable();

    const municipalitySelect = fixture.nativeElement.querySelector(
      '#address-municipality',
    ) as HTMLSelectElement | null;
    expect(municipalitySelect?.disabled).toBe(false);
    expect(Array.from(municipalitySelect?.options ?? []).map((option) => option.value)).toContain(
      'Talatona',
    );
    expect(page.form.controls.municipality.value).toBe('');
  });

  it('creates an address without fields that the user did not provide or control', () => {
    const fixture = TestBed.createComponent(AddressListPage);
    const page = fixture.componentInstance;
    page.openCreateForm();
    page.form.setValue({
      label: 'Casa',
      province: 'Luanda',
      municipality: '',
      neighborhood: 'Talatona',
      address: 'Rua Direita de Talatona, casa 10',
      reference: '',
    });
    page.onProvinceChange();
    page.form.controls.municipality.setValue('Talatona');

    page.submitForm();

    expect(addressApi.createAddress).toHaveBeenCalledWith({
      label: 'Casa',
      province: 'Luanda',
      municipality: 'Talatona',
      neighborhood: 'Talatona',
      address: 'Rua Direita de Talatona, casa 10',
    });
  });

  it('sends province and municipality together when only the municipality changes', () => {
    const fixture = TestBed.createComponent(AddressListPage);
    const page = fixture.componentInstance;
    page.openEditForm(address);
    page.form.controls.municipality.setValue('Viana');

    page.submitForm();

    expect(addressApi.updateAddress).toHaveBeenCalledWith('address-1', {
      province: 'Luanda',
      municipality: 'Viana',
    });
  });

  it('removes an address only after the inline confirmation action', () => {
    const fixture = TestBed.createComponent(AddressListPage);
    const page = fixture.componentInstance;
    fixture.detectChanges();
    page.requestDelete(secondaryAddress);
    fixture.detectChanges();

    expect(addressApi.deleteAddress).not.toHaveBeenCalled();
    page.confirmDelete(secondaryAddress);

    expect(addressApi.deleteAddress).toHaveBeenCalledWith('address-2');
    expect(page.addresses().map((item) => item.id)).toEqual(['address-1']);
  });
});

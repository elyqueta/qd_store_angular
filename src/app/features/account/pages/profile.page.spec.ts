import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { ApiError } from '../../../core/http/api-error.model';
import { ProfileApiService } from '../data-access/profile-api.service';
import { UserProfile } from '../models/profile.model';
import { ProfilePage } from './profile.page';

const profile: UserProfile = {
  id: 'user-1',
  fullName: 'Ana Silva',
  email: 'ana@example.com',
  phone: '923456789',
  nif: null,
  accountType: 'personal',
  role: 'customer',
  status: 'active',
  deactivatedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  profilePhoto: null,
};

describe('ProfilePage', () => {
  let api: { getMine: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    api = {
      getMine: vi.fn(() => of(profile)),
    };
    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [...provideAppI18n(), { provide: ProfileApiService, useValue: api }],
    }).compileComponents();
  });

  it('loads personal data from the profile endpoint', async () => {
    const fixture = TestBed.createComponent(ProfilePage);

    fixture.detectChanges();
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Ana Silva');
    expect(page.textContent).toContain('ana@example.com');
    expect(fixture.componentInstance.form.controls.phone.value).toBe('923456789');
    expect(page.querySelector('button')?.textContent).toContain('Editar');
    expect(api.getMine).toHaveBeenCalledOnce();
  });

  it('shows the API error and retry action when the profile cannot be loaded', async () => {
    api.getMine.mockReturnValue(
      throwError(() => new ApiError(503, 'Serviço de perfil indisponível.', [], null, null)),
    );
    const fixture = TestBed.createComponent(ProfilePage);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Serviço de perfil indisponível.');
    expect(fixture.nativeElement.textContent).toContain('Tentar novamente');
  });
});

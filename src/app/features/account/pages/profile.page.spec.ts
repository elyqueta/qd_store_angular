import { TestBed } from '@angular/core/testing';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { AuthStore } from '../../../core/auth/auth.store';
import { AuthResult } from '../../../core/auth/auth.models';
import { ProfilePage } from './profile.page';

const session: AuthResult = {
  user: {
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
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

describe('ProfilePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [...provideAppI18n()],
    }).compileComponents();
  });

  it('displays personal data from the authenticated session without editable controls', async () => {
    TestBed.inject(AuthStore).setSession(session);
    const fixture = TestBed.createComponent(ProfilePage);

    fixture.detectChanges();
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Ana Silva');
    expect(page.textContent).toContain('ana@example.com');
    expect(page.textContent).toContain('923456789');
    expect(page.textContent).toContain('Não indicado');
    expect(page.querySelector('input, button')).toBeNull();
  });

  it('shows an explicit session-data message when no user is available', async () => {
    const fixture = TestBed.createComponent(ProfilePage);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain(
      'Não foi possível apresentar os dados da sessão.',
    );
  });
});

import { computed, Injectable, signal } from '@angular/core';
import { AuthResult, AuthUser } from './auth.models';

export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly userState = signal<AuthUser | null>(null);
  private readonly accessTokenState = signal<string | null>(null);
  private readonly statusState = signal<AuthStatus>('unknown');

  readonly user = this.userState.asReadonly();
  readonly accessToken = this.accessTokenState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly isAuthenticated = computed(() => this.status() === 'authenticated');
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  setSession(session: AuthResult): void {
    this.userState.set(session.user);
    this.accessTokenState.set(session.accessToken);
    this.statusState.set('authenticated');
  }

  clearSession(): void {
    this.userState.set(null);
    this.accessTokenState.set(null);
    this.statusState.set('anonymous');
  }

  setAnonymous(): void {
    this.statusState.set('anonymous');
  }
}

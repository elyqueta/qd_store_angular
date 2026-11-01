import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

const REFRESH_TOKEN_KEY = 'qd.refresh';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getRefreshToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      return this.document.defaultView?.localStorage.getItem(REFRESH_TOKEN_KEY) ?? null;
    } catch (error: unknown) {
      console.error('Não foi possível ler o token de sessão guardado.', error);
      throw error;
    }
  }

  setRefreshToken(token: string): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      this.document.defaultView?.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error: unknown) {
      console.error('Não foi possível guardar o token de sessão.', error);
      throw error;
    }
  }

  clear(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      this.document.defaultView?.localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error: unknown) {
      console.error('Não foi possível remover o token de sessão guardado.', error);
      throw error;
    }
  }
}

import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { ToastKind, ToastMessage } from './toast.model';

const TOAST_DURATION_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly messagesState = signal<ToastMessage[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 0;

  readonly messages = this.messagesState.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      this.timers.clear();
    });
  }

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.messagesState.update((messages) => messages.filter((message) => message.id !== id));
  }

  private show(kind: ToastKind, message: string): void {
    const id = ++this.nextId;
    this.messagesState.update((messages) => [...messages, { id, kind, message }]);

    if (this.isBrowser) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), TOAST_DURATION_MS),
      );
    }
  }
}

import { Injectable, signal } from '@angular/core';
import { IconName } from '../../shared/ui/icon.component';

export interface FeedbackRequest {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly requestState = signal<FeedbackRequest | null>(null);
  readonly request = this.requestState.asReadonly();

  show(request: FeedbackRequest): void {
    this.requestState.set(request);
  }

  error(message: string, title = 'Não foi possível concluir a acção'): void {
    this.show({ icon: 'circle-exclamation', title, message });
  }

  dismiss(): void {
    this.requestState.set(null);
  }
}

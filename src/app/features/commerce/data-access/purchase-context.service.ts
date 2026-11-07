import { Injectable, signal } from '@angular/core';
import { CompanySnapshot } from '../models/commerce.model';

@Injectable({ providedIn: 'root' })
export class PurchaseContextService {
  private readonly snapshot = signal<CompanySnapshot | null>(null);

  readonly companySnapshot = this.snapshot.asReadonly();

  setCompanySnapshot(snapshot: CompanySnapshot): void {
    this.snapshot.set(snapshot);
  }

  clear(): void {
    this.snapshot.set(null);
  }
}

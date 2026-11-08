import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize, Observable } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { AccountType, UserRole, UserStatus } from '../../../core/auth/auth.models';
import { ApiError } from '../../../core/http/api-error.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { AdminUserApiService } from '../data-access/admin-user-api.service';
import {
  AdminUser,
  AdminUserDetail,
  AdminUserListPage,
  AdminUserPagination,
  AdminUserSort,
} from '../models/admin-user.model';

type PendingUserChange =
  | { kind: 'status'; userId: string; value: UserStatus }
  | { kind: 'role'; userId: string; value: UserRole };

const PAGE_SIZE = 20;

@Component({
  selector: 'qd-admin-users-page',
  imports: [DatePipe, ModalComponent, ReactiveFormsModule, TranslocoPipe],
  templateUrl: './admin-users.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersPage {
  private detailRequestSequence = 0;
  private readonly api = inject(AdminUserApiService);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly seo = inject(SeoService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly users = signal<AdminUser[]>([]);
  readonly pagination = signal<AdminUserPagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  readonly isLoading = signal(true);
  readonly hasLoadError = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly detail = signal<AdminUserDetail | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);
  readonly detailRequestId = signal<string | null>(null);
  readonly pendingConfirmation = signal<PendingUserChange | null>(null);
  readonly pendingActionId = signal<string | null>(null);

  readonly filters = this.formBuilder.group({
    search: [''],
    role: this.formBuilder.control<UserRole | ''>(''),
    status: this.formBuilder.control<UserStatus | ''>(''),
    accountType: this.formBuilder.control<AccountType | ''>(''),
    sort: this.formBuilder.control<AdminUserSort>('createdAt'),
  });
  readonly statusForm = this.formBuilder.group({
    status: this.formBuilder.control<UserStatus>('active'),
  });
  readonly roleForm = this.formBuilder.group({
    role: this.formBuilder.control<UserRole>('customer'),
  });

  constructor() {
    this.seo.setPage({
      title: this.transloco.translate('admin.users.seoTitle'),
      description: this.transloco.translate('admin.users.seoDescription'),
      canonicalPath: null,
      robots: 'noindex, nofollow',
    });
    this.loadUsers(1);
  }

  loadUsers(page = this.pagination().page): void {
    const values = this.filters.getRawValue();
    const search = values.search.trim();

    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.loadError.set(null);
    this.api
      .list({
        page,
        limit: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(values.role ? { role: values.role } : {}),
        ...(values.status ? { status: values.status } : {}),
        ...(values.accountType ? { accountType: values.accountType } : {}),
        sort: values.sort,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (result: AdminUserListPage) => {
          this.users.set(result.items);
          this.pagination.set(result.pagination);
        },
        error: (error: unknown) => {
          this.users.set([]);
          this.hasLoadError.set(true);
          this.loadError.set(this.getErrorMessage(error));
        },
      });
  }

  applyFilters(): void {
    this.loadUsers(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination().totalPages || this.isLoading()) {
      return;
    }
    this.loadUsers(page);
  }

  openDetails(user: AdminUser): void {
    const requestSequence = ++this.detailRequestSequence;
    this.detail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);
    this.detailRequestId.set(user.id);
    this.api
      .getById(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          if (
            this.detailRequestId() !== user.id ||
            requestSequence !== this.detailRequestSequence
          ) {
            return;
          }
          this.detail.set(detail);
          this.statusForm.setValue({ status: detail.status });
          this.roleForm.setValue({ role: detail.role });
          this.pendingConfirmation.set(null);
          this.detailLoading.set(false);
        },
        error: (error: unknown) => {
          if (
            this.detailRequestId() !== user.id ||
            requestSequence !== this.detailRequestSequence
          ) {
            return;
          }
          this.detailError.set(this.getErrorMessage(error));
          this.detailLoading.set(false);
        },
      });
  }

  closeDetails(): void {
    this.detailRequestSequence += 1;
    this.detail.set(null);
    this.detailError.set(null);
    this.pendingConfirmation.set(null);
    this.detailLoading.set(false);
    this.detailRequestId.set(null);
  }

  isCurrentUser(user: AdminUser): boolean {
    return user.id === this.authStore.user()?.id;
  }

  requestStatusChange(): void {
    const user = this.detail();
    const status = this.statusForm.controls.status.value;
    if (!user || this.isCurrentUser(user) || user.status === status) {
      return;
    }
    this.pendingConfirmation.set({ kind: 'status', userId: user.id, value: status });
  }

  requestRoleChange(): void {
    const user = this.detail();
    const role = this.roleForm.controls.role.value;
    if (!user || this.isCurrentUser(user) || user.role === role) {
      return;
    }
    this.pendingConfirmation.set({ kind: 'role', userId: user.id, value: role });
  }

  cancelConfirmation(): void {
    this.pendingConfirmation.set(null);
    const user = this.detail();
    if (user) {
      this.statusForm.setValue({ status: user.status });
      this.roleForm.setValue({ role: user.role });
    }
  }

  confirmationMessage(): string {
    const pending = this.pendingConfirmation();
    if (!pending) {
      return '';
    }
    const key =
      pending.kind === 'status'
        ? `admin.users.confirm.status.${pending.value}`
        : `admin.users.confirm.role.${pending.value}`;
    return this.transloco.translate(key, { name: this.detail()?.fullName ?? '' });
  }

  confirmChange(): void {
    const pending = this.pendingConfirmation();
    const user = this.detail();
    if (!pending || !user || pending.userId !== user.id || this.isCurrentUser(user)) {
      return;
    }

    this.pendingActionId.set(user.id);
    const request: Observable<AdminUserDetail> =
      pending.kind === 'status'
        ? this.api.updateStatus(user.id, { status: pending.value })
        : this.api.updateRole(user.id, { role: pending.value });

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingActionId.set(null)),
      )
      .subscribe({
        next: (updated) => {
          this.detail.set(updated);
          this.users.update((users) =>
            users.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.statusForm.setValue({ status: updated.status });
          this.roleForm.setValue({ role: updated.role });
          this.pendingConfirmation.set(null);
          this.toastService.success(this.transloco.translate('admin.users.messages.updated'));
        },
        error: (error: unknown) => {
          this.pendingConfirmation.set(null);
          this.toastService.error(this.getErrorMessage(error));
        },
      });
  }

  statusLabel(status: UserStatus): string {
    return this.transloco.translate(`admin.users.status.${status}`);
  }

  companyStatusLabel(status: string): string {
    if (status === 'active' || status === 'inactive' || status === 'banned') {
      return this.transloco.translate(`admin.users.status.${status}`);
    }
    return status;
  }

  roleLabel(role: UserRole): string {
    return this.transloco.translate(`admin.users.role.${role}`);
  }

  accountTypeLabel(accountType: AccountType): string {
    return this.transloco.translate(`admin.users.accountType.${accountType}`);
  }

  paginationLabel(): string {
    const pagination = this.pagination();
    return this.transloco.translate('admin.users.pagination.current', {
      ...pagination,
      totalPages: Math.max(1, pagination.totalPages),
    });
  }

  private getErrorMessage(error: unknown): string {
    if (!(error instanceof ApiError)) {
      return this.transloco.translate('common.error');
    }

    const statusKey: Record<number, string> = {
      403: 'admin.users.errors.forbidden',
      404: 'admin.users.errors.notFound',
      409: 'admin.users.errors.conflict',
      422: 'admin.users.errors.validation',
    };
    const message = error.message.trim();
    const key = statusKey[error.status];
    if (!key) {
      return message || this.transloco.translate('common.error');
    }

    const statusMessage = this.transloco.translate(key);
    return message ? `${statusMessage} ${message}` : statusMessage;
  }
}

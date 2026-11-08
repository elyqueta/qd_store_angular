import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { UserRole } from '../../../core/auth/auth.models';
import { provideAppI18n } from '../../../core/i18n/i18n.providers';
import { ToastService } from '../../../core/notifications/toast.service';
import { SeoService } from '../../../core/seo/seo.service';
import { AdminUserApiService } from '../data-access/admin-user-api.service';
import { AdminUser, AdminUserDetail } from '../models/admin-user.model';
import { AdminUsersPage } from './admin-users.page';

const user: AdminUser = {
  id: 'user-1',
  fullName: 'Utilizador de teste',
  email: 'user@example.com',
  phone: '+244900000000',
  nif: null,
  accountType: 'personal',
  role: 'customer',
  status: 'active',
  deactivatedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const detail: AdminUserDetail = {
  ...user,
  companies: [
    {
      id: 'company-1',
      name: 'QD Tecnologia',
      nif: '123456789',
      role: 'Comprador',
      status: 'active',
    },
  ],
};

describe('AdminUsersPage', () => {
  function configure(currentUserId = 'admin-1') {
    const listCalls: unknown[] = [];
    const roleUpdates: Array<{ id: string; role: string }> = [];
    const toastMessages: string[] = [];
    const api = {
      list: (params: unknown) => {
        listCalls.push(params);
        return of({
          items: [user],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        });
      },
      getById: () => of(detail),
      updateStatus: () => of(detail),
      updateRole: (id: string, input: { role: UserRole }) => {
        roleUpdates.push({ id, role: input.role });
        return of({ ...detail, role: input.role });
      },
    };

    TestBed.configureTestingModule({
      imports: [AdminUsersPage],
      providers: [
        ...provideAppI18n(),
        { provide: AdminUserApiService, useValue: api },
        { provide: AuthStore, useValue: { user: () => ({ ...user, id: currentUserId }) } },
        { provide: SeoService, useValue: { setPage: () => undefined } },
        {
          provide: ToastService,
          useValue: {
            success: (message: string) => toastMessages.push(message),
            error: (message: string) => toastMessages.push(message),
          },
        },
      ],
    });

    return { listCalls, roleUpdates, toastMessages };
  }

  it('submits the supported search and filters with the paginated list request', async () => {
    const { listCalls } = configure();
    const fixture = TestBed.createComponent(AdminUsersPage);
    fixture.detectChanges();

    fixture.componentInstance.filters.setValue({
      search: ' Ana Silva ',
      role: 'customer',
      status: 'active',
      accountType: 'business',
      sort: 'email',
    });
    fixture.componentInstance.applyFilters();

    expect(listCalls.at(-1)).toEqual({
      page: 1,
      limit: 20,
      search: 'Ana Silva',
      role: 'customer',
      status: 'active',
      accountType: 'business',
      sort: 'email',
    });
    expect(fixture.componentInstance.pagination().total).toBe(1);
  });

  it('requires confirmation before changing a role and updates the list after success', async () => {
    const { roleUpdates, toastMessages } = configure();
    const fixture = TestBed.createComponent(AdminUsersPage);
    fixture.detectChanges();

    fixture.componentInstance.openDetails(user);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    fixture.componentInstance.roleForm.setValue({ role: 'admin' });
    fixture.componentInstance.requestRoleChange();

    expect(roleUpdates).toEqual([]);
    expect(fixture.componentInstance.pendingConfirmation()).toEqual({
      kind: 'role',
      userId: user.id,
      value: 'admin',
    });

    fixture.componentInstance.confirmChange();

    expect(roleUpdates).toEqual([{ id: user.id, role: 'admin' }]);
    expect(fixture.componentInstance.users()[0].role).toBe('admin');
    expect(toastMessages).toContain('Dados do utilizador actualizados.');
    fixture.componentInstance.closeDetails();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('prevents changing the current administrator account', () => {
    const { roleUpdates } = configure(user.id);
    const fixture = TestBed.createComponent(AdminUsersPage);
    fixture.detectChanges();

    fixture.componentInstance.openDetails(user);
    fixture.componentInstance.roleForm.setValue({ role: 'admin' });
    fixture.componentInstance.requestRoleChange();
    fixture.componentInstance.confirmChange();

    expect(fixture.componentInstance.pendingConfirmation()).toBeNull();
    expect(roleUpdates).toEqual([]);
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminUserApiService } from './admin-user-api.service';

const endpoint = `${environment.apiUrl}/api/v1/admin/users`;
const user = {
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
  profilePhoto: null,
};
const pagination = { page: 2, limit: 20, total: 25, totalPages: 2 };

describe('AdminUserApiService', () => {
  let api: AdminUserApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AdminUserApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends supported filters and unwraps paginated users', async () => {
    const response = firstValueFrom(
      api.list({
        page: 2,
        limit: 20,
        search: 'Ana Silva',
        role: 'customer',
        status: 'active',
        accountType: 'business',
        sort: 'email',
      }),
    );
    const request = httpTesting.expectOne(
      `${endpoint}?page=2&limit=20&sort=email&search=Ana%20Silva&role=customer&status=active&accountType=business`,
    );

    expect(request.request.method).toBe('GET');
    request.flush({ status: 'success', data: [user], pagination });

    await expect(response).resolves.toEqual({ items: [user], pagination });
  });

  it('loads user details and updates status and role using their dedicated endpoints', async () => {
    const detail = {
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

    const detailResponse = firstValueFrom(api.getById(user.id));
    const detailRequest = httpTesting.expectOne(`${endpoint}/${user.id}`);
    expect(detailRequest.request.method).toBe('GET');
    detailRequest.flush({ status: 'success', data: detail });
    await expect(detailResponse).resolves.toEqual(detail);

    const statusResponse = firstValueFrom(api.updateStatus(user.id, { status: 'inactive' }));
    const statusRequest = httpTesting.expectOne(`${endpoint}/${user.id}/status`);
    expect(statusRequest.request.method).toBe('PATCH');
    expect(statusRequest.request.body).toEqual({ status: 'inactive' });
    statusRequest.flush({ status: 'success', data: { ...detail, status: 'inactive' } });
    await expect(statusResponse).resolves.toMatchObject({ status: 'inactive' });

    const roleResponse = firstValueFrom(api.updateRole(user.id, { role: 'admin' }));
    const roleRequest = httpTesting.expectOne(`${endpoint}/${user.id}/role`);
    expect(roleRequest.request.method).toBe('PATCH');
    expect(roleRequest.request.body).toEqual({ role: 'admin' });
    roleRequest.flush({ status: 'success', data: { ...detail, role: 'admin' } });
    await expect(roleResponse).resolves.toMatchObject({ role: 'admin' });
  });
});

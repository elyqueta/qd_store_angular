import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { apiErrorInterceptor } from '../../../core/http/api-error.interceptor';
import { ProfileApiService } from './profile-api.service';

describe('ProfileApiService', () => {
  let api: ProfileApiService;
  let httpTesting: HttpTestingController;
  const endpoint = `${environment.apiUrl}/api/v1/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(ProfileApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends profile updates as multipart form data without setting Content-Type', async () => {
    const body = new FormData();
    body.append('fullName', 'Ana Silva');

    const result = firstValueFrom(api.updateMine(body));
    const request = httpTesting.expectOne(`${endpoint}/me`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBe(body);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush({ status: 'success', data: { fullName: 'Ana Silva' } });

    await expect(result).resolves.toEqual({ fullName: 'Ana Silva' });
  });

  it('uses the dedicated endpoint to remove the profile photo', async () => {
    const result = firstValueFrom(api.removePhoto());
    const request = httpTesting.expectOne(`${endpoint}/me/photo`);

    expect(request.request.method).toBe('DELETE');
    request.flush({ status: 'success', data: { profilePhoto: null } });

    await expect(result).resolves.toEqual({ profilePhoto: null });
  });
});

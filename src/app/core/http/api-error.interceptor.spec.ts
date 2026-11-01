import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ApiError } from './api-error.model';
import { apiErrorInterceptor } from './api-error.interceptor';

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('converts an API error and preserves validation fields', async () => {
    const responseBody = {
      status: 'error',
      message: 'Dados inválidos.',
      details: [{ field: 'email', message: 'Endereço inválido.' }],
    };
    const request = firstValueFrom(http.get('/api/test')).catch((error: unknown) => error);

    httpTesting.expectOne('/api/test').flush(responseBody, {
      status: 422,
      statusText: 'Unprocessable Entity',
    });

    const error = await request;
    expect(error).toBeInstanceOf(ApiError);
    if (!(error instanceof ApiError)) {
      throw new Error('A resposta HTTP não foi convertida para ApiError.');
    }

    expect(error.status).toBe(422);
    expect(error.message).toBe('Dados inválidos.');
    expect(error.details).toEqual([{ field: 'email', message: 'Endereço inválido.' }]);
    expect(error.responseBody).toBe(responseBody);
  });

  it('keeps unexpected response bodies and uses the HTTP error message', async () => {
    const responseBody = { reason: 'Unexpected payload' };
    const request = firstValueFrom(http.get('/api/test')).catch((error: unknown) => error);

    httpTesting.expectOne('/api/test').flush(responseBody, {
      status: 500,
      statusText: 'Server Error',
    });

    const error = await request;
    expect(error).toBeInstanceOf(ApiError);
    if (!(error instanceof ApiError)) {
      throw new Error('A resposta HTTP não foi convertida para ApiError.');
    }

    expect(error.status).toBe(500);
    expect(error.message).toContain('500');
    expect(error.details).toEqual([]);
    expect(error.responseBody).toBe(responseBody);
  });

  it('represents network failures with status zero and retains the original error', async () => {
    const request = firstValueFrom(http.get('/api/test')).catch((error: unknown) => error);
    const networkError = new ProgressEvent('error');

    httpTesting.expectOne('/api/test').error(networkError);

    const error = await request;
    expect(error).toBeInstanceOf(ApiError);
    if (!(error instanceof ApiError)) {
      throw new Error('A falha de rede não foi convertida para ApiError.');
    }

    expect(error.status).toBe(0);
    expect(error.message).toContain('0');
    expect(error.cause).toBeInstanceOf(HttpErrorResponse);
  });
});

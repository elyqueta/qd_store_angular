import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError, ApiErrorDetail } from './api-error.model';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readDetails(value: unknown): ApiErrorDetail[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((detail): ApiErrorDetail[] => {
    if (
      !isRecord(detail) ||
      typeof detail['field'] !== 'string' ||
      typeof detail['message'] !== 'string'
    ) {
      return [];
    }

    return [{ field: detail['field'], message: detail['message'] }];
  });
}

function toApiError(error: HttpErrorResponse): ApiError {
  const body = error.error;
  const message =
    isRecord(body) && body['status'] === 'error' && typeof body['message'] === 'string'
      ? body['message']
      : error.message;

  return new ApiError(
    error.status,
    message,
    isRecord(body) ? readDetails(body['details']) : [],
    body,
    error,
  );
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      return throwError(() => toApiError(error));
    }),
  );

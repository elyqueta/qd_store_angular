export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details: readonly ApiErrorDetail[],
    readonly responseBody: unknown,
    cause: unknown,
  ) {
    super(message, { cause });
    this.name = 'ApiError';
  }
}

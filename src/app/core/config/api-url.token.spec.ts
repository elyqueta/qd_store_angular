import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { API_URL } from './api-url.token';

describe('API_URL', () => {
  it('uses the API URL configured for the current environment', () => {
    expect(TestBed.inject(API_URL)).toBe(environment.apiUrl);
  });
});

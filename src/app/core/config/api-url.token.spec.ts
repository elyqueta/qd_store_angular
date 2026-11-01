import { TestBed } from '@angular/core/testing';
import { API_URL } from './api-url.token';

describe('API_URL', () => {
  it('uses the documented development API URL', () => {
    expect(TestBed.inject(API_URL)).toBe('http://localhost:3000');
  });
});

import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => {
    if (!environment.apiUrl) {
      throw new Error('API_URL não está configurado para este ambiente.');
    }

    return environment.apiUrl;
  },
});

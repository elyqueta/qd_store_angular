import { Routes } from '@angular/router';

export const accountRoutes: Routes = [
  {
    path: 'perfil',
    loadComponent: () => import('./pages/profile.page').then((module) => module.ProfilePage),
  },
  {
    path: 'moradas',
    loadComponent: () =>
      import('./pages/address-list.page').then((module) => module.AddressListPage),
  },
];

import { Routes } from '@angular/router';

export const accountRoutes: Routes = [
  {
    path: 'perfil',
    loadComponent: () => import('./pages/profile.page').then((module) => module.ProfilePage),
  },
];

import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/admin-dashboard.page').then((module) => module.AdminDashboardPage),
  },
];

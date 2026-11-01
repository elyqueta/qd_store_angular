import { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth/auth.guards';

export const authRoutes: Routes = [
  {
    path: 'entrar',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login.page').then((module) => module.LoginPage),
  },
  {
    path: 'criar-conta',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register.page').then((module) => module.RegisterPage),
  },
];

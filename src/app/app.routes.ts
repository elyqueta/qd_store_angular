import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { AccountLayoutComponent } from './layouts/account/account-layout.component';
import { PublicLayoutComponent } from './layouts/public/public-layout.component';

export const routes: Routes = [
  {
    path: 'conta',
    component: AccountLayoutComponent,
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/account/account.routes').then((module) => module.accountRoutes),
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: 'entrar',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/login.page').then((module) => module.LoginPage),
      },
      {
        path: 'criar-conta',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/register.page').then((module) => module.RegisterPage),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/public/public.routes').then((module) => module.publicRoutes),
      },
    ],
  },
];

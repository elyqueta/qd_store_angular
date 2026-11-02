import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home.page').then((module) => module.HomePage),
  },
  {
    path: 'produtos',
    loadComponent: () => import('./pages/catalog.page').then((module) => module.CatalogPage),
  },
  {
    path: 'produtos/:id',
    loadComponent: () => import('./pages/product.page').then((module) => module.ProductPage),
  },
  {
    path: 'sobre',
    loadComponent: () => import('./pages/about.page').then((module) => module.AboutPage),
  },
  {
    path: 'contactos',
    loadComponent: () => import('./pages/contact.page').then((module) => module.ContactPage),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found.page').then((module) => module.NotFoundPage),
  },
];

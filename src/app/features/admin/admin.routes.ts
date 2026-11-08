import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: 'empresas',
    loadComponent: () =>
      import('./pages/admin-companies.page').then((module) => module.AdminCompaniesPage),
  },
  {
    path: 'tipos-entrega',
    loadComponent: () =>
      import('./pages/admin-delivery-types.page').then((module) => module.AdminDeliveryTypesPage),
  },
  {
    path: 'produtos/novo',
    loadComponent: () =>
      import('./pages/admin-product-form.page').then((module) => module.AdminProductFormPage),
  },
  {
    path: 'produtos/:id',
    loadComponent: () =>
      import('./pages/admin-product-form.page').then((module) => module.AdminProductFormPage),
  },
  {
    path: 'produtos',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/admin-products.page').then((module) => module.AdminProductsPage),
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/admin-dashboard.page').then((module) => module.AdminDashboardPage),
  },
  {
    path: 'destaques',
    loadComponent: () =>
      import('./pages/admin-highlights.page').then((module) => module.AdminHighlightsPage),
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./pages/admin-categories.page').then((module) => module.AdminCategoriesPage),
  },
];

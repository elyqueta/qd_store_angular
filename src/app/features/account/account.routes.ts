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
  {
    path: 'empresas/nova',
    loadComponent: () =>
      import('./pages/company-create.page').then((module) => module.CompanyCreatePage),
  },
  {
    path: 'empresas',
    loadComponent: () =>
      import('./pages/company-list.page').then((module) => module.CompanyListPage),
  },
  {
    path: 'carrinho',
    loadComponent: () => import('../commerce/pages/cart.page').then((module) => module.CartPage),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('../commerce/pages/checkout.page').then((module) => module.CheckoutPage),
  },
  {
    path: 'favoritos',
    loadComponent: () =>
      import('../commerce/pages/wishlist.page').then((module) => module.WishlistPage),
  },
  {
    path: 'encomendas',
    loadComponent: () =>
      import('../commerce/pages/orders.page').then((module) => module.OrdersPage),
  },
  {
    path: 'encomendas/:id',
    loadComponent: () =>
      import('../commerce/pages/order-detail.page').then((module) => module.OrderDetailPage),
  },
  {
    path: 'notificacoes',
    loadComponent: () =>
      import('../commerce/pages/notifications.page').then((module) => module.NotificationsPage),
  },
];

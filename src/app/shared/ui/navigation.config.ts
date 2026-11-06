import { UserRole } from '../../core/auth/auth.models';

export interface NavigationItem {
  labelKey: string;
  route: string;
}

export type UserMenuAction = 'theme' | 'logout';

export type UserMenuItem =
  | { kind: 'link'; labelKey: string; route: string; roles?: readonly UserRole[] }
  | { kind: 'action'; labelKey: string; action: UserMenuAction; roles?: readonly UserRole[] };

export const NAV_ITEMS: readonly NavigationItem[] = [
  { labelKey: 'nav.home', route: '/' },
];

export const USER_MENU_ITEMS: readonly UserMenuItem[] = [
  { kind: 'link', labelKey: 'nav.admin', route: '/admin', roles: ['admin'] },
  { kind: 'link', labelKey: 'nav.profile', route: '/conta/perfil' },
  { kind: 'link', labelKey: 'nav.addresses', route: '/conta/moradas' },
  { kind: 'link', labelKey: 'nav.companies', route: '/conta/empresas' },
  { kind: 'link', labelKey: 'nav.cart', route: '/conta/carrinho' },
  { kind: 'link', labelKey: 'nav.wishlist', route: '/conta/favoritos' },
  { kind: 'link', labelKey: 'nav.orders', route: '/conta/encomendas' },
  { kind: 'link', labelKey: 'nav.notifications', route: '/conta/notificacoes' },
  { kind: 'action', action: 'theme', labelKey: 'nav.themeToggle' },
  { kind: 'action', action: 'logout', labelKey: 'nav.logout' },
];

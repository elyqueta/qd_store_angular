export interface NavigationItem {
  labelKey: string;
  route: string;
}

export type UserMenuAction = 'theme' | 'logout';

export type UserMenuItem =
  | { kind: 'link'; labelKey: string; route: string }
  | { kind: 'action'; labelKey: string; action: UserMenuAction };

export const NAV_ITEMS: readonly NavigationItem[] = [
  { labelKey: 'nav.home', route: '/' },
  { labelKey: 'nav.catalog', route: '/produtos' },
  { labelKey: 'nav.about', route: '/sobre' },
  { labelKey: 'nav.contact', route: '/contactos' },
];

export const USER_MENU_ITEMS: readonly UserMenuItem[] = [
  { kind: 'link', labelKey: 'nav.profile', route: '/conta/perfil' },
  { kind: 'action', action: 'theme', labelKey: 'nav.themeToggle' },
  { kind: 'action', action: 'logout', labelKey: 'nav.logout' },
];

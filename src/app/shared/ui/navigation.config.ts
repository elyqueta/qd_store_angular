export interface NavigationItem {
  labelKey: string;
  route: string;
}

export type UserMenuAction = 'theme' | 'logout';

export interface UserMenuItem {
  action: UserMenuAction;
  labelKey: string;
}

export const NAV_ITEMS: readonly NavigationItem[] = [
  { labelKey: 'nav.home', route: '/' },
  { labelKey: 'nav.catalog', route: '/produtos' },
  { labelKey: 'nav.about', route: '/sobre' },
  { labelKey: 'nav.contact', route: '/contactos' },
];

export const USER_MENU_ITEMS: readonly UserMenuItem[] = [
  { action: 'theme', labelKey: 'nav.themeToggle' },
  { action: 'logout', labelKey: 'nav.logout' },
];

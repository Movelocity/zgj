import { APP_NAV_ITEMS, type ModuleNavItem } from '@/modules';
import { ROUTES } from '@/utils/constants';

export type HeaderNavItem = Omit<ModuleNavItem, 'order'>;

export const HEADER_PRIMARY_NAV_ITEMS: HeaderNavItem[] = APP_NAV_ITEMS.map(({ path, label }) => ({
  path,
  label,
}));

export const HEADER_GUIDE_ITEM: HeaderNavItem = {
  path: ROUTES.CONTACT,
  label: '使用指南',
};

export const HEADER_ADMIN_ITEM: HeaderNavItem = {
  path: ROUTES.ADMINISTRATOR,
  label: '管理后台',
};

export const HEADER_PROFILE_ITEM: HeaderNavItem = {
  path: ROUTES.PROFILE,
  label: '我的账号',
};

export function getFirstLevelPath(path: string): string {
  return `/${path.split('/')[1] || ''}`;
}

export function isActiveHeaderPath(currentPath: string, navPath: string): boolean {
  return getFirstLevelPath(currentPath) === getFirstLevelPath(navPath);
}

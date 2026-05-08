import { ROUTES } from '@/utils/constants';

export interface HeaderNavItem {
  path: string;
  label: string;
}

export const HEADER_PRIMARY_NAV_ITEMS: HeaderNavItem[] = [
  {
    path: ROUTES.HOME,
    label: '首页',
  },
  {
    path: ROUTES.SIMPLE_RESUME,
    label: '简历优化',
  },
  {
    path: ROUTES.JOB_RESUME,
    label: '职位匹配',
  },
  {
    path: ROUTES.OPPORTUNITIES,
    label: '岗位机会',
  },
  {
    path: ROUTES.RESUMES,
    label: '我的简历',
  },
  {
    path: ROUTES.INTERVIEW,
    label: '面试复盘',
  },
];

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

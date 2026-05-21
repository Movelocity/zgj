import { lazy } from 'react';
import { ROUTES } from '@/utils/constants';
import type { FrontendModule } from '../types';

const Auth = lazy(() => import('@/pages/auth/Auth2'));
const CodeAuth = lazy(() => import('@/pages/auth/CodeAuth'));
const Profile = lazy(() => import('@/pages/profile/Profile'));
const Administrator = lazy(() => import('@/pages/admin/Administrator'));

export const accountModule: FrontendModule = {
  id: 'account-admin',
  name: '账号与后台',
  description: '负责登录注册、个人中心和管理员后台入口。',
  ownerHint: '适合由账号体系/后台管理方向维护。',
  routes: [
    {
      path: ROUTES.AUTH,
      element: <Auth />,
    },
    {
      path: '/register',
      element: <Auth />,
    },
    {
      path: ROUTES.CODE_AUTH,
      element: <CodeAuth />,
    },
    {
      path: ROUTES.PROFILE,
      element: <Profile />,
      access: 'protected',
    },
    {
      path: ROUTES.ADMINISTRATOR,
      element: <Administrator />,
      access: 'admin',
    },
  ],
};

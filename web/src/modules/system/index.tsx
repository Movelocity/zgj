import { lazy } from 'react';
import type { FrontendModule } from '../types';

const TemplateDemo = lazy(() => import('@/pages/test/TemplateDemo'));
const AllTests = lazy(() => import('@/pages/test/AllTests'));
const ServerError = lazy(() => import('@/pages/error/ServerError'));
const NotFound = lazy(() => import('@/pages/error/NotFound'));

export const systemModule: FrontendModule = {
  id: 'system-tools',
  name: '系统与测试页',
  description: '负责错误页、测试页和开发辅助入口，不显示在顶部导航。',
  ownerHint: '适合由基础设施/测试工具方向维护。',
  routes: [
    {
      path: '/test/templates',
      element: <TemplateDemo />,
    },
    {
      path: '/test/all',
      element: <AllTests />,
    },
    {
      path: '/500',
      element: <ServerError />,
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ],
};

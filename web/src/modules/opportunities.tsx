import { lazy } from 'react';
import { ROUTES } from '@/utils/constants';
import type { FrontendModule } from './types';

const Opportunities = lazy(() => import('@/pages/opportunities/Opportunities'));

export const opportunitiesModule: FrontendModule = {
  id: 'opportunities',
  name: '岗位机会',
  description: '负责岗位列表、岗位搜索、简历上传匹配和机会展示。',
  ownerHint: '适合由岗位库/搜索匹配方向维护。',
  nav: {
    path: ROUTES.OPPORTUNITIES,
    label: '岗位机会',
    order: 40,
  },
  routes: [
    {
      path: ROUTES.OPPORTUNITIES,
      element: <Opportunities />,
    },
  ],
};

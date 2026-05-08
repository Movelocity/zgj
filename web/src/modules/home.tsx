import { lazy } from 'react';
import { ROUTES } from '@/utils/constants';
import type { FrontendModule } from './types';

const Home = lazy(() => import('@/pages/home/Home2'));
const Contact = lazy(() => import('@/pages/contact/Contact'));

export const homeModule: FrontendModule = {
  id: 'home',
  name: '首页与使用指南',
  description: '负责首页、品牌入口和使用指南页面。',
  ownerHint: '适合由增长/产品展示方向维护。',
  nav: {
    path: ROUTES.HOME,
    label: '首页',
    order: 10,
  },
  routes: [
    {
      path: ROUTES.HOME,
      element: <Home />,
    },
    {
      path: ROUTES.CONTACT,
      element: <Contact />,
    },
  ],
};

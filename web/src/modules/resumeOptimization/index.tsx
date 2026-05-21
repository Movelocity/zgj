import { lazy } from 'react';
import { ROUTES } from '@/utils/constants';
import type { FrontendModule } from '../types';

const SimpleResume = lazy(() => import('@/pages/resume/SimpleResume'));

export const resumeOptimizationModule: FrontendModule = {
  id: 'resume-optimization',
  name: '简历优化',
  description: '负责简历上传、解析、结构化编辑和 AI 优化入口。',
  ownerHint: '适合由简历编辑/AI 工作流方向维护。',
  nav: {
    path: ROUTES.SIMPLE_RESUME,
    label: '简历优化',
    order: 20,
  },
  routes: [
    {
      path: ROUTES.SIMPLE_RESUME,
      element: <SimpleResume />,
      access: 'protected',
    },
  ],
};

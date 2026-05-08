import { lazy } from 'react';
import { ROUTES } from '@/utils/constants';
import type { FrontendModule } from './types';

const JobResume = lazy(() => import('@/pages/resume/JobResume'));

export const jobMatchingModule: FrontendModule = {
  id: 'job-matching',
  name: '职位匹配',
  description: '负责基于职位描述的简历匹配与定向优化入口。',
  ownerHint: '适合由 JD 匹配/推荐策略方向维护。',
  nav: {
    path: ROUTES.JOB_RESUME,
    label: '职位匹配',
    order: 30,
  },
  routes: [
    {
      path: ROUTES.JOB_RESUME,
      element: <JobResume />,
      access: 'protected',
    },
  ],
};

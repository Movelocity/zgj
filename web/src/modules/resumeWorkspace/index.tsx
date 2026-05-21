import { lazy } from 'react';
import { ROUTES } from '@/utils/constants';
import type { FrontendModule } from '../types';

const ResumeList = lazy(() => import('@/pages/resume/ResumeList'));
const ResumeCardView = lazy(() => import('@/pages/resume/ResumeCardView'));
const ResumeDetail = lazy(() => import('@/pages/resume/ResumeDetail'));
const ResumeEditor = lazy(() => import('@/pages/editor/ResumeDetails'));
const ResumeExportView = lazy(() => import('@/pages/export/ResumeExportView'));

export const resumeWorkspaceModule: FrontendModule = {
  id: 'resume-workspace',
  name: '我的简历',
  description: '负责简历列表、卡片视图、编辑器、详情页和导出渲染页。',
  ownerHint: '适合由简历资产/编辑器方向维护。',
  nav: {
    path: ROUTES.RESUMES,
    label: '我的简历',
    order: 50,
  },
  routes: [
    {
      path: ROUTES.RESUMES,
      element: <ResumeList />,
      access: 'protected',
    },
    {
      path: ROUTES.RESUME_CARDS,
      element: <ResumeCardView />,
      access: 'protected',
    },
    {
      path: '/resume/:id',
      element: <ResumeDetail />,
      access: 'protected',
    },
    {
      path: '/editor/:id',
      element: <ResumeEditor />,
      access: 'protected',
    },
    {
      path: '/editor/v2/:id',
      element: <ResumeEditor />,
      access: 'protected',
    },
    {
      path: '/export/:taskId',
      element: <ResumeExportView />,
      layout: 'standalone',
    },
  ],
};

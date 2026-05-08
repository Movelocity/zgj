import { lazy } from 'react';
import { ROUTES } from '@/utils/constants';
import type { FrontendModule } from './types';

const InterviewReviewList = lazy(() => import('@/pages/interview/InterviewReviewList'));
const InterviewReviews = lazy(() => import('@/pages/interview/InterviewReviews'));

export const interviewReviewModule: FrontendModule = {
  id: 'interview-review',
  name: '面试复盘',
  description: '负责面试复盘列表、详情和创建分析流程。',
  ownerHint: '适合由面试复盘/ASR 分析方向维护。',
  nav: {
    path: ROUTES.INTERVIEW,
    label: '面试复盘',
    order: 60,
  },
  routes: [
    {
      path: ROUTES.INTERVIEW,
      element: <InterviewReviewList />,
      access: 'protected',
    },
    {
      path: ROUTES.INTERVIEW_REVIEWS,
      element: <InterviewReviews />,
      access: 'protected',
    },
  ],
};

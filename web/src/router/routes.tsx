import { lazy } from 'react';
// import { RouteObject } from 'react-router-dom';

// 懒加载页面组件
const Home = lazy(() => import('@/pages/home/Home'));
const Auth = lazy(() => import('@/pages/auth/Auth'));
const CodeAuth = lazy(() => import('@/pages/auth/CodeAuth'));
const SimpleResume = lazy(() => import('@/pages/resume/SimpleResume'));
const JobResume = lazy(() => import('@/pages/resume/JobResume'));
const ResumeList = lazy(() => import('@/pages/resume/ResumeList'));
const ResumeDetail = lazy(() => import('@/pages/resume/ResumeDetail'));
const Profile = lazy(() => import('@/pages/profile/Profile'));
const Administrator = lazy(() => import('@/pages/admin/Administrator'));
const ApiTest = lazy(() => import('@/pages/test/ApiTest'));
const NotFound = lazy(() => import('@/pages/error/NotFound'));
const ServerError = lazy(() => import('@/pages/error/ServerError'));

// 路由配置
export const routes = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/code-auth',
    element: <CodeAuth />,
  },
  {
    path: '/simple-resume',
    element: <SimpleResume />,
  },
  {
    path: '/job-resume',
    element: <JobResume />,
  },
  {
    path: '/resumes',
    element: <ResumeList />,
  },
  {
    path: '/resume/:id',
    element: <ResumeDetail />,
  },
  {
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '/administrator',
    element: <Administrator />,
  },
  {
    path: '/api-test',
    element: <ApiTest />,
  },
  {
    path: '/500',
    element: <ServerError />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;

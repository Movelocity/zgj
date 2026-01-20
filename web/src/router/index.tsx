import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, useRouteError } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Loading from '@/components/ui/Loading';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AdminRoute from '@/components/common/AdminRoute';
import ChunkLoadError from '@/pages/error/ChunkLoadError';
import { lazy } from 'react';
// import { lazyWithRetry } from '@/utils/lazyWithRetry'; // 可选：使用带重试的懒加载

// 懒加载页面组件
const Home = lazy(() => import('@/pages/home/Home2'));
const Auth = lazy(() => import('@/pages/auth/Auth2'));
const CodeAuth = lazy(() => import('@/pages/auth/CodeAuth'));
const SimpleResume = lazy(() => import('@/pages/resume/SimpleResume'));
const JobResume = lazy(() => import('@/pages/resume/JobResume'));
const ResumeList = lazy(() => import('@/pages/resume/ResumeList'));
const ResumeCardView = lazy(() => import('@/pages/resume/ResumeCardView'));
const ResumeDetail = lazy(() => import('@/pages/resume/ResumeDetail'));
const ResumeEditor = lazy(() => import('@/pages/editor/ResumeDetails'));
const ResumeExportView = lazy(() => import('@/pages/export/ResumeExportView'));
const Profile = lazy(() => import('@/pages/profile/Profile'));
const Administrator = lazy(() => import('@/pages/admin/Administrator'));
const Contact = lazy(() => import('@/pages/contact/Contact'));
const NotFound = lazy(() => import('@/pages/error/NotFound'));
const ServerError = lazy(() => import('@/pages/error/ServerError'));
// const TOSTest = lazy(() => import('@/pages/test/TOSTest'));
// const ASRTest = lazy(() => import('@/pages/test/ASRTest'));
const AllTests = lazy(() => import('@/pages/test/AllTests'));
const InterviewReviews = lazy(() => import('@/pages/interview/InterviewReviews'));
const InterviewReviewList = lazy(() => import('@/pages/interview/InterviewReviewList'));
const TemplateDemo = lazy(() => import('@/pages/test/TemplateDemo'));

// 路由错误处理组件
function RouteErrorBoundary() {
  const error = useRouteError() as Error;
  return <ChunkLoadError error={error} />;
}

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
    path: '/register',
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
    path: '/resumes/cards',
    element: <ResumeCardView />,
  },
  {
    path: '/resume/:id',
    element: <ResumeDetail />,
  },
  {
    path: '/editor/:id',
    element: <ResumeEditor />,
  },
  {
    path: '/editor/v2/:id',
    element: <ResumeEditor />,
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
    path: '/contact',
    element: <Contact />,
  },
  {
    path: '/interview',
    element: <InterviewReviewList />,
  },
  {
    path: '/interview/reviews',
    element: <InterviewReviews />,
  },
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
];


// 包装需要认证的路由
const protectedRoutes = [
  '/simple-resume',
  '/job-resume',
  '/resumes',
  '/resumes/cards',
  '/resume/:id',
  '/editor/:id',
  '/editor/v2/:id',
  '/profile',
  '/interview', // 面试复盘列表页需要登录
  '/interview/reviews', // 面试复盘详情/创建页面需要登录
  '/api-test', // API测试页面需要登录才能访问
  '/test/tos', // TOS服务测试页面需要登录
  '/test/asr', // ASR服务测试页面需要登录
];

const adminRoutes = [
  '/administrator',
  '/test-modal',
];

// 创建路由器
const router = createBrowserRouter([
  // 导出渲染页面（不需要Layout，独立路由）
  {
    path: '/export/:taskId',
    element: (
      <Suspense fallback={<Loading />}>
        <ResumeExportView />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  // 主应用路由
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: routes.map(route => {
      let element = route.element;
      
      // 包装需要认证的路由
      if (protectedRoutes.some(path => 
        path === route.path || 
        (path.includes(':') && route.path?.match(path.replace(':id', '[^/]+')))
      )) {
        element = <ProtectedRoute>{route.element}</ProtectedRoute>;
      }
      
      // 包装管理员路由
      if (adminRoutes.includes(route.path as string)) {
        element = <AdminRoute>{route.element}</AdminRoute>;
      }
      
      return {
        ...route,
        element: (
          <Suspense fallback={<Loading />}>
            {element}
          </Suspense>
        ),
        errorElement: <RouteErrorBoundary />,
      };
    }),
  },
]);

// 路由提供者组件
export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;

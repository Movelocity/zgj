import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Loading from '@/components/ui/Loading';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AdminRoute from '@/components/common/AdminRoute';
import { lazy } from 'react';

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
const NotFound = lazy(() => import('@/pages/error/NotFound'));
const ServerError = lazy(() => import('@/pages/error/ServerError'));
const TestModal = lazy(() => import('@/pages/test/Modal.example'));

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
    path: '/test-modal',
    element: <TestModal />,
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
  '/resume/:id',
  '/profile',
  '/api-test', // API测试页面需要登录才能访问
];

const adminRoutes = [
  '/administrator',
  '/test-modal',
];

// 创建路由器
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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
      };
    }),
  },
]);

// 路由提供者组件
export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;

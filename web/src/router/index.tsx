import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';
import Layout from '@/components/layout/Layout';
import Loading from '@/components/ui/Loading';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AdminRoute from '@/components/common/AdminRoute';

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

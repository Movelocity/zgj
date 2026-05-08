import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, useRouteError } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Loading from '@/components/ui/Loading';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AdminRoute from '@/components/common/AdminRoute';
import ChunkLoadError from '@/pages/error/ChunkLoadError';
import { APP_ROUTES, STANDALONE_ROUTES, type ModuleRoute } from '@/modules';

// 路由错误处理组件
function RouteErrorBoundary() {
  const error = useRouteError() as Error;
  return <ChunkLoadError error={error} />;
}

export const routes = APP_ROUTES;

function withAccessGuard(route: ModuleRoute) {
  if (route.access === 'admin') {
    return <AdminRoute>{route.element}</AdminRoute>;
  }

  if (route.access === 'protected') {
    return <ProtectedRoute>{route.element}</ProtectedRoute>;
  }

  return route.element;
}

function wrapSuspense(route: ModuleRoute) {
  return (
    <Suspense fallback={<Loading />}>
      {withAccessGuard(route)}
    </Suspense>
  );
}

// 创建路由器
const router = createBrowserRouter([
  ...STANDALONE_ROUTES.map((route) => ({
    path: route.path,
    element: wrapSuspense(route),
    errorElement: <RouteErrorBoundary />,
  })),
  // 主应用路由
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: routes.map(route => {
      return {
        path: route.path,
        element: wrapSuspense(route),
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

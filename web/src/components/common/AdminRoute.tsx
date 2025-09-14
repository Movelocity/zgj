import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ADMIN_ROLE, ROUTES } from '@/utils/constants';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  // 如果未登录或不是管理员，重定向到首页
  if (!isAuthenticated || !user || user.role !== ADMIN_ROLE) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  // 如果是管理员，渲染子组件
  return <>{children}</>;
};

export default AdminRoute;

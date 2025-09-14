import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ADMIN_ROLE, ROUTES } from '@/utils/constants';
import Button from '@/components/ui/Button';
import { 
  UserIcon, 
  DocumentTextIcon, 
  CogIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={ROUTES.HOME} className="flex items-center space-x-2">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">职管加</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                <Link
                  to={ROUTES.SIMPLE_RESUME}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  简历优化
                </Link>
                <Link
                  to={ROUTES.JOB_RESUME}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  职位匹配
                </Link>
                <Link
                  to="/resumes"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  我的简历
                </Link>
              </>
            ) : (
              <Link
                to={ROUTES.HOME}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                首页
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {/* 管理员入口 */}
                {user?.role === ADMIN_ROLE && (
                  <Link to={ROUTES.ADMINISTRATOR}>
                    <Button variant="ghost" size="sm" icon={<CogIcon className="h-4 w-4" />}>
                      管理后台
                    </Button>
                  </Link>
                )}
                
                {/* 用户菜单 */}
                <Link to={ROUTES.PROFILE}>
                  <Button variant="ghost" size="sm" icon={<UserIcon className="h-4 w-4" />}>
                    {user?.nickname || user?.phone}
                  </Button>
                </Link>
                
                {/* 退出登录 */}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
                  onClick={handleLogout}
                >
                  退出
                </Button>
              </div>
            ) : (
              <Link to={ROUTES.AUTH}>
                <Button variant="primary" size="sm">
                  登录/注册
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

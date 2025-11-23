import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ROUTES, ADMIN_ROLE } from '@/utils/constants';
import {Button} from '@/components/ui';
import { 
  FaUser as UserIcon, 
} from 'react-icons/fa';
import { cn } from '@/lib/utils';

// 导航菜单配置
interface NavItem {
  path: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: ROUTES.HOME,
    label: '首页',
  },
  {
    path: ROUTES.SIMPLE_RESUME,
    label: '简历优化',
  },
  {
    path: ROUTES.JOB_RESUME,
    label: '职位匹配',
  },
  {
    path: '/resumes',
    label: '我的简历',
  },
];

const Header: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  /**
   * 判断菜单项是否为当前激活项
   * 根据一级路由进行匹配
   */
  const isActiveNav = (navPath: string): boolean => {
    // 获取当前路径的一级路由
    const currentFirstLevelPath = '/' + location.pathname.split('/')[1];
    // 获取导航路径的一级路由
    const navFirstLevelPath = '/' + navPath.split('/')[1];
    
    return currentFirstLevelPath === navFirstLevelPath;
  };

  return (
    <header className="fixed top-0 w-full bg-white z-[1000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={ROUTES.HOME} className="flex items-center space-x-2">
              {/* <DocumentTextIcon className="h-8 w-8 text-blue-600" /> */}
              <img src="/favicon.ico" alt="职管加" className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-900">职管加</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {NAV_ITEMS.map((item) => {
              const isActive = isActiveNav(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-50 hover:text-blue-600', 
                    isActive? 'text-blue-600' : 'text-gray-700'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {/* 管理员入口 */}
                {user?.role === ADMIN_ROLE && (
                  <Link to={ROUTES.ADMINISTRATOR}>
                    <Button variant="ghost" size="sm">
                      管理后台
                    </Button>
                  </Link>
                )}
                {/* 用户菜单 */}
                <Link to={ROUTES.PROFILE}>
                  <Button variant="ghost" size="sm">
                    <UserIcon className="h-4 w-4" />
                    {user?.name || user?.phone}
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to={ROUTES.AUTH}>
                <Button variant="default" size="sm">
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

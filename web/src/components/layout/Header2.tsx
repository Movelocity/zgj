import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ROUTES, ADMIN_ROLE } from '@/utils/constants';
import {Button} from '@/components/ui';
import { 
  FaUser as UserIcon,
  FaBars as MenuIcon,
  FaTimes as CloseIcon,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  /**
   * 切换移动端菜单
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  /**
   * 关闭移动端菜单
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
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
                  'text-slate-600 hover:text-slate-900 transition-colors', 
                  isActive? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Menu - Desktop */}
        <div className="hidden md:flex items-center">
          <Link to={ROUTES.CONTACT}>
            <Button variant="ghost" size="default" className="font-normal">
              使用指南
            </Button>
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              {/* 管理员入口 */}
              {user?.role === ADMIN_ROLE && (
                <Link to={ROUTES.ADMINISTRATOR}>
                  <Button variant="ghost" size="default" className="font-normal">
                    管理后台
                  </Button>
                </Link>
              )}
              {/* 用户菜单 */}
              <Link to={ROUTES.PROFILE} className="flex items-center gap-2">
                <span className="text-sm max-w-20 text-ellipsis overflow-hidden whitespace-nowrap">{user?.name || user?.phone}</span>
                <span className="rounded-full bg-gray-200 p-1 w-10 h-10 flex items-center justify-center">
                  <UserIcon className="h-4 w-4" />
                </span>
              </Link>
            </div>
          ) : (
            <Link to={ROUTES.AUTH}>
              <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
                免费试用
              </Button>
            </Link>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">

          {/* Mobile User Menu */}
          {isAuthenticated ? (
            <Link to={ROUTES.PROFILE} onClick={closeMobileMenu} className="flex items-center gap-2">
              <span className="text-sm">{user?.name || user?.phone}</span>
              <span className="rounded-full bg-gray-200 p-1 w-8 h-8 flex items-center justify-center">
                <UserIcon className="h-4 w-4" />
              </span>
            </Link>
          ) : (
            <Link to={ROUTES.AUTH} onClick={closeMobileMenu}>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
                免费试用
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <CloseIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </button>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 py-4">
          {/* Mobile Navigation */}
          <nav className="flex flex-col space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = isActiveNav(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={cn(
                    'px-4 py-2 text-slate-600 hover:bg-gray-100 transition-colors rounded-md',
                    isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <Link to={ROUTES.CONTACT} onClick={closeMobileMenu}>
              <Button variant="ghost" size="default" className="w-full justify-start font-normal">
                使用指南
              </Button>
            </Link>

            {isAuthenticated  && user?.role === ADMIN_ROLE && (
              <Link to={ROUTES.ADMINISTRATOR} onClick={closeMobileMenu}>
                <Button variant="ghost" size="default" className="w-full justify-start font-normal">
                  管理后台
                </Button>
              </Link>
            )}
          </div>

          
        </div>
      )}
    </div>
  );
};

export default Header;

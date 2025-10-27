import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useGlobalStore } from '@/store';

const Layout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { showBanner } = useGlobalStore();

  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    if (isHomePage) {
      setTimeout(() => {
        // 延迟加载页脚，防止在开始动画前占据页面
        setFooterVisible(true);
      }, 1);
    } else {
      setFooterVisible(false);
    }
  }, [isHomePage]); 

  return (
    <div className="bg-gray-50 flex flex-col">
      {showBanner && <Header />}
      <main className="flex-1 min-h-screen">
        <Outlet />
      </main>
      {footerVisible && <Footer />}
    </div>
  );
};

export default Layout;

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useGlobalStore } from '@/store';
import Header2 from './Header2';
import Footer from './Footer';

const Layout: React.FC = () => {
  const { showBanner } = useGlobalStore();
  return (
    <div className="flex flex-col min-h-screen">
      {/* 导航栏 */}
      {showBanner && (
        <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <Header2 />
        </nav>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      {/* 页脚 */}
      <Footer />
    </div>
  );
};

export default Layout;

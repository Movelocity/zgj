import React from 'react';
import { Outlet } from 'react-router-dom';
import { useGlobalStore } from '@/store';
import Header2 from './Header2';

const Layout: React.FC = () => {
  const { showBanner } = useGlobalStore();
  return (
    <div className="flex flex-col">
      {/* 导航栏 */}
      {showBanner && (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <Header2 />
        </nav>
      )}
      <main className="flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

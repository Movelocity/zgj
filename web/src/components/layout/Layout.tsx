import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useGlobalStore } from '@/store';

const Layout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { showBanner } = useGlobalStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showBanner && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      {isHomePage && <Footer />}
    </div>
  );
};

export default Layout;

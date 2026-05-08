import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import HeaderBrand from './header/HeaderBrand';
import HeaderMobileControls from './header/HeaderMobileControls';
import HeaderMobileMenu from './header/HeaderMobileMenu';
import HeaderPrimaryNav from './header/HeaderPrimaryNav';
import HeaderUserActions from './header/HeaderUserActions';

const Header: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((open) => !open);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-14">
        <div className="flex items-center">
          <HeaderBrand />
        </div>

        <HeaderPrimaryNav currentPath={location.pathname} />

        <HeaderUserActions isAuthenticated={isAuthenticated} user={user} />

        <HeaderMobileControls
          isAuthenticated={isAuthenticated}
          isOpen={isMobileMenuOpen}
          onToggle={toggleMobileMenu}
          onClose={closeMobileMenu}
          user={user}
        />
      </div>

      {isMobileMenuOpen && (
        <HeaderMobileMenu
          currentPath={location.pathname}
          isAuthenticated={isAuthenticated}
          onClose={closeMobileMenu}
          user={user}
        />
      )}
    </div>
  );
};

export default Header;

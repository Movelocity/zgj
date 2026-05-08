import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ADMIN_ROLE } from '@/utils/constants';
import { cn } from '@/lib/utils';
import {
  HEADER_ADMIN_ITEM,
  HEADER_GUIDE_ITEM,
  HEADER_PRIMARY_NAV_ITEMS,
  HEADER_PROFILE_ITEM,
  isActiveHeaderPath,
} from './navigation';

interface HeaderMobileMenuProps {
  currentPath: string;
  isAuthenticated: boolean;
  onClose: () => void;
  user?: {
    role?: number;
  } | null;
}

export default function HeaderMobileMenu({
  currentPath,
  isAuthenticated,
  onClose,
  user,
}: HeaderMobileMenuProps) {
  return (
    <div className="md:hidden border-t border-gray-200 py-4">
      <nav className="flex flex-col space-y-2">
        {HEADER_PRIMARY_NAV_ITEMS.map((item) => {
          const isActive = isActiveHeaderPath(currentPath, item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
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
        <Link to={HEADER_GUIDE_ITEM.path} onClick={onClose}>
          <Button variant="ghost" size="default" className="w-full justify-start font-normal">
            {HEADER_GUIDE_ITEM.label}
          </Button>
        </Link>

        {isAuthenticated && user?.role === ADMIN_ROLE && (
          <Link to={HEADER_ADMIN_ITEM.path} onClick={onClose}>
            <Button variant="ghost" size="default" className="w-full justify-start font-normal">
              {HEADER_ADMIN_ITEM.label}
            </Button>
          </Link>
        )}

        {isAuthenticated && (
          <Link to={HEADER_PROFILE_ITEM.path} onClick={onClose}>
            <Button variant="ghost" size="default" className="w-full justify-start font-normal">
              {HEADER_PROFILE_ITEM.label}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

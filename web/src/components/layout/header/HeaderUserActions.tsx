import { Link } from 'react-router-dom';
import { FaUser as UserIcon } from 'react-icons/fa';
import { Button } from '@/components/ui';
import { ADMIN_ROLE, ROUTES } from '@/utils/constants';
import { HEADER_ADMIN_ITEM, HEADER_GUIDE_ITEM } from './navigation';

interface HeaderUserActionsProps {
  isAuthenticated: boolean;
  user?: {
    name?: string;
    phone?: string;
    role?: number;
  } | null;
}

export default function HeaderUserActions({ isAuthenticated, user }: HeaderUserActionsProps) {
  return (
    <div className="hidden md:flex items-center">
      <Link to={HEADER_GUIDE_ITEM.path}>
        <Button variant="ghost" size="default" className="font-normal">
          {HEADER_GUIDE_ITEM.label}
        </Button>
      </Link>

      {isAuthenticated ? (
        <div className="flex items-center space-x-2">
          {user?.role === ADMIN_ROLE && (
            <Link to={HEADER_ADMIN_ITEM.path}>
              <Button variant="ghost" size="default" className="font-normal">
                {HEADER_ADMIN_ITEM.label}
              </Button>
            </Link>
          )}
          <Link to={ROUTES.PROFILE} className="flex items-center gap-2">
            <span className="text-sm max-w-20 text-ellipsis overflow-hidden whitespace-nowrap">
              {user?.name || user?.phone}
            </span>
            <span className="rounded-full bg-gray-200 p-1 w-10 h-10 flex items-center justify-center">
              <UserIcon className="h-4 w-4" />
            </span>
          </Link>
        </div>
      ) : (
        <Link to={ROUTES.AUTH}>
          <Button className="bg-gradient-to-r from-blue-800 to-cyan-400 hover:from-blue-700 hover:to-cyan-300">
            立即试用
          </Button>
        </Link>
      )}
    </div>
  );
}

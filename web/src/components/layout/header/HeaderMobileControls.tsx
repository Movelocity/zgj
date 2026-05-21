import { Link } from 'react-router-dom';
import {
  FaBars as MenuIcon,
  FaTimes as CloseIcon,
  FaUser as UserIcon,
} from 'react-icons/fa';
import { Button } from '@/components/ui';
import { ROUTES } from '@/utils/constants';

interface HeaderMobileControlsProps {
  isAuthenticated: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  user?: {
    name?: string;
    phone?: string;
  } | null;
}

export default function HeaderMobileControls({
  isAuthenticated,
  isOpen,
  onToggle,
  onClose,
  user,
}: HeaderMobileControlsProps) {
  return (
    <div className="md:hidden flex items-center gap-2">
      {isAuthenticated ? (
        <Link to={ROUTES.PROFILE} onClick={onClose} className="flex items-center gap-2">
          <span className="text-sm">{user?.name || user?.phone}</span>
          <span className="rounded-full bg-gray-200 p-1 w-8 h-8 flex items-center justify-center">
            <UserIcon className="h-4 w-4" />
          </span>
        </Link>
      ) : (
        <Link to={ROUTES.AUTH} onClick={onClose}>
          <Button className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
            免费试用
          </Button>
        </Link>
      )}

      <button
        className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 transition-colors"
        onClick={onToggle}
        aria-label="Toggle menu"
      >
        {isOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { HEADER_PRIMARY_NAV_ITEMS, isActiveHeaderPath } from './navigation';

interface HeaderPrimaryNavProps {
  currentPath: string;
}

export default function HeaderPrimaryNav({ currentPath }: HeaderPrimaryNavProps) {
  return (
    <nav className="hidden md:flex items-center space-x-8">
      {HEADER_PRIMARY_NAV_ITEMS.map((item) => {
        const isActive = isActiveHeaderPath(currentPath, item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'text-slate-600 hover:text-slate-900 transition-colors',
              isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

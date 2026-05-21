import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

export default function HeaderBrand() {
  return (
    <Link to={ROUTES.HOME} className="flex items-center space-x-2">
      <img src="/images/icon_128x128.webp" alt="职管加" className="h-8 w-8" />
      <span className="text-xl font-bold text-gray-900">职管加</span>
    </Link>
  );
}

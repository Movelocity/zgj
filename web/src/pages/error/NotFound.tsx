import React from 'react';
import { Link } from 'react-router-dom';
import {Button} from '@/components/ui';
import { ROUTES } from '@/utils/constants';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-gray-400 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            页面不存在
          </h2>
          <p className="text-gray-600">
            很抱歉，您访问的页面不存在或已被删除。
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={ROUTES.HOME}>
            <Button variant="default" className="w-full sm:w-auto">
              返回首页
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            返回上页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

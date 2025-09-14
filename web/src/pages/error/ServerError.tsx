import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/utils/constants';

const ServerError: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-gray-400 mb-2">500</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            服务器错误
          </h2>
          <p className="text-gray-600">
            很抱歉，服务器遇到了一些问题。请稍后再试。
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto"
          >
            刷新页面
          </Button>
          <Link to={ROUTES.HOME}>
            <Button variant="outline" className="w-full sm:w-auto">
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServerError;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import PhoneLogin from './components/PhoneLogin';

const Auth: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <PhoneLogin />
        </div>
        
        {/* 页面底部信息 */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <button
            onClick={() => navigate(ROUTES.CODE_AUTH)}
            className="text-blue-600 hover:text-blue-500 cursor-pointer"
          >
            账号密码登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;

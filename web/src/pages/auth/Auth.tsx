import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// import { ROUTES } from '@/utils/constants';
import { useAuthStore } from '@/store/authStore';
import PhoneLogin from './components/PhoneLogin';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  
  // 根据路由判断是登录还是注册模式
  const isRegisterMode = location.pathname === '/register';

  // 已登录用户访问注册页面时，跳转到个人中心
  useEffect(() => {
    if (isAuthenticated && isRegisterMode) {
      navigate('/profile');
    }
  }, [isAuthenticated, isRegisterMode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <PhoneLogin isRegisterMode={isRegisterMode} />
        </div>
        
        {/* 页面底部信息 */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <div className="flex justify-center space-x-4">
            {!isRegisterMode ? (
              <>
                {/* <button
                  onClick={() => navigate(ROUTES.CODE_AUTH)}
                  className="text-blue-600 hover:text-blue-500 cursor-pointer"
                >
                  账号密码登录
                </button> */}
                {/* <span className="text-gray-400">|</span> */}
                <button
                  onClick={() => navigate('/register')}
                  className="text-blue-600 hover:text-blue-500 cursor-pointer"
                >
                  注册账号
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="text-blue-600 hover:text-blue-500 cursor-pointer"
              >
                已有账号？去登录
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import PhoneLogin from './components/PhoneLogin';
import PasswordLogin from './components/PasswordLogin';
import { useGlobalStore } from '@/store';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const { setShowBanner } = useGlobalStore();
  useEffect(() => {
    setShowBanner(false);
    return () => {
      setShowBanner(true);
    };
  }, []);
  
  // 根据路由判断是登录还是注册模式
  const isRegisterMode = location.pathname === '/register';
  
  // 登录方式切换（手机登录 / 密码登录），仅在非注册模式下使用
  const [loginMode, setLoginMode] = useState<'phone' | 'password'>('phone');

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
          {/* 登录方式切换标签（仅登录模式显示） */}
          {!isRegisterMode && (
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setLoginMode('phone')}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  loginMode === 'phone'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                手机登录
              </button>
              <button
                onClick={() => setLoginMode('password')}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  loginMode === 'password'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                密码登录
              </button>
            </div>
          )}
          
          {/* 显示对应的登录组件 */}
          {isRegisterMode ? (
            <PhoneLogin isRegisterMode={true} />
          ) : loginMode === 'phone' ? (
            <PhoneLogin isRegisterMode={false} />
          ) : (
            <PasswordLogin />
          )}
        </div>
        
        {/* 页面底部信息 */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <div className="flex justify-center space-x-4">
            {!isRegisterMode ? (
              <button
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-blue-500 cursor-pointer"
              >
                注册账号
              </button>
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

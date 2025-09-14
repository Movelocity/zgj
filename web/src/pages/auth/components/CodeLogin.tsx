import React, { useState, useCallback } from 'react';
import { Button, Input, Loading } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { ROUTES, TOKEN_KEY } from '@/utils/constants';
import type { ApiResponse } from '@/types/global';
import type { User } from '@/types/user';

interface AdminLoginProps {
  onSuccess?: () => void;
}

interface AdminLoginResponse {
  token: string;
  user: User;
  expires_at: string;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  // 使用统一的用户登录API，登录后验证用户角色
  const userLoginAPI = async (credentials: { phone: string; password: string }): Promise<ApiResponse<AdminLoginResponse>> => {
    return apiClient.post('/api/user/login', credentials);
  };

  // 手机号验证
  const validatePhone = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // 管理员登录
  const handleLogin = useCallback(async () => {
    if (!validatePhone(formData.phone)) {
      setError('请输入正确的手机号码');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await userLoginAPI({
        phone: formData.phone,
        password: formData.password
      });
      console.log(response);

      if (response.code === 0 && response.data) {
        // 保存token到localStorage
        localStorage.setItem(TOKEN_KEY, response.data.token);
        
        // 更新用户状态
        setUser(response.data.user);
        
        // 成功回调
        onSuccess?.();

        // 跳转到首页
        navigate('/');
      } else {
        setError(response.msg || '登录失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  }, [formData, setUser, navigate, onSuccess]);

  // 输入处理
  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  // 回车登录
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">账号密码登录</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Input
            id="phone"
            type="tel"
            placeholder="请输入管理员手机号"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            onKeyPress={handleKeyPress}
            maxLength={11}
            className="w-full"
          />
        </div>

        <div>
          <Input
            id="password"
            type="password"
            placeholder="请输入管理员密码"
            value={formData.password}
            onChange={handleInputChange('password')}
            onKeyPress={handleKeyPress}
            className="w-full"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button
          onClick={handleLogin}
          disabled={loading || !formData.phone || !formData.password}
          className="w-full"
        >
          {loading ? (
            <>
              <Loading size="sm" className="mr-2" />
              登录中...
            </>
          ) : (
            '登录'
          )}
        </Button>
      </div>

      <div className="text-center">
        <button
          onClick={() => navigate(ROUTES.AUTH)}
          className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer"
        >
          手机验证码登录
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;

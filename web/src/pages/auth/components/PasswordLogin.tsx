import React, { useState, useCallback } from 'react';
import { Button, Input, Loading } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface PasswordLoginProps {
  onSuccess?: () => void;
}

const PasswordLogin: React.FC<PasswordLoginProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  // 手机号验证
  const validatePhone = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // 密码登录
  const handleSubmit = useCallback(async () => {
    if (!validatePhone(formData.phone)) {
      setError('请输入正确的手机号码');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    if (!agreed) {
      setError('请先同意用户协议和隐私政策');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login({
        phone: formData.phone,
        password: formData.password
      });

      // 成功回调
      onSuccess?.();
      
      // 跳转到首页
      navigate('/');
    } catch (err: any) {
      const errorCode = err.response?.data?.code;
      const message = err.response?.data?.msg || err.message;
      
      // 特殊处理黑名单锁定（code 429）
      if (errorCode === 429) {
        setError(message || '登录失败次数过多，请稍后再试');
      } else {
        setError(message || '登录失败，请检查手机号和密码');
      }
      
      // 清空密码输入框
      setFormData(prev => ({ ...prev, password: '' }));
    } finally {
      setLoading(false);
    }
  }, [formData, agreed, login, navigate, onSuccess]);

  // 输入处理
  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  // 按回车提交
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6">

      <div className="space-y-4">
        {/* 手机号输入 */}
        <div>
          <Input
            id="phone"
            type="tel"
            placeholder="请输入手机号码"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            onKeyPress={handleKeyPress}
            maxLength={11}
            className="w-full"
            autoComplete="username"
          />
        </div>

        {/* 密码输入 */}
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="请输入密码"
            value={formData.password}
            onChange={handleInputChange('password')}
            onKeyPress={handleKeyPress}
            className="w-full pr-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>

        {/* 忘记密码链接 */}
        <div className="text-right">
          <button
            onClick={() => navigate('/reset-password')}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            忘记密码？
          </button>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* 提交按钮 */}
        <Button
          onClick={handleSubmit}
          disabled={
            loading || 
            !formData.phone || 
            !formData.password || 
            !agreed
          }
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

        {/* 协议条款 */}
        <div className="text-center">
          <label className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span>
              我已阅读并同意
              <a
                href="#"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500 mx-1"
              >
                《用户协议》
              </a>
              和
              <a
                href="#"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500 mx-1"
              >
                《隐私政策》
              </a>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default PasswordLogin;


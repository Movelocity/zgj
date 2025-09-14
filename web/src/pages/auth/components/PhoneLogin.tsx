import React, { useState, useCallback } from 'react';
import { Button, Input, Loading } from '@/components/ui';
import { authAPI } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

interface PhoneLoginProps {
  onSuccess?: () => void;
}

const PhoneLogin: React.FC<PhoneLoginProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    phone: '',
    smsCode: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');

  const { auth } = useAuthStore();
  const navigate = useNavigate();

  // 手机号验证
  const validatePhone = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    if (!validatePhone(formData.phone)) {
      setError('请输入正确的手机号码');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      await authAPI.sendSMS(formData.phone);
      setStep('code');
      
      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  }, [formData.phone]);

  // 重新发送验证码
  const handleResendCode = useCallback(async () => {
    if (countdown > 0) return;
    await handleSendCode();
  }, [countdown, handleSendCode]);

  // 验证码登录
  const handleLogin = useCallback(async () => {
    if (!formData.smsCode || formData.smsCode.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 使用store的auth方法
      await auth({
        phone: formData.phone,
        sms_code: formData.smsCode,
        name: formData.name.trim() || undefined
      });

      // 成功回调
      onSuccess?.();
      
      // 跳转到首页
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [formData, auth, navigate, onSuccess]);

  // 返回手机号输入
  const handleBackToPhone = () => {
    setStep('phone');
    setFormData(prev => ({ ...prev, smsCode: '' }));
    setError('');
  };

  // 输入处理
  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  if (step === 'phone') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">手机号登录</h2>
          <p className="mt-2 text-sm text-gray-600">
            输入手机号，我们将发送验证码给您
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              手机号码
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="请输入手机号码"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              maxLength={11}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              姓名（可选）
            </label>
            <Input
              id="name"
              type="text"
              placeholder="请输入您的姓名"
              value={formData.name}
              onChange={handleInputChange('name')}
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              首次使用时请填写姓名，已注册用户可不填
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button
            onClick={handleSendCode}
            disabled={!formData.phone || sendingCode}
            className="w-full"
          >
            {sendingCode ? (
              <>
                <Loading size="sm" className="mr-2" />
                发送中...
              </>
            ) : (
              '获取验证码'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">输入验证码</h2>
        <p className="mt-2 text-sm text-gray-600">
          验证码已发送至 {formData.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="smsCode" className="block text-sm font-medium text-gray-700 mb-2">
            验证码
          </label>
          <Input
            id="smsCode"
            type="text"
            placeholder="请输入6位验证码"
            value={formData.smsCode}
            onChange={handleInputChange('smsCode')}
            maxLength={6}
            className="w-full text-center text-2xl tracking-widest"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center text-sm">
          <button
            onClick={handleBackToPhone}
            className="text-blue-600 hover:text-blue-500"
          >
            ← 返回修改手机号
          </button>
          
          <button
            onClick={handleResendCode}
            disabled={countdown > 0}
            className={`${
              countdown > 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-blue-600 hover:text-blue-500'
            }`}
          >
            {countdown > 0 ? `${countdown}s后重发` : '重新发送'}
          </button>
        </div>

        <Button
          onClick={handleLogin}
          disabled={loading || !formData.smsCode}
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
    </div>
  );
};

export default PhoneLogin;

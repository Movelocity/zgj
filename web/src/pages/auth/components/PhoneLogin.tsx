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
    smsCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

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
    if (!validatePhone(formData.phone)) {
      setError('请输入正确的手机号码');
      return;
    }

    if (!formData.smsCode || formData.smsCode.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    if (!agreed) {
      setError('请先同意用户协议和隐私政策');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 使用store的auth方法，不传递name参数，后端将使用手机号作为默认姓名
      await auth({
        phone: formData.phone,
        sms_code: formData.smsCode
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
  }, [formData, agreed, auth, navigate, onSuccess]);

  // 输入处理
  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">手机号登录</h2>
      </div>

      <div className="space-y-4">
        {/* 手机号输入 */}
        <div>
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


        {/* 验证码输入和发送按钮 */}
        <div>
          <div className="flex space-x-3">
            <Input
              id="smsCode"
              type="text"
              placeholder="请输入6位验证码"
              value={formData.smsCode}
              onChange={handleInputChange('smsCode')}
              maxLength={6}
              className="flex-1"
            />
            <Button
              onClick={countdown > 0 ? handleResendCode : handleSendCode}
              disabled={!formData.phone || sendingCode || countdown > 0}
              variant="outline"
              className="px-4 whitespace-nowrap"
            >
              {sendingCode ? (
                <>
                  <Loading size="sm" className="mr-1" />
                  发送中
                </>
              ) : countdown > 0 ? (
                `${countdown}s`
              ) : (
                '发送验证码'
              )}
            </Button>
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* 登录按钮 */}
        <Button
          onClick={handleLogin}
          disabled={loading || !formData.phone || !formData.smsCode || !agreed}
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
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500 mx-1"
              >
                《用户协议》
              </a>
              和
              <a
                href="/privacy"
                target="_blank"
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

export default PhoneLogin;

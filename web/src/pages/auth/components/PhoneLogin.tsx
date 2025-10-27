import React, { useState, useCallback, useEffect } from 'react';
import { Button, Input, Loading } from '@/components/ui';
import { authAPI } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { showInfo } from '@/utils/toast';

interface PhoneLoginProps {
  onSuccess?: () => void;
  isRegisterMode?: boolean;
}

const PhoneLogin: React.FC<PhoneLoginProps> = ({ onSuccess, isRegisterMode = false }) => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    phone: '',
    smsCode: '',
    inviteCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const { auth, register, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // 从 URL 参数中获取邀请码并自动填充（仅在未登录且为注册模式时）
  const inviteFromUrl = searchParams.get('invite');
  useEffect(() => {
    if (inviteFromUrl && isRegisterMode && !isAuthenticated) {
      setFormData(prev => ({ ...prev, inviteCode: inviteFromUrl }));
    }
  }, [inviteFromUrl, isRegisterMode, isAuthenticated]);

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

  // 验证码登录或注册
  const handleSubmit = useCallback(async () => {
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
      if (isRegisterMode) {
        // 注册模式：使用 register 方法
        const response: { token: string; user: any; message?: string } = await register({
          phone: formData.phone,
          sms_code: formData.smsCode,
          invitation_code: formData.inviteCode
        });
        
        // 如果后端返回了提示消息（如"已有账号，直接登录"），显示toast提示
        if (response?.message) {
          showInfo(response.message);
        }
      } else {
        // 登录模式：使用 auth 方法（后端会自动注册，不需要邀请码）
        await auth({
          phone: formData.phone,
          sms_code: formData.smsCode
        });
      }

      // 成功回调
      onSuccess?.();
      
      // 跳转到首页
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      setError(message || (isRegisterMode ? '注册失败，请重试' : '登录失败，请重试'));
    } finally {
      setLoading(false);
    }
  }, [formData, agreed, auth, register, navigate, onSuccess, isRegisterMode]);

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
        <h2 className="text-2xl font-bold text-gray-900">
          {isRegisterMode ? '注册账号' : '手机号登录'}
        </h2>
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
                <Loading size="sm" className="mr-1"/>
              ) : countdown > 0 ? (
                `${countdown}s`
              ) : (
                '发送验证码'
              )}
            </Button>
          </div>
        </div>

        {/* 邀请码输入（仅注册模式显示） */}
        {isRegisterMode && (
          <div>
            <Input
              id="inviteCode"
              type="text"
              placeholder={inviteFromUrl ? "使用链接中的邀请码" : "邀请码（选填）"}
              value={formData.inviteCode}
              onChange={handleInputChange('inviteCode')}
              disabled={!!inviteFromUrl}
              className="w-full"
            />
          </div>
        )}

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
            !formData.smsCode || 
            !agreed
          }
          className="w-full"
        >
          {loading ? (
            <>
              <Loading size="sm" className="mr-2" />
              {isRegisterMode ? '注册中...' : '登录中...'}
            </>
          ) : (
            isRegisterMode ? '注册' : '登录'
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

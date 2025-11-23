import React, { useState, useCallback, useEffect } from 'react';
import { Button, Input, Loading } from '@/components/ui';
import { authAPI } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { showInfo } from '@/utils/toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface PhoneLoginProps {
  onSuccess?: () => void;
  isRegisterMode?: boolean;
}

const PhoneLogin: React.FC<PhoneLoginProps> = ({ onSuccess, isRegisterMode = false }) => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    phone: '',
    smsCode: '',
    inviteCode: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // 密码强度检查
  const checkPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; message: string; color: string } => {
    if (!password) {
      return { strength: 'weak', message: '', color: '' };
    }

    const length = password.length;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    // 弱密码：6-7位，单一字符类型
    if (length >= 6 && length <= 7 && (hasNumber !== hasLetter)) {
      return { 
        strength: 'weak', 
        message: '密码强度：弱 - 建议使用8位以上并包含数字和字母', 
        color: 'text-yellow-600 bg-yellow-50' 
      };
    }

    // 中等强度：8-11位，两种字符类型
    if (length >= 8 && length <= 11 && ((hasNumber && hasLetter) || (hasNumber && hasSpecial) || (hasLetter && hasSpecial))) {
      return { 
        strength: 'medium', 
        message: '密码强度：中', 
        color: 'text-blue-600 bg-blue-50' 
      };
    }

    // 强密码：12位+，三种字符类型
    if (length >= 12 && hasNumber && hasLetter) {
      return { 
        strength: 'strong', 
        message: '密码强度：强', 
        color: 'text-green-600 bg-green-50' 
      };
    }

    // 默认弱密码
    return { 
      strength: 'weak', 
      message: '密码强度：弱 - 建议使用8位以上并包含数字和字母', 
      color: 'text-yellow-600 bg-yellow-50' 
    };
  };

  const passwordStrength = checkPasswordStrength(formData.password);

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

    // 注册模式下的密码验证
    if (isRegisterMode && formData.password) {
      if (formData.password.length < 6) {
        setError('密码长度至少为6位');
        return;
      }
      if (!formData.confirmPassword) {
        setError('请输入确认密码');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('两次密码输入不一致');
        return;
      }
    }

    if (!agreed) {
      setError('请先同意用户协议和隐私政策');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isRegisterMode) {
        // 注册模式：使用 register 方法，包含可选的密码字段
        const registerData: any = {
          phone: formData.phone,
          sms_code: formData.smsCode,
          invitation_code: formData.inviteCode
        };
        
        // 如果用户填写了密码，则包含密码字段
        if (formData.password) {
          registerData.password = formData.password;
          registerData.confirm_password = formData.confirmPassword;
        }
        
        const response: { token: string; user: any; message?: string } = await register(registerData);
        
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
      const message = err.response?.data?.msg || err.response?.data?.message || err.message;
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
          {isRegisterMode && '注册账号'}
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
            autoComplete="username"
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
              autoComplete="one-time-code"
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

        {/* 密码输入（仅注册模式显示） */}
        {isRegisterMode && (
          <>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="设置密码（选填，默认123456）"
                value={formData.password}
                onChange={handleInputChange('password')}
                className="w-full pr-10"
                autoComplete="new-password"
              />
              {formData.password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              )}
            </div>

            {/* 密码强度提示 */}
            {formData.password && passwordStrength.message && (
              <div className={`text-xs p-2 rounded ${passwordStrength.color}`}>
                {passwordStrength.message}
              </div>
            )}

            {/* 确认密码输入（仅在密码框有内容时显示） */}
            {formData.password && (
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="确认密码"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  className="w-full pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            )}

            {/* 密码不一致提示 */}
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                两次密码输入不一致
              </div>
            )}
          </>
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
                // href="/terms"
                href="#"
                // target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-500 mx-1"
              >
                《用户协议》
              </a>
              和
              <a
                // href="/privacy" 暂未设置页面
                href="#"
                // target="_blank"
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

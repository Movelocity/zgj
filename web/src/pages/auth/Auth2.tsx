import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, User, ArrowLeft, Phone, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useGlobalStore } from '@/store';
import { cn } from '@/lib/utils';
import { authAPI } from '@/api/auth';
import { showSuccess, showInfo, showError as showErrorToast } from '@/utils/toast';
import Modal from '@/components/ui/Modal';
import { userAPI } from '@/api/user';
// import { useIsMobile } from '@/hooks/useMediaQuery';

const Auth2: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, auth, register, login } = useAuthStore();
  const { setShowBanner } = useGlobalStore();

  const [activeTab, setActiveTab] = useState('signin');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'password'>('phone');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    verificationCode: '',
    invitationCode: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    setShowBanner(false);
    return () => {
      setShowBanner(true);
    };
  }, [setShowBanner]);

  const autoNavigateRef = useRef(true);

  useEffect(() => {
    if (isAuthenticated && autoNavigateRef.current && !loading) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, loading]);

  // 从 URL 参数中获取邀请码并自动填充
  const inviteFromUrl = searchParams.get('invite');
  useEffect(() => {
    if (inviteFromUrl && activeTab === 'signup') {
      setFormData(prev => ({ ...prev, invitationCode: inviteFromUrl }));
    }
  }, [inviteFromUrl, activeTab]);

  // 手机号验证
  const validatePhone = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(null);
    setSuccess(null);
  };

  const handleBack = () => {
    navigate('/');
  };

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    const phone = formData.phone;
    if (!phone) {
      setError('请输入手机号');
      return;
    }

    if (!validatePhone(phone)) {
      setError('请输入有效的手机号');
      return;
    }

    try {
      setSendingCode(true);
      setError(null);
      await authAPI.sendSMS(phone);
      setSuccess('验证码已发送');
      
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
    } catch (error: any) {
      const message = error.response?.data?.msg || error.response?.data?.message || error.message;
      setError(message || '发送验证码失败，请重试');
    } finally {
      setSendingCode(false);
    }
  }, [formData.phone]);

  // 手机号登录
  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.phone || !formData.verificationCode) {
      setError('请填写完整信息');
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError('请输入有效的手机号');
      return;
    }

    if (formData.verificationCode.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    if (!agreed) {
      setError('请先同意用户协议和隐私政策');
      return;
    }

    try {
      setLoading(true);
      // 使用 auth 方法（自动注册，不需要邀请码）
      const response = await auth({
        phone: formData.phone,
        sms_code: formData.verificationCode
      });
      console.log("response", response);
      // 检查是否返回了生成的密码（新用户自动注册时）
      if (response?.generated_password) {
        setGeneratedPassword(response.generated_password);
        setShowPasswordModal(true);
        autoNavigateRef.current = false;
        // 不立即跳转，等待用户确认或跳过密码修改
      } else {
        showSuccess('登录成功！');
      }
    } catch (error: any) {
      const message = error.response?.data?.msg || error.response?.data?.message || error.message;
      setError(message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 密码登录
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.phone || !formData.password) {
      setError('请填写完整信息');
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError('请输入有效的手机号');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    try {
      setLoading(true);
      await login({
        phone: formData.phone,
        password: formData.password
      });
      
      showSuccess('登录成功！');
      navigate('/');
    } catch (error: any) {
      const errorCode = error.response?.data?.code;
      const message = error.response?.data?.msg || error.response?.data?.message || error.message;
      
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
  };

  // 注册
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.phone || !formData.verificationCode) {
      setError('请填写完整信息');
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError('请输入有效的手机号');
      return;
    }

    if (formData.verificationCode.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    // 密码验证（密码可选）
    if (formData.password) {
      if (formData.password.length < 6) {
        setError('密码长度至少为6位');
        return;
      }
      if (!formData.confirmPassword) {
        setError('请输入确认密码');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }

    if (!agreed) {
      setError('请先同意用户协议和隐私政策');
      return;
    }

    try {
      setLoading(true);
      
      const registerData: any = {
        phone: formData.phone,
        sms_code: formData.verificationCode,
        invitation_code: formData.invitationCode
      };
      
      // 如果用户填写了姓名
      if (formData.fullName) {
        registerData.name = formData.fullName;
      }
      
      // 如果用户填写了密码
      if (formData.password) {
        registerData.password = formData.password;
        registerData.confirm_password = formData.confirmPassword;
      }
      
      const response = await register(registerData);
      
      // 如果后端返回了提示消息（如"已有账号，直接登录"），显示toast提示
      if (response?.message) {
        showInfo(response.message);
      } else {
        showSuccess('注册成功！');
      }
      
      // navigate('/');
    } catch (error: any) {
      const message = error.response?.data?.msg || error.response?.data?.message || error.message;
      setError(message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 复制密码到剪贴板
  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
      showSuccess('密码已复制');
    } catch (error) {
      showErrorToast('复制失败，请手动复制');
    }
  };

  // 关闭密码弹窗，跳转到首页
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setGeneratedPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    navigate('/');
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!newPassword) {
      showErrorToast('请输入新密码');
      return;
    }

    if (newPassword.length < 6) {
      showErrorToast('密码长度至少为6位');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showErrorToast('两次密码输入不一致');
      return;
    }

    try {
      setChangingPassword(true);
      await userAPI.changePassword({
        current_password: generatedPassword,
        new_password: newPassword
      });
      showSuccess('密码修改成功！');
      handleClosePasswordModal();
    } catch (error: any) {
      const message = error.response?.data?.msg || error.response?.data?.message || error.message;
      showErrorToast(message || '密码修改失败');
    } finally {
      setChangingPassword(false);
    }
  };

  // const isMobile = useIsMobile();

  return (
    <>
      {/* 修复浏览器自动填充导致图标颜色消失的问题 */}
      <style>{`
        /* 确保自动填充时图标仍然可见 */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-background-clip: text;
          -webkit-text-fill-color: inherit;
          transition: background-color 5000s ease-in-out 0s;
          box-shadow: inset 0 0 20px 20px transparent;
        }
        
        /* 确保图标在自动填充时显示在上层 */
        .input-icon-wrapper {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgb(148 163 184);
          z-index: 10;
          pointer-events: none;
        }
      `}</style>
      
      <div className="min-h-screen flex items-center justify-center">
        {/* 背景图片 */}
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-left md:bg-center h-screen"
          style={{ 
            backgroundImage: 'url(/images/background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'left center',
          }}
        />
        <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Button variant="link" onClick={handleBack} className="absolute top-4 left-4 md:top-8 md:left-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img src="/images/favicon.ico" alt="职管加" className="h-8 w-8" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-cyan-400 bg-clip-text text-transparent">
              职管加 - 用AI打造完美简历
            </span>
          </div>
        </div>

        {/* Auth Forms */}
        <Card className="bg-white/80 sm:bg-white backdrop-blur-sm border-0 shadow-xl mx-3">
          
          <CardContent>
            <Tabs value={activeTab}>
              {/* 登录 Tab */}
              <TabsContent value="signin" className="space-y-4 mt-0">

                {/* 登录方式切换 - 下边框高亮tab */}
                <div className="flex border-b border-slate-200 mb-6">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('phone')}
                    className={cn(
                      'flex-1 py-3 text-sm font-medium transition-colors relative cursor-pointer',
                      loginMethod === 'phone'
                        ? 'text-blue-600'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    短信登录
                    {loginMethod === 'phone' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('password')}
                    className={cn(
                      'flex-1 py-3 text-sm font-medium transition-colors relative cursor-pointer',
                      loginMethod === 'password'
                        ? 'text-blue-600'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    密码登录
                    {loginMethod === 'password' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                    )}
                  </button>
                </div>
                
                {error && (
                  <Alert className="bg-red-50 border-red-200 text-red-800">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                {/* 手机号登录表单 */}
                {loginMethod === 'phone' && (
                  <form onSubmit={handlePhoneSignIn} className="space-y-4">
                    <div className="space-y-2">
                      {/* <Label htmlFor="phone">手机号</Label> */}
                      <div className="relative input-icon-wrapper">
                        <Phone className="w-4 h-4 input-icon" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="请输入手机号"
                          value={formData.phone}
                          onChange={handleInputChange}
                          maxLength={11}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {/* <Label htmlFor="verificationCode">验证码</Label> */}
                      <div className="flex gap-2">
                        <Input
                          id="verificationCode"
                          name="verificationCode"
                          type="text"
                          placeholder="请输入验证码"
                          value={formData.verificationCode}
                          onChange={handleInputChange}
                          maxLength={6}
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSendCode}
                          disabled={sendingCode || countdown > 0 || !formData.phone}
                          className="whitespace-nowrap"
                        >
                          {sendingCode ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : countdown > 0 ? (
                            `${countdown}s`
                          ) : (
                            '发送验证码'
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* 用户协议 */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="agreed-phone"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="agreed-phone" className="text-xs text-slate-600">
                        我已阅读并同意
                        <a href="#" className="text-blue-600 hover:underline mx-1">《用户协议》</a>
                        和
                        <a href="#" className="text-blue-600 hover:underline ml-1">《隐私政策》</a>
                      </label>
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={loading || !formData.phone || !formData.verificationCode || !agreed}
                      className="w-full bg-blue-700 hover:bg-blue-600 text-white py-6"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          登录中...
                        </>
                      ) : (
                        '登录'
                      )}
                    </Button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('signup')}
                        className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        还没有账号？立即注册
                      </button>
                  </form>
                )}

                {/* 密码登录表单 */}
                {loginMethod === 'password' && (
                  <form onSubmit={handlePasswordSignIn} className="space-y-4">
                    <div className="space-y-2">
                      {/* <Label htmlFor="phone">手机号</Label> */}
                      <div className="relative input-icon-wrapper">
                        <Phone className="w-4 h-4 input-icon" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="请输入手机号"
                          value={formData.phone}
                          onChange={handleInputChange}
                          maxLength={11}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {/* <Label htmlFor="password">密码</Label> */}
                      <div className="relative input-icon-wrapper">
                        <Lock className="w-4 h-4 input-icon" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="请输入密码"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-10 pr-10"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !formData.phone || !formData.password}
                      className="w-full bg-blue-700 hover:bg-blue-600 text-white py-6"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          登录中...
                        </>
                      ) : (
                        '登录'
                      )}
                    </Button>
                    
                    {/* 切换到注册 */}
                    <div className="text-center flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setActiveTab('signup')}
                        className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        还没有账号？立即注册
                      </button>

                      {/* <div className="">
                        <Button variant="link" className="text-sm text-slate-600 p-0 h-auto">
                          忘记密码？
                        </Button>
                      </div> */}
                    </div>
                  </form>
                )}
              </TabsContent>
              
              {/* 注册 Tab */}
              <TabsContent value="signup" className="space-y-4 mt-0">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">创建账号</h2>
                  {/* <p className="text-slate-600 mt-1">开始使用您的免费账号</p> */}
                </div>
                
                {error && (
                  <Alert className="bg-red-50 border-red-200 text-red-800">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative input-icon-wrapper">
                      <User className="w-4 h-4 input-icon" />
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="用户名"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative input-icon-wrapper">
                      <Phone className="w-4 h-4 input-icon" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="请输入手机号"
                        value={formData.phone}
                        onChange={handleInputChange}
                        maxLength={11}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="verificationCode"
                        name="verificationCode"
                        type="text"
                        placeholder="请输入验证码"
                        value={formData.verificationCode}
                        onChange={handleInputChange}
                        maxLength={6}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendCode}
                        disabled={sendingCode || countdown > 0 || !formData.phone}
                        className="whitespace-nowrap"
                      >
                        {sendingCode ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : countdown > 0 ? (
                          `${countdown}s`
                        ) : (
                          '发送验证码'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* 邀请码（选填） */}
                  <div className="space-y-2">
                    {/* <Label htmlFor="invitationCode">邀请码（选填）</Label> */}
                    <Input
                      id="invitationCode"
                      name="invitationCode"
                      type="text"
                      placeholder={inviteFromUrl ? "使用链接中的邀请码" : "邀请码（选填）"}
                      value={formData.invitationCode}
                      onChange={handleInputChange}
                      disabled={!!inviteFromUrl || loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    {/* <Label htmlFor="password">密码（选填，可后续修改）</Label> */}
                    <div className="relative input-icon-wrapper">
                      <Lock className="w-4 h-4 input-icon" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="创建密码（至少 6 个字符）"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-10"
                        disabled={loading}
                      />
                      {formData.password && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* 确认密码（仅在密码框有内容时显示） */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="relative input-icon-wrapper">
                        <Lock className="w-4 h-4 input-icon" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="再次输入密码"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="pl-10 pr-10"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 密码不一致提示 */}
                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                      <AlertDescription>两次密码输入不一致</AlertDescription>
                    </Alert>
                  )}
                  
                  {/* 用户协议 */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="agreed-signup"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="agreed-signup" className="text-xs text-slate-600">
                      我已阅读并同意
                      <a href="#" className="text-blue-600 hover:underline mx-1">《用户协议》</a>
                      和
                      <a href="#" className="text-blue-600 hover:underline ml-1">《隐私政策》</a>
                    </label>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={loading || !formData.phone || !formData.verificationCode || !agreed}
                    className="w-full bg-blue-700 hover:bg-blue-600 text-white py-6"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        注册中...
                      </>
                    ) : (
                      '创建账号'
                    )}
                  </Button>
                  
                  {/* 切换到登录 */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      已有账号？立即登录
                    </button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* 随机密码提示弹窗 */}
      <Modal
        open={showPasswordModal}
        onClose={handleClosePasswordModal}
        title="您的职管加账号已成功创建！"
        size="md"
        maskClosable={false}
        escClosable={false}
        fullScreenOnMobile={true}
      >
        <div className="p-6 space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              我们为您生成了一个安全密码，请妥善保管。
            </AlertDescription>
          </Alert>

          {/* 生成的密码 */}
          <div className="space-y-2">
            {/* <label className="text-sm font-medium text-gray-700">您的登录密码：</label> */}
            <div className="flex gap-2">
              <Input
                type="text"
                value={generatedPassword}
                readOnly
                className="font-mono bg-gray-50 flex-1"
              />
              <Button
                variant="outline"
                onClick={handleCopyPassword}
                className="whitespace-nowrap"
              >
                {passwordCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    复制
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              请将此密码保存在安全的地方，或修改为您熟悉的密码。
            </p>
          </div>

          {/* 修改密码表单 */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-medium text-gray-900">修改密码（可选）</h4>
            
            <div className="space-y-2">
              {/* <label className="text-sm text-gray-700">新密码</label> */}
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码（至少6位）"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {/* <label className="text-sm text-gray-700">确认新密码</label> */}
              <div className="relative">
                <Input
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 密码不一致提示 */}
            {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800 text-sm">
                  两次密码输入不一致
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleClosePasswordModal}
                className="flex-1"
              >
                稍后修改
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                className="flex-1 bg-blue-700 hover:bg-blue-600 text-white"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    修改中...
                  </>
                ) : (
                  '立即修改密码'
                )}
              </Button>
            </div>
          </div>

          <Alert className="bg-gray-50 border-gray-200">
            <AlertDescription className="text-gray-600 text-xs">
              提示：您也可以点击“稍后修改”进入系统，在个人资料页面修改密码。
            </AlertDescription>
          </Alert>
        </div>
      </Modal>
    </>
  );
};

export default Auth2;


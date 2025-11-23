import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, ArrowLeft, Phone } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useGlobalStore } from '@/store';
import { cn } from '@/lib/utils';
const Auth2: React.FC = () => {
  const navigate = useNavigate();
  // const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { setShowBanner } = useGlobalStore();

  const [activeTab, setActiveTab] = useState('signin');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'password'>('phone');
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    verificationCode: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setShowBanner(false);
    return () => {
      setShowBanner(true);
    };
  }, [setShowBanner]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

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

  // 手机号登录
  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.phone || !formData.verificationCode) {
      setError('请填写完整信息');
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用手机号登录 API
      setError('手机号登录功能待实现');
    } catch (error) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 密码登录
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.email || !formData.password) {
      setError('请填写完整信息');
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用密码登录 API
      setError('密码登录功能待实现');
    } catch (error) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.phone || !formData.password || !formData.confirmPassword || !formData.verificationCode) {
      setError('请填写完整信息');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为 6 个字符');
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用注册 API
      setSuccess('注册成功！');
    } catch (error) {
      setError('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    const phone = formData.phone;
    if (!phone) {
      setError('请输入手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的手机号');
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用发送验证码 API
      setSuccess('验证码已发送');
    } catch (error) {
      setError('发送验证码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Button variant="ghost" onClick={handleBack} className="absolute top-4 left-4 md:top-8 md:left-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img src="/favicon.ico" alt="职管加" className="h-8 w-8" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              职管加 - 简历润色工具
            </span>
          </div>
        </div>

        {/* Auth Forms */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          
          <CardContent>
            <Tabs value={activeTab}>
              {/* 登录 Tab */}
              <TabsContent value="signin" className="space-y-4 mt-0">
                {/* <div className="text-center mb-4"> */}
                  {/* <h2 className="text-2xl font-bold text-slate-900">欢迎回来</h2> */}
                  {/* <p className="text-slate-600 mt-1">登录您的账号继续使用</p> */}
                {/* </div> */}

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
                    手机登录
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
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="请输入手机号"
                          value={formData.phone}
                          onChange={handleInputChange}
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
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSendCode}
                          disabled={loading}
                          className="whitespace-nowrap"
                        >
                          发送验证码
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 py-6"
                      size="lg"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        '登录'
                      )}
                    </Button>
                  </form>
                )}

                {/* 密码登录表单 */}
                {loginMethod === 'password' && (
                  <form onSubmit={handlePasswordSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">邮箱</Label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="请输入邮箱"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">密码</Label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="请输入密码"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end">
                      <Button variant="link" className="text-sm text-slate-600 p-0 h-auto">
                        忘记密码？
                      </Button>
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 py-6"
                      size="lg"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        '登录'
                      )}
                    </Button>
                    
                    {/* 切换到注册 */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setActiveTab('signup')}
                        className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        还没有账号？立即注册
                      </button>
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
                    <Label htmlFor="fullName">姓名</Label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="请输入您的姓名"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">手机号</Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="请输入手机号"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">验证码</Label>
                    <div className="flex gap-2">
                      <Input
                        id="verificationCode"
                        name="verificationCode"
                        type="text"
                        placeholder="请输入验证码"
                        value={formData.verificationCode}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendCode}
                        disabled={loading}
                        className="whitespace-nowrap"
                      >
                        发送验证码
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">密码</Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="创建密码（至少 6 个字符）"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认密码</Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="再次输入密码"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 py-6"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
            
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-600">
                继续使用即表示您同意我们的{' '}
                <a href="#" className="text-blue-600 hover:underline">服务条款</a>
                {' '}和{' '}
                <a href="#" className="text-blue-600 hover:underline">隐私政策</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth2;


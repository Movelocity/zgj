import React from 'react';
import { Button, Badge } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, CheckCircle, Star, Users, TrendingUp, FileText, Briefcase, Target, Zap, Shield, Clock, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/utils/constants';
import { Link } from 'react-router-dom';
import { useSiteVariable } from '@/hooks/useSiteVariable';

const Home2: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const { value: qr_code_img, loading: qr_code_loading } = useSiteVariable('qr_code_img');

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate(ROUTES.SIMPLE_RESUME);
    } else {
      navigate(ROUTES.AUTH);
    }
  };

  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      {/* <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <Header2 />
      </nav> */}

      {/* 主视觉区 */}
      <section className="relative pt-24 pb-10 px-4 sm:px-6 lg:px-8">
        {/* 背景图片 */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-left md:bg-center h-screen"
          style={{ 
            backgroundImage: 'url(/images/background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'left center',
          }}
        />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left bg-white/80 backdrop-blur-sm p-8 rounded-2xl">
              <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
                <Star className="w-4 h-4 mr-1" />
                AI 智能简历分析
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-6 flex items-center gap-2 justify-center lg:flex-col lg:items-start">
                用 AI 打造
                <span className="bg-gradient-to-r from-blue-900 to-cyan-400 bg-clip-text text-transparent block">
                  完美简历
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 mb-8 leading-relaxed">
                获取即时、可视化的简历反馈。AI 智能分析，色彩标注优化建议，公司研究洞察，个性化求职信生成，让你的简历在众多候选人中脱颖而出。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  onClick={handleGetStarted}
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 rounded-xl"
                >
                  免费试用
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-6 rounded-xl border-2 border-slate-300 hover:border-slate-400"
                >
                  查看演示
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-800" />
                  免费试用
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-800" />
                  快速获取结果
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-800" />
                  100% 安全
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-1">
                <img 
                  src="/images/demo-resume.jpg" 
                  alt="Professional Resume with AI Analysis" 
                  className="w-full h-auto rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-lg mix-blend-overlay"></div>
                <div className="absolute top-4 right-4 bg-blue-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                  92% 匹配度
                </div>
              </div>
              <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-4 transform -rotate-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-blue-800 rounded-full"></div>
                  <span className="font-medium">技能匹配：优秀</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-4 transform rotate-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">求职信已生成</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 社会认证 */}
      <section className="py-12 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-slate-600 font-medium mb-4">全球求职者信赖的选择</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-semibold">200+</span>
                <span className="text-sm">活跃用户</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">40%</span>
                <span className="text-sm">面试增长</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span className="font-semibold">4.9/5</span>
                <span className="text-sm">用户评分</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 功能特色 */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              功能特色
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              一站式简历优化解决方案
            </h2>
            <p className="text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto">
              我们的 AI 平台提供全面的简历分析，配合可视化反馈，让优化过程直观高效。
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <Link to="/simple-resume" className="text-blue-600 group-hover:scale-105 transition-transform">立即体验 →</Link>
                </div>
                <CardTitle className="text-xl">AI 简历分析</CardTitle>
                <CardDescription>利用先进的自然语言处理技术，智能解析简历内容，精准匹配职位描述。</CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <Link to="/job-resume" className="text-cyan-600 group-hover:scale-105 transition-transform">立即体验 →</Link>
                </div>
                <CardTitle className="text-xl">简历-职位匹配</CardTitle>
                <CardDescription>根据职位描述，智能分析简历与职位的匹配度，给出优化建议。</CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <Link to="/contact" className="text-violet-600 group-hover:scale-105 transition-transform">查看二维码 →</Link>
                </div>

                <CardTitle className="text-xl">内推机会</CardTitle>
                <CardDescription>加入群聊，每周查看内推机会，提升面试获得率</CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">求职信生成</CardTitle>
                <CardDescription>为每份工作申请量身定制个性化求职信，讲述引人入胜的故事。</CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">差距分析</CardTitle>
                <CardDescription>详细的简历改进建议，配合优先级排序的行动清单。</CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">多格式支持</CardTitle>
                <CardDescription>支持 PDF、Word 和图片上传，配备 OCR 技术进行全面文档分析。</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* 优势展示 */}
      <section className="py-20 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              为什么选择职管加？
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              已有数百名通过我们的 AI 简历优化服务改变职业生涯的求职者。
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">获得更多面试</h3>
              <p className="text-slate-300 leading-relaxed">
                用户在使用我们的可视化反馈系统优化简历后，面试回调增加了 40%。
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">节省时间</h3>
              <p className="text-slate-300 leading-relaxed">
                自动化分析和建议节省了简历优化过程中数小时的人工审查和猜测。
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">脱颖而出</h3>
              <p className="text-slate-300 leading-relaxed">
                获得其他候选人无法获得的可视化反馈和专业见解。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              用户评价
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              用户怎么说
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="flex flex-col h-full">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-slate-700 mb-6">
                  "职管加的职位匹配功能改变了游戏规则。我能清楚地借助AI分析职位描述，针对性改进简历。第一周就获得了 3 次面试！"
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    张
                  </div>
                  <div>
                    <div className="font-semibold">张明</div>
                    <div className="text-sm text-slate-600">软件工程师</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="flex flex-col h-full">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-slate-700 mb-6 flex-1">
                  "简历优化功能帮助我完美定制申请。我学到了如何用他们的语言表达并展示文化契合度。"
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    李
                  </div>
                  <div>
                    <div className="font-semibold">李婷</div>
                    <div className="text-sm text-slate-600">市场经理</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="flex flex-col h-full">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-slate-700 mb-6 flex-1">
                  "终于有一个工具能实现交互式编辑，点击内容修改简历非常直观。这是其他家产品所没有的，很看好职管加。"
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    王
                  </div>
                  <div>
                    <div className="font-semibold">王强</div>
                    <div className="text-sm text-slate-600">产品设计师</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 价格方案 */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              价格方案
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              简单透明的定价
            </h2>
            <p className="text-xl text-slate-600">
              从免费开始，随时升级。没有隐藏费用，没有意外。
            </p>
          </div>
          
          <Card className="relative bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-200 shadow-xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge variant="none" className="bg-gradient-to-r from-blue-800 to-cyan-400 text-white px-6 py-2">
                最受欢迎
              </Badge>
            </div>
            <CardHeader className="text-center pb-4 flex items-end justify-around flex-row">
              <div className="text-3xl font-bold">免费试用</div>
              <div>
                <span className="text-5xl font-bold text-slate-900">¥0</span>
                <span className="text-xl text-slate-600">/月</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3" />
                  <span>无限次简历分析</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3" />
                  <span>可视化标注和反馈</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3" />
                  <span>公司研究和洞察</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3" />
                  <span>求职信生成</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3" />
                  <span>多格式支持（PDF、Word、图片）</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-3" />
                  <span>优先客户支持</span>
                </li>
              </ul>
              <Button 
                onClick={handleGetStarted}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-lg py-6"
                size="lg"
              >
                立即免费开始
              </Button>
              <p className="text-center text-sm text-slate-600 mt-4">
                无需充值
              </p>
            </CardContent>
          </Card>
          
          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">寻找团队或企业解决方案？</p>
            <Button variant="outline" size="lg">
              <Link to="/contact">
                联系销售
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 常见问题 */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              常见问题解答
            </h2>
          </div>
          
          <div className="space-y-8">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-3">AI 分析的准确性如何？</h3>
                <p className="text-slate-600">
                  我们的 Agent 使用先进的自然语言处理和机器学习模型，基于数千份成功简历和职位描述进行提示词总结。分析准确性会根据用户反馈和实际招聘结果持续改进。
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-3">支持哪些文件格式？</h3>
                <p className="text-slate-600">
                  我们支持 PDF、Microsoft Word（DOC/DOCX）和图片文件（JPG、PNG）。我们的 OCR 技术可以从基于图像的简历中提取文本，进行全面分析。
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-3">我的简历数据安全和隐私如何？</h3>
                <p className="text-slate-600">
                  是的，绝对安全。我们使用企业级加密和安全措施。您的简历数据永远不会与第三方共享，您可以随时删除数据。本产品完全符合 GDPR 规定。
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-3">可视化标注系统如何工作？</h3>
                <p className="text-slate-600">
                  我们的系统分析您的简历内容，并在文档上直接叠加色彩编码的标注。绿色高亮显示优势，黄色表示需要改进的地方，红色标记缺失元素。这使得重点改进一目了然。
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-3">我可以同时改多份不同岗位的简历吗？</h3>
                <p className="text-slate-600">
                  当然可以！您可以针对多个职位描述分析简历，并为每个职位获得定制反馈。我们的职位匹配功能就是为此而生的。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 行动号召 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            准备好改变你的职业生涯了吗？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            成为数千名即将通过职管加提升面试率的求职者之一
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-12 py-6 rounded-xl font-semibold"
          >
            立即免费试用
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-blue-100 mt-4">无需消费 • 即刻访问 • 100% 安全</p>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/images/icon_128x128.webp" alt="职管加" className="h-8 w-8" />

                <span className="text-xl font-bold text-white">职管加</span>
              </div>
              <p className="text-slate-400">
                用 AI 驱动的简历分析和可视化反馈改变您的职业生涯。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">产品</h3>
              <ul className="space-y-2 text-sm">
              <li>
                <Link to="/simple-resume" className="hover:text-white">
                  简历优化
                </Link>
              </li>
              <li>
                <Link to="/job-resume" className="hover:text-white">
                  职位匹配
                </Link>
              </li>
              <li>
                <Link to="/resumes" className="hover:text-white">
                  简历管理
                </Link>
              </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">团队</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/contact" className="hover:text-white">
                    关于我们
                  </Link>
                </li>
                <li>
                  {!qr_code_loading && qr_code_img && (
                    <img src={qr_code_img} alt="职管加" className="h-20 w-20" />
                  )}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">支持</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/contact" className="hover:text-white">
                    帮助中心
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white">
                    联系我们
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white">
                    隐私政策
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white">
                    服务条款
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-slate-700" />
          <div className="text-center text-slate-400">
            <p>&copy; 2025 职管加。保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home2;


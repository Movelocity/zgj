import React from 'react';
import { Button, Badge } from '@/components/ui';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, CheckCircle, Star, Users, TrendingUp, FileText, Briefcase, Target, Zap, Shield, Clock, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/utils/constants';
import { Link } from 'react-router-dom';

const icp = import.meta.env.VITE_ICP_FILING;


const Home2: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

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

      {/* Hero 主视觉区 */}
      <section className="relative pt-24 pb-10 px-4 sm:px-6 lg:px-8">
        {/* 背景图片 */}
        <div
          className="absolute inset-0 -z-10 bg-cover bg-left md:bg-center h-screen"
          style={{
            backgroundImage: 'url(/images/background.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'left center',
          }}
        />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-[60px] items-center">
            {/* 左侧文字区域 */}
            <div className="bg-white/50 rounded-[32px] p-8">
              {/* 标题 */}
              <div className="flex flex-col gap-[8.5px] mb-3">
                <h1 className="text-[48px] font-bold leading-[48px] text-[#101828] font-['Inter']">
                  用 AI 打造
                </h1>
                <h1 className="text-[48px] font-bold leading-[48px] font-['Inter']"
                  style={{
                    background: 'linear-gradient(90deg, #1C398E 0%, #00D3F2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  完美简历
                </h1>
              </div>

              {/* 副标题 */}
              <p className="text-[16px] leading-[26px] text-[#45556C] mb-4 max-w-[440px]">
                获取即时、可视化的简历反馈。AI 智能分析，色彩标注优化建议，公司研究洞察，个性化求职信生成，让你的简历在众多候选人中脱颖而出。
              </p>

              {/* 按钮组 */}
              <div className="flex flex-row gap-4">
                <Button
                  onClick={handleGetStarted}
                  className="bg-[#155DFC] hover:bg-[#155DFC]/90 text-[#F9FAFB] text-lg font-medium px-4 py-[24px] rounded-[14px] h-[48px] inline-flex items-center gap-2"
                >
                  免费试用
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="bg-white hover:bg-gray-50 text-[#030712] text-lg font-medium px-8 py-[24px] rounded-[14px] h-[52px] border-2 border-[#CAD5E2] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
                >
                  查看演示
                </Button>
              </div>
            </div>

            {/* 右侧简历预览 */}
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] p-8 rotate-[1deg]">
                <img
                  src="/images/demo-resume.jpg"
                  alt="Professional Resume with AI Analysis"
                  className="w-full h-auto rounded-[10px] rotate-[1deg]"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-[10px] mix-blend-overlay rotate-[1deg]" />
                <div className="absolute top-[25px] right-[2px] bg-[#193CB8] text-white px-3 py-[3.5px] rounded-full text-[13.9px] rotate-[1deg]">
                  92% 匹配度
                </div>
              </div>
              <div className="absolute -top-4 -left-2 bg-white rounded-[14px] shadow-lg p-4 -rotate-[2deg]">
                <div className="flex items-center gap-2 text-sm rotate-[-2deg]">
                  <div className="w-3 h-3 bg-[#193CB8] rounded-full" />
                  <span className="font-medium text-[#030712]">技能匹配：优秀</span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-4 bg-white rounded-[14px] shadow-lg p-4 rotate-[2deg]">
                <div className="flex items-center gap-2 text-sm rotate-[2deg]">
                  <div className="w-3 h-3 bg-[#2B7FFF] rounded-full" />
                  <span className="font-medium text-[#030712]">求职信已生成</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero 2 - 文字 + 合作院校 Logo 滚动 */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-center items-center pt-[120px] pb-[80px] gap-8">
            {/* 文字 */}
            <h2 className="text-xl md:text-2xl font-medium text-[#45556C] text-center">
              已有多所海内外在校学生使用，广受好评
            </h2>

            {/* Logo 滚动条 */}
            <div className="relative w-full overflow-hidden">
              <div className="flex animate-marquee gap-12 items-center whitespace-nowrap">
                <img src="/images/logos/cuhk_logo_2x.png" alt="CUHK" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/hku-115.svg" alt="HKU" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/UoN-Logo.jpg" alt="UoN" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/zh-hans_logo.png" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/main-logo-3x.png" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/logo-2.png" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/logo.png" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/175-black.svg" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/20210106_newLogo.svg" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/most-international-university-2425.svg" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/virtual_attach_file.vsb-2.png" alt="University" className="h-12 shrink-0 opacity-60" />
                {/* 第二组 - 无缝滚动 */}
                <img src="/images/logos/cuhk_logo_2x.png" alt="CUHK" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/hku-115.svg" alt="HKU" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/UoN-Logo.jpg" alt="UoN" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/zh-hans_logo.png" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/main-logo-3x.png" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/logo-2.png" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/logo.png" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/175-black.svg" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/20210106_newLogo.svg" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/most-international-university-2425.svg" alt="University" className="h-12 shrink-0 opacity-60" />
                <img src="/images/logos/virtual_attach_file.vsb-2.png" alt="University" className="h-12 shrink-0 opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Text 1 - 产品功能介绍 */}
      <section className="bg-[#F1F5F9] py-[120px] px-4 sm:px-6 lg:px-[64px]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-4">
            <h2
              className="text-[32px] md:text-[36px] font-bold text-center leading-[120%] tracking-[-0.01em] md:tracking-[-0.02em] bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #193CB8 0%, #00D3F2 100%)' }}
            >
              产品功能
            </h2>
            <p className="text-lg leading-7 text-[#45556C] text-center max-w-3xl"
               style={{ fontFamily: 'Arial' }}>
              具有AI简历分析，智能职位匹配，求职信生成，简历差距分析等功能，
              <br />
              配合可视化反馈，让优化过程更加高效
            </p>
          </div>
        </div>
      </section>

      {/* Feature 1 - 功能卡片区 */}
      <section id="features" className="bg-[#F1F5F9]">
        <div className="max-w-7xl mx-auto">
          {/* Row 1 */}
          <div className="flex flex-col lg:flex-row justify-between items-center pt-[120px] pb-[40px] gap-[64px] px-4 sm:px-6 lg:px-[64px]">
            {/* Card 1 - 文字内容 */}
            <div className="flex flex-col items-start gap-12 w-full lg:w-[577px] shrink-0">
              <div className="flex flex-col items-start gap-6">
                <h3 className="text-2xl font-bold text-[#101828]">AI通用简历分析</h3>
                <p className="text-base text-[#45556C] leading-relaxed">
                  利用先进的自然语言处理技术，智能解析简历内容，精准匹配职位描述。
                </p>
                <p className="text-base text-[#45556C] leading-relaxed">
                  同时具有英文简历特色功能，申请海外岗位也毫无压力。
                </p>
              </div>
              <a
                href="/simple-resume"
                className="inline-flex items-center justify-center bg-[#155DFC] text-white font-medium text-base rounded-[12px] px-4 py-3 hover:bg-[#155DFC]/90 transition-colors"
                style={{ width: '120px', height: '50px' }}
              >
                点击前往
              </a>
            </div>
            {/* 图片 */}
            <div className="w-full lg:w-[690px] h-[200px] lg:h-[424px] bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">
              截图占位（待替换）
            </div>
          </div>

          {/* Row 2 - 图片在左，文字在右 */}
          <div className="flex flex-col lg:flex-row justify-between items-center pt-[40px] pb-[120px] gap-[64px] px-4 sm:px-6 lg:px-[64px]">
            {/* 图片 */}
            <div className="w-full lg:w-[690px] h-[200px] lg:h-[424px] bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">
              截图占位（待替换）
            </div>
            {/* Card 2 - 文字内容 */}
            <div className="flex flex-col items-start gap-12 w-full lg:w-[569px] shrink-0">
              <div className="flex flex-col items-start gap-6">
                <h3 className="text-2xl font-bold text-[#101828]">
                  专业职位匹配
                </h3>
                <p className="text-base text-[#45556C] leading-relaxed">
                  针对特定岗位定制优化，精准匹配JD要求，提升面试获得率
                </p>
              </div>
              <a
                href="/job-resume"
                className="inline-flex items-center justify-center bg-[#155DFC] text-white font-medium text-base rounded-[12px] px-4 py-3 hover:bg-[#155DFC]/90 transition-colors"
                style={{ width: '120px', height: '50px' }}
              >
                点击前往
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2 - AI面试录音复盘 */}
      <section className="bg-[#F1F5F9]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-center pt-[40px] pb-[120px] gap-[64px] px-4 sm:px-6 lg:px-[64px]">
            {/* 文字内容 */}
            <div className="flex flex-col items-start gap-12 w-full lg:w-[577px] shrink-0">
              <div className="flex flex-col items-start gap-6">
                <h3 className="text-2xl font-bold text-[#101828]">AI面试录音复盘</h3>
                <p className="text-base text-[#45556C] leading-relaxed">
                  AI智能解析录音，专业复盘面试表现，沉淀你的求职知识库与备战题库，让每次面试都成为进阶的阶梯。
                </p>
              </div>
              <a
                href="/simple-resume"
                className="inline-flex items-center justify-center bg-[#155DFC] text-white font-medium text-base rounded-[12px] px-4 py-3 hover:bg-[#155DFC]/90 transition-colors"
                style={{ width: '120px', height: '50px' }}
              >
                点击前往
              </a>
            </div>
            {/* 图片 */}
            <div className="w-full lg:w-[690px] h-[200px] lg:h-[424px] bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">
              截图占位（待替换）
            </div>
          </div>
        </div>
      </section>

      {/* 优势展示 - Text list 1 */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start pt-[120px] pb-[120px] gap-4 lg:gap-[9px] px-4 sm:px-6 lg:px-[64px]">
            {/* 左侧标题 */}
            <div className="w-full lg:w-[661px] shrink-0">
              <h2
                className="text-2xl md:text-[48px] font-bold leading-[120%] tracking-[-0.02em]"
                style={{
                  background: 'linear-gradient(90deg, #193CB8 0%, #00D3F2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                为什么选择职管加？
              </h2>
            </div>
            {/* 右侧列表 */}
            <div className="flex flex-col gap-4 w-full lg:w-[661px]">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-6 h-6 shrink-0 relative flex items-center justify-center"><div className="w-[15px] h-[15px] bg-[#1447E6] rounded-full" /></div>
                  <h3 className="text-xl font-semibold text-[#101828]">获得更多面试机会</h3>
                </div>
                <p className="text-base text-[#45556C] leading-relaxed">
                  用户在使用我们的可视化反馈系统优化简历后，面试回调增加了 40%。
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-6 h-6 shrink-0 relative flex items-center justify-center"><div className="w-[11px] h-[11px] bg-[#1447E6] rotate-45" /></div>
                  <h3 className="text-xl font-semibold text-[#101828]">节省准备简历的时间</h3>
                </div>
                <p className="text-base text-[#45556C] leading-relaxed">
                  自动化分析和建议节省了简历优化过程中数小时的人工审查和猜测。
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-6 h-6 shrink-0 relative flex items-center justify-center"><div className="w-0 h-0 border-l-[9px] border-r-[9px] border-b-[15px] border-l-transparent border-r-transparent border-b-[#1447E6]" /></div>
                  <h3 className="text-xl font-semibold text-[#101828]">在面试者中脱颖而出</h3>
                </div>
                <p className="text-base text-[#45556C] leading-relaxed">
                  获得其他候选人无法获得的可视化反馈和专业见解。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-center mb-4 leading-[40px] bg-clip-text text-transparent"
              style={{
                fontFamily: 'Arial',
                fontSize: '36px',
                backgroundImage: 'linear-gradient(90deg, #023B9C 29.81%, #57CAE9 100%)',
              }}>
              用户心声
            </h2>
            <p className="text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto">
              职管加团队始终坚守客服一线，用心聆听每份反馈，
              <br/>
              以用户声音驱动产品持续优化。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-slate-700 text-sm mb-6 flex-1 leading-relaxed">
                "我之前海投了快200份实习，收到的面邀寥寥无几。我还一直觉得是自己学校不够好。用了’职管加’的AI分析才发现，我的简历里全是’负责了…参与了…’，干巴巴的，一点成绩都体现不出来。AI帮我把这些经历重新措辞，比如把’参与公众号运营’改成’独立负责每周两篇推文撰写，平均阅读量提升30%’，一下就立体了！内推后现在已经拿到两个面试了！"
              </blockquote>
              <div className="flex items-center pt-4 border-t border-slate-100">
                <img src="/images/user1.webp" alt="Annie" className="w-10 h-10 rounded-full mr-3" />
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Annie</div>
                  <div className="text-xs text-slate-500">大三在校生</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-slate-700 text-sm mb-6 flex-1 leading-relaxed">
                "我之前的简历太长了，研究项目写了一大堆，HR根本没耐心看。但是我又不知道怎么精简，还好职管加帮我提炼出了重点，还把深奥的技术术语转化成业务方也能听懂的价值描述。同时它还能直接告诉HR相对于其他申请者，我的优势和短板在哪里，让我投递时占据了更大优势。"
              </blockquote>
              <div className="flex items-center pt-4 border-t border-slate-100">
                <img src="/images/user2.webp" alt="Ethan" className="w-10 h-10 rounded-full mr-3" />
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Ethan</div>
                  <div className="text-xs text-slate-500">大四在校生</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-slate-700 text-sm mb-6 flex-1 leading-relaxed">
                "我考研失败后急着找工作，简历就是拿课程作业和社团经历凑的，自己都知道很单薄。’职管加’最牛的是，它能根据我想投的’产品助理’岗位，智能地帮我挖掘和提炼经历里匹配的点，比如把一个普通的校园调研项目，包装成’用户需求调研与分析’的经验。它还给了我针对这个岗位的技能关键词，让我心里特别有底！"
              </blockquote>
              <div className="flex items-center pt-4 border-t border-slate-100">
                <img src="/images/user3.webp" alt="Amy" className="w-10 h-10 rounded-full mr-3" />
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Amy</div>
                  <div className="text-xs text-slate-500">应届生</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 行动号召 */}
      <section className="py-[80px] px-4 sm:px-6 lg:px-[512px]"
        style={{ background: 'linear-gradient(90deg, #193CB8 0%, #00D3F2 100%)' }}>
        <div className="max-w-[896px] mx-auto text-center">
          <h2
            className="text-[36px] font-bold leading-[40px] text-center text-white mb-8"
            style={{ fontFamily: 'Inter' }}
          >
            职管加陪你一起迈好求职第一步
          </h2>
          <p
            className="text-xl leading-7 text-center text-[#DBEAFE] mb-8"
            style={{ fontFamily: 'Inter' }}
          >
            成为数千名即将通过职管加提升面试率的求职者之一
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center gap-2 bg-white text-[#155DFC] rounded-[14px] hover:bg-white/90 transition-colors font-semibold text-lg leading-7"
            style={{ fontFamily: 'Inter', width: '172px', height: '48px', padding: '24px 16px' }}
          >
            立即免费试用
            <ChevronRight className="w-4 h-4" />
          </button>
          <p className="text-[15.5px] leading-6 text-[#DBEAFE] text-center mt-6" style={{ fontFamily: 'Inter' }}>无需消费 · 即刻访问 · 100% 安全</p>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-[#101828] text-slate-400 py-12 px-4 sm:px-6 lg:px-[320px]">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* 品牌 */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/images/icon_128x128.webp" alt="职管加" className="h-8 w-8" />
                <span className="text-xl font-bold text-white">职管加</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                用 AI 驱动的简历分析和可视化<br />反馈改变您的职业生涯。
              </p>
            </div>
            {/* 产品 */}
            <div>
              <h3 className="font-semibold text-white mb-4">产品</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/simple-resume" className="text-slate-400 hover:text-white transition-colors">简历优化</Link></li>
                <li><Link to="/job-resume" className="text-slate-400 hover:text-white transition-colors">职位匹配</Link></li>
                <li><Link to="/resumes" className="text-slate-400 hover:text-white transition-colors">简历管理</Link></li>
              </ul>
            </div>
            {/* 团队 */}
            <div>
              <h3 className="font-semibold text-white mb-4">团队</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">关于我们</Link></li>
                <li className="pt-2">
                  <img src="/images/qr-code.png" alt="QR码" className="w-20 h-20 rounded-lg" />
                </li>
              </ul>
            </div>
            {/* 支持 */}
            <div>
              <h3 className="font-semibold text-white mb-4">支持</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">帮助中心</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">联系我们</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">隐私政策</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">服务条款</Link></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-slate-700" />
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
            <p className="text-[15.5px] leading-6 text-[#90A1B9]" style={{ fontFamily: 'Inter' }}>
              &copy; 2025 职管加。保留所有权利。
            </p>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15.4px] leading-6 text-[#99A1AF] hover:text-white transition-colors"
              style={{ fontFamily: 'Inter' }}
            >
              粤ICP备2024301748号-1
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home2;


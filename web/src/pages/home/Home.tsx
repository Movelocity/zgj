import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/utils/constants';
import Button from '@/components/ui/Button';
import { 
  DocumentTextIcon, 
  SparklesIcon, 
  UserGroupIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: <SparklesIcon className="h-6 w-6" />,
      title: 'AI 智能优化',
      description: '基于大语言模型的智能简历优化，提升简历质量和匹配度',
    },
    {
      icon: <DocumentTextIcon className="h-6 w-6" />,
      title: '多格式支持',
      description: '支持 PDF、Word、TXT 等多种格式，轻松上传和编辑',
    },
    {
      icon: <UserGroupIcon className="h-6 w-6" />,
      title: '职位匹配',
      description: '根据具体职位要求，定制化优化简历内容',
    },
  ];

  const benefits = [
    '提升简历通过率',
    '优化关键词匹配',
    '改善表达方式',
    '增强专业性',
    '节省时间成本',
    '提高面试机会',
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              让你的简历
              <span className="text-blue-600">脱颖而出</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              职管加是专业的 AI 驱动简历优化工具，帮助求职者打造完美简历，提升求职成功率
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link to={ROUTES.SIMPLE_RESUME}>
                    <Button size="lg" className="w-full sm:w-auto">
                      开始优化简历
                    </Button>
                  </Link>
                  <Link to="/resumes">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      查看我的简历
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to={ROUTES.AUTH}>
                    <Button size="lg" className="w-full sm:w-auto">
                      免费开始使用
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    了解更多
                  </Button>
                </>
              )}
            </div>
            
            {/* 开发环境下显示API测试链接 */}
            {import.meta.env.DEV && (
              <div className="mt-8 text-center">
                <Link to={ROUTES.API_TEST}>
                  <Button variant="outline" size="sm" className="text-gray-500 border-gray-300">
                    🔧 API 测试页面 (开发模式)
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              为什么选择职管加？
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              我们提供专业、高效、智能的简历优化服务
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                专业优化，成效显著
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                通过 AI 智能分析和专业建议，帮助你的简历在众多候选人中脱颖而出
              </p>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">立即开始</h3>
              <p className="mb-6">
                上传你的简历，让 AI 为你提供专业的优化建议
              </p>
              {isAuthenticated ? (
                <Link to={ROUTES.SIMPLE_RESUME}>
                  <Button variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                    开始优化
                  </Button>
                </Link>
              ) : (
                <Link to={ROUTES.AUTH}>
                  <Button variant="outline" className="border-white hover:bg-white hover:text-blue-600">
                    免费注册
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

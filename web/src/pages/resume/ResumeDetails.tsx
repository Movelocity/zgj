import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiMessageSquare } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import Button from "@/components/ui/Button"
import { useGlobalStore } from '@/store';
import ChatPanel from './components/ChatPanel';
import ResumeEditor from './components/ResumeEditor';
import type { ResumeData } from './types';

interface ResumeEditorProps {
  onExit: () => void;
}

export const ResumeDetails: React.FC<ResumeEditorProps> = ({ onExit }) => {
  // const [isEditing, setIsEditing] = useState(false);
  const { setShowBanner } = useGlobalStore();

  useEffect(() => {
    setShowBanner(false);
    return () => {
      setShowBanner(true);
    };
  }, []);

  // 简历数据状态 - AI优化后的内容
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      name: '张三',
      title: '资深前端开发工程师 | React/Vue 专家', // AI优化：更突出专业性
      email: 'zhangsan@email.com',
      phone: '138-0000-0000',
      location: '北京市'
    },
    summary: '3年前端开发经验，精通React、Vue全家桶技术栈，具备大型项目架构设计能力。曾独立负责多个核心业务系统的前端开发，在性能优化和用户体验提升方面有丰富实践。具备良好的团队协作能力和技术学习能力，能够快速适应新技术并应用于实际项目中。', // AI优化：更具体和有吸引力
    workExperience: [
      {
        id: '1',
        company: '科技有限公司',
        position: '前端开发工程师',
        duration: '2021.06 - 至今',
        description: '• 主导开发公司核心产品前端架构，服务用户数达10万+，页面加载速度提升40%\n• 运用React+TypeScript技术栈重构老旧系统，代码可维护性显著提升\n• 与产品、设计、后端团队紧密协作，确保项目按期高质量交付\n• 建立前端代码规范和CI/CD流程，团队开发效率提升30%\n• 指导初级开发人员，参与技术分享，推动团队技术成长' // AI优化：更有说服力的数据和成果
      }
    ],
    education: [
      {
        id: '1',
        school: '某某大学',
        degree: '计算机科学与技术 本科',
        duration: '2017.09 - 2021.06',
        description: '主修课程：数据结构、算法、软件工程、数据库原理等\nGPA: 3.7/4.0\n获得：优秀学生奖学金、ACM程序设计竞赛二等奖'
      }
    ],
    skills: ['React', 'Vue.js', 'TypeScript', 'JavaScript', 'Webpack', 'Vite', 'Node.js', 'HTML5/CSS3', 'Git', 'Docker'], // AI优化：重新排序，突出核心技能
    projects: [
      {
        id: '1',
        name: '企业管理系统',
        duration: '2023.03 - 2023.08',
        description: '基于React+TypeScript构建的大型企业级管理平台，支持多租户架构，日活用户5000+。\n核心贡献：\n• 设计并实现前端微服务架构，支持模块化开发和独立部署\n• 开发了通用组件库，被公司其他项目复用，开发效率提升50%\n• 集成Echarts实现数据可视化，为业务决策提供直观支持\n• 实现权限控制系统，确保数据安全和用户体验的平衡', // AI优化：更详细的技术实现和业务价值
        technologies: 'React, TypeScript, Ant Design, Echarts, Webpack, Redux'
      }
    ]
  });
  

  return (
    <div className="h-screen flex flex-col">
      {/* 头部导航 */}
      <div className="bg-white border-b border-gray-200 px-4 shadow-sm fixed top-0 w-full z-[1000]">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center">
            <Button 
              onClick={onExit}
              variant="outline"
              className="mr-4 p-2"
              icon={<FiArrowLeft className="w-4 h-4 mr-2" />}
            >
              返回
            </Button>
            <div className="flex items-center">
              <Sparkles className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-xl">简历编辑</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center mr-4 bg-blue-50 px-3 py-1 rounded-lg">
              <FiMessageSquare className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-700">AI 优化简历</span>
            </div>
            {/* {isEditing && (
              <div className="flex items-center mr-4 bg-green-50 px-3 py-1 rounded-lg">
                <FiEdit className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-green-700">编辑中</span>
              </div>
            )} */}
            <Button variant="outline">
              导出PDF
            </Button>
            <Button variant="primary">
              保存简历
            </Button>
          </div>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="flex-1 flex">
        {/* 左侧优化后简历 (7/10) */}
        <div className="w-[70%] border-r border-gray-200 bg-white h-screen overflow-auto py-16">
          <ResumeEditor 
            resumeData={resumeData}
            onResumeDataChange={setResumeData}
          />
        </div>

        {/* 右侧AI对话界面 (3/10) */}
        <div className="w-[30%] p-2 bg-gray-50 h-screen overflow-auto pt-14">
          <ChatPanel />
        </div>
      </div>
    </div>
  )
}
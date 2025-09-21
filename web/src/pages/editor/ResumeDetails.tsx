import { useEffect, useState } from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, ArrowLeftIcon } from 'lucide-react';
import Button from "@/components/ui/Button"
import { useGlobalStore } from '@/store';
import ChatPanel from './components/ChatPanel';
import ResumeEditor from './components/ResumeEditor';
import { ResumeExample, type ResumeData } from '@/types/resume';
import type { 
  OptimizedSections,
  ResumeUpdateRequest
} from '@/types/resume';
import { resumeAPI } from '@/api/resume';
import { showError, showSuccess } from '@/utils/toast';
import Spinner from '@/components/ui/Loading';

// 定义哪些内容是AI优化过的
// const optimizedSectionsExample: OptimizedSections = {
//   personalInfo: ['title'], // 职位标题被优化：更专业的表述
//   summary: true, // 整个个人总结被优化：更具体和有吸引力
//   workExperience: {
//     '1': ['description'] // 第一个工作经历的描述被优化：添加了数据和成果
//   },
//   skills: true, // 技能部分被优化：重新排序突出核心技能
//   projects: {
//     '1': ['description'] // 第一个项目的描述被优化：更详细的技术实现和业务价值
//   }
// };

export default function ResumeDetails() {
  const { setShowBanner } = useGlobalStore();
  useEffect(() => {
    setShowBanner(false);
    return () => {
      setShowBanner(true);
    };
  }, []);

  // 简历数据状态 - AI优化后的内容
  const [resumeData, setResumeData] = useState<ResumeData>(ResumeExample);
  const [optimizedSections] = useState<OptimizedSections>({
    personalInfo: [],
    summary: false,
    workExperience: {},
    skills: false,
    projects: {},
  });

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // const [resume, setResume] = useState<ResumeDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingText, setProcessingText] = useState("");
  const [editForm, setEditForm] = useState<ResumeUpdateRequest>({});

  // 加载简历详情
  const loadResumeDetail = async () => {
    if (!id) return;
    
    try {
      const response = await resumeAPI.getResume(id);
      if (response.code === 0 && response.data) {
        const { name, text_content, structured_data, file_id } = response.data;
        if (!structured_data) { 
          if (!text_content) {
            if (file_id) {
              // 解析文件到文本
              setProcessingText("正在解析文件 请稍后...");
              setLoading(true);

              const response = await resumeAPI.resumeFileToText(id);
              if (response.code === 0) {
                // 刷新简历详情
                loadResumeDetail();
                return
              }
            }
          } else if (text_content.length > 20) {
            // 后端结构化文本
            setProcessingText("正在结构化文本 请耐心等待...");
            setLoading(true);

            const response = await resumeAPI.structureTextToJSON(id);
            if (response.code === 0) {
              loadResumeDetail();
              return;
            }
          } else {
            // 文本内容太短，解析了也没用，直接创建默认模版
            setEditForm({
              name: name,
              text_content: text_content,
              structured_data: ResumeExample,
            });
            setResumeData(ResumeExample);
          }
        } else {
          setEditForm({
            name: name,
            text_content: text_content,
            structured_data: structured_data,
          });
          setResumeData(structured_data);
          setLoading(false);
        }
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '获取简历详情失败');
      setLoading(false);
    }
  };

  const handleSaveResume = async () => {
    if (!id) return;
    try {
      await resumeAPI.updateResume(id, editForm);
      showSuccess('保存简历成功');
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存简历失败');
    }
  };

  const handleSetResumeData = async (data: ResumeData) => {
    setResumeData(data);
    setEditForm(prev => ({
      ...prev,
      structured_data: data,
    }));
  }

  useEffect(() => {
    loadResumeDetail();
  }, [id]);

  useEffect(() => {
    // 设置标签页标题
    document.title = `简历编辑 - 职管加`;
  }, []);
  

  return (
    <div className="h-screen flex flex-col">
      {/* 头部导航 */}
      <div className="bg-white border-b border-gray-200 px-4 shadow-sm fixed top-0 w-full z-[1000]">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate("/resumes/cards")} icon={<ArrowLeftIcon className="w-4 h-4" />}>
              返回
            </Button>
            <div className="flex items-center ml-4">
              <Sparkles className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-xl">简历编辑</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center mr-4 bg-blue-50 px-3 py-1 rounded-lg">
              <FiMessageSquare className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-700">AI 优化简历</span>
            </div>
            {/* <Button variant="outline">
              导出PDF
            </Button> */}
            <Button variant="primary" onClick={handleSaveResume}>
              保存简历
            </Button>
          </div>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="flex-1 flex">
        {/* 左侧优化后简历 (7/10) */}
        <div className="w-[70%] border-r border-gray-200 bg-white h-screen overflow-auto py-16">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Spinner />
              <p className="text-gray-600">{processingText}</p>
            </div>
          ) : (
            <ResumeEditor 
              optimizedSections={optimizedSections}
              resumeData={resumeData}
              onResumeDataChange={handleSetResumeData}
            />
          )}
        </div>

        {/* 右侧AI对话界面 (3/10) */}
        <div className="w-[30%] p-2 bg-gray-50 h-screen overflow-auto pt-14">
          <ChatPanel />
        </div>
      </div>
    </div>
  )
}
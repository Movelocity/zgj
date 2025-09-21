import { useEffect, useRef, useState } from 'react';
import { FiMessageSquare, FiCheckCircle } from 'react-icons/fi';
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
import { TimeBasedProgressUpdater, RESUME_PROCESSING_STEPS } from '@/utils/progress';

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
  const [currentStage, setCurrentStage] = useState<'parsing' | 'structuring' | 'analyzing' | 'completed'>('parsing');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [editForm, setEditForm] = useState<ResumeUpdateRequest>({});
  const [progressUpdater, setProgressUpdater] = useState<TimeBasedProgressUpdater | null>(null);

  // 初始化进度更新器
  const initProgressUpdater = () => {
    const updater = new TimeBasedProgressUpdater(RESUME_PROCESSING_STEPS, {
      onProgressUpdate: (progress: number, text: string) => {
        setProgress(progress);
        setProgressText(text);
      },
      onStepComplete: (stepIndex: number, stepName: string) => {
        console.log(`Step ${stepIndex + 1} completed: ${stepName}`);
      },
      onAllComplete: () => {
        setCurrentStage('completed');
        setShowCompleted(true);
        setTimeout(() => {
          setShowCompleted(false);
          loadResumeDetail();
        }, 2000);
      }
    });
    setProgressUpdater(updater);
    return updater;
  };

  // 加载简历详情
  const loadResumeDetail = async () => {
    if (!id) return;
    
    try {
      const response = await resumeAPI.getResume(id);
      if (response.code === 0 && response.data) {
        const { name, text_content, structured_data, file_id } = response.data;
        if (!structured_data || !Object.keys(structured_data).length) { 
          if (!text_content) {
            if (file_id) {
              // 第一阶段：解析文件到文本
              setCurrentStage('parsing');
              setLoading(true);
              
              const updater = progressUpdater || initProgressUpdater();
              updater.startStep(0); // 开始第一步

              const response = await resumeAPI.resumeFileToText(id);
              if (response.code === 0) {
                updater.completeCurrentStep();
                setTimeout(() => {
                  loadResumeDetail(); // 重新加载以进入下一阶段
                }, 1000);
                return;
              } else {
                updater.stop();
                setLoading(false);
                showError('文件解析失败');
              }
            }
          } else if (text_content.length > 20) {
            // 第二阶段：结构化文本数据
            setCurrentStage('structuring');
            setLoading(true);
            
            const updater = progressUpdater || initProgressUpdater();
            updater.startStep(1); // 开始第二步

            const response = await resumeAPI.structureTextToJSON(id);
            if (response.code === 0) {
              updater.completeCurrentStep();
              setTimeout(() => {
                loadResumeDetail(); // 重新加载以进入下一阶段
              }, 1000);
              return;
            } else {
              updater.stop();
              setLoading(false);
              showError('数据结构化失败');
            }
          } else {
            // 文本内容太短，解析了也没用，直接创建默认模版
            setEditForm({
              name: name,
              text_content: text_content,
              structured_data: ResumeExample,
            });
            setResumeData(ResumeExample);
            setLoading(false);
          }
        } else {
          setEditForm({
            name: name,
            text_content: text_content,
            structured_data: structured_data,
          });
          setResumeData(structured_data);
          setLoading(false);
          setProgress(0);
          setProgressText('');
          setCurrentStage('parsing');
          setShowCompleted(false);
        }
      }
    } catch (error) {
      if (progressUpdater) {
        progressUpdater.stop();
      }
      showError(error instanceof Error ? error.message : '获取简历详情失败');
      setLoading(false);
      setProgress(0);
      setProgressText('');
      setCurrentStage('parsing');
      setShowCompleted(false);
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

  const loadTimeOutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (loadTimeOutRef.current) {
      clearTimeout(loadTimeOutRef.current);
    }
    loadTimeOutRef.current = setTimeout(() => {
      loadResumeDetail();
    }, 1);
  }, [id]);

  useEffect(() => {
    // 设置标签页标题
    document.title = `简历编辑 - 职管加`;
  }, []);

  // 清理进度更新器
  useEffect(() => {
    return () => {
      if (progressUpdater) {
        progressUpdater.stop();
      }
    };
  }, [progressUpdater]);
  

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
              <h1 className="text-xl">{ loading ? '正在处理您的简历' : '简历编辑' }</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center mr-4 bg-blue-50 px-3 py-1 rounded-lg">
              <FiMessageSquare className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-700">AI 优化简历</span>
            </div>
            <Button disabled={loading} variant="primary" onClick={handleSaveResume}>
              保存简历
            </Button>
          </div>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="flex-1 flex">
        {loading ? (
          <div className="flex justify-center items-center h-full w-full">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4">
              {!showCompleted ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-4">正在处理您的简历</h3>
                  </div>
                  
                  {/* 步骤指示器 */}
                  <div className="space-y-3">
                    <div className={`flex items-center space-x-3 ${currentStage === 'parsing' ? 'text-blue-600' : currentStage === 'structuring' || currentStage === 'analyzing' || currentStage === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStage === 'parsing' ? 'bg-blue-100 border-2 border-blue-600' : currentStage === 'structuring' || currentStage === 'analyzing' || currentStage === 'completed' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                        {currentStage === 'parsing' ? '1' : '✓'}
                      </div>
                      <span className="text-sm font-medium">简历文件解析</span>
                    </div>
                    
                    <div className={`flex items-center space-x-3 ${currentStage === 'structuring' ? 'text-blue-600' : currentStage === 'analyzing' || currentStage === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStage === 'structuring' ? 'bg-blue-100 border-2 border-blue-600' : currentStage === 'analyzing' || currentStage === 'completed' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                        {currentStage === 'structuring' ? '2' : currentStage === 'analyzing' || currentStage === 'completed' ? '✓' : '2'}
                      </div>
                      <span className="text-sm font-medium">简历数据结构化</span>
                    </div>
                    
                    <div className={`flex items-center space-x-3 ${currentStage === 'analyzing' ? 'text-blue-600' : currentStage === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStage === 'analyzing' ? 'bg-blue-100 border-2 border-blue-600' : currentStage === 'completed' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                        {currentStage === 'analyzing' ? '3' : currentStage === 'completed' ? '✓' : '3'}
                      </div>
                      <span className="text-sm font-medium">简历分析</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-6">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  {/* 当前处理步骤文本 */}
                  {progressText && (
                    <div className="text-center mt-4">
                      <p className="text-sm text-blue-600 font-medium">{progressText}</p>
                      <p className="text-xs text-gray-500 mt-1">{progress}% 完成</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <h3 className="text-lg font-medium">处理完成！</h3>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* 左侧优化后简历 (7/10) */}
            <div className="w-[70%] border-r border-gray-200 bg-white h-screen overflow-auto py-16">
              <ResumeEditor 
                optimizedSections={optimizedSections}
                resumeData={resumeData}
                onResumeDataChange={handleSetResumeData}
              />
            </div>

            {/* 右侧AI对话界面 (3/10) */}
            <div className="w-[30%] p-2 bg-gray-50 h-screen overflow-auto pt-14">
              <ChatPanel />
            </div>
          </>
        )}
        
      </div>
    </div>
  )
}
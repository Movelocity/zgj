import { useEffect, useRef, useState, useCallback } from 'react';
import { FiMessageSquare, FiCheckCircle } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, ArrowLeftIcon } from 'lucide-react';
import Button from "@/components/ui/Button"
import { useGlobalStore } from '@/store';
import ChatPanel, { type Message } from './components/ChatPanel';
import ResumeEditor from './components/ResumeEditor';
import { ResumeExample, EmptyResumeData, type ResumeData } from '@/types/resume';
import type { 
  ResumeUpdateRequest
} from '@/types/resume';
import { ensureItemsHaveIds } from '@/utils/id';
import { resumeAPI } from '@/api/resume';
import { showError, showSuccess } from '@/utils/toast';
import { TimeBasedProgressUpdater, RESUME_PROCESSING_STEPS } from '@/utils/progress';
import { workflowAPI } from '@/api/workflow';
import { parseResumeSummary, smartJsonParser } from '@/utils/helpers';

// 处理步骤类型
type ProcessingStage = 'parsing' | 'structuring' | 'analyzing' | 'completed';

// 步骤处理结果
interface StepResult {
  success: boolean;
  needsReload?: boolean;
  error?: string;
}

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

// 版本2
/**
resume block: 
{
  "title": "教育背景",
  "type": "list" | "text",
  "data": [
    {"id": "1", "name": "xx大学", "description": "主修课程xxx", "time": "2021.09 - 至今", "highlight": "熟悉xx等技术"},
    {"id": "2", "name": "xx大学", "description": "主修课程xxx", "time": "2021.09 - 至今", "highlight": "熟悉xx等技术"}
  ] | "xxx"
}
*/

export default function ResumeDetails() {
  const { setShowBanner } = useGlobalStore();
  useEffect(() => {
    setShowBanner(false);
    return () => {
      setShowBanner(true);
    };
  }, []);

  // 简历数据状态
  const [resumeData, setResumeData] = useState<ResumeData>(ResumeExample);
  const [newResumeData, setNewResumeData] = useState<ResumeData>(EmptyResumeData);  // AI优化后的内容，需人工确认后合并
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "您好，我是简历专家，您可以随时与我对话，我会根据您的需求进一步优化简历",
      timestamp: new Date(),
    }
  ]);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState<ProcessingStage>('parsing');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [editForm, setEditForm] = useState<ResumeUpdateRequest>({});
  const progressUpdaterRef = useRef<TimeBasedProgressUpdater | null>(null);

  // 初始化进度更新器
  const initProgressUpdater = useCallback(() => {
    if (progressUpdaterRef.current) {
      return progressUpdaterRef.current;
    }
    
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
        }, 2000);
      }
    });
    progressUpdaterRef.current = updater;
    return updater;
  }, []);

  // 清理进度状态
  const cleanupProgressState = useCallback(() => {
    if (progressUpdaterRef.current) {
      progressUpdaterRef.current.stop();
    }
    setLoading(false);
    setProgress(0);
    setProgressText('');
    setCurrentStage('parsing');
    setShowCompleted(false);
  }, []);

  // 添加聊天消息
  const addChatMessage = useCallback((content: string, type: 'user' | 'assistant' = 'assistant') => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, message]);
  }, []);

  // 步骤1：解析文件到文本
  const executeStep1_ParseFile = useCallback(async (resumeId: string): Promise<StepResult> => {
    try {
      setCurrentStage('parsing');
      setLoading(true);
      
      const updater = initProgressUpdater();
      updater.startStep(0);

      const response = await resumeAPI.resumeFileToText(resumeId);
      if (response.code === 0) {
        updater.completeCurrentStep();
        return { success: true, needsReload: true };
      } else {
        return { success: false, error: '文件解析失败' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '文件解析失败' };
    }
  }, [initProgressUpdater]);

  // 步骤2：结构化文本数据
  const executeStep2_StructureData = useCallback(async (resumeId: string): Promise<StepResult> => {
    try {
      setCurrentStage('structuring');
      setLoading(true);
      
      const updater = initProgressUpdater();
      updater.startStep(1);

      const response = await resumeAPI.structureTextToJSON(resumeId);
      if (response.code === 0) {
        updater.completeCurrentStep();
        return { success: true, needsReload: true };
      } else {
        return { success: false, error: '数据结构化失败' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '数据结构化失败' };
    }
  }, [initProgressUpdater]);

  // 步骤3：分析优化简历
  const executeStep3_AnalyzeResume = useCallback(async (
    _resumeId: string, // 保留用于未来扩展
    processedData: ResumeData,
    name: string,
    text_content: string
  ): Promise<StepResult> => {
    try {
      setCurrentStage('analyzing');
      setLoading(true);
      
      const updater = initProgressUpdater();
      updater.startStep(2);
      
      // 1. 调用阻塞式 API common-analysis
      console.log('开始简历分析优化...');
      const analysisResult = await workflowAPI.executeWorkflow("common-analysis", {
        origin_resume: JSON.stringify(processedData)
      }, true);
      
      if (analysisResult.code !== 0) {
        throw new Error('简历分析失败');
      }
      
      const analysisContent = analysisResult.data.data.outputs?.reply;
      console.log('分析结果:', analysisContent);
      
      if (!analysisContent || typeof analysisContent !== 'string') {
        throw new Error('分析结果格式错误');
      }
      
      // 2. 格式化结果
      console.log('开始格式化简历...');
      const lightResume = parseResumeSummary(processedData);
      const formatResult = await workflowAPI.executeWorkflow("smart-format", {
        current_resume: JSON.stringify(lightResume),
        new_resume: analysisContent
      }, true);
      
      if (formatResult.code !== 0) {
        throw new Error('简历格式化失败');
      }
      
      const structuredResumeData = formatResult.data.data.outputs?.output;
      console.log('格式化结果:', structuredResumeData);
      
      if (structuredResumeData && typeof structuredResumeData === 'string') {
        const finalResumeData = smartJsonParser<ResumeData>(structuredResumeData as string);
        
        // 确保格式化后的数据所有列表项都有唯一ID
        const finalProcessedData = {
          ...finalResumeData,
          workExperience: ensureItemsHaveIds(finalResumeData.workExperience || []),
          education: ensureItemsHaveIds(finalResumeData.education || []),
          projects: ensureItemsHaveIds(finalResumeData.projects || [])
        };
        
        // 添加AI优化消息到聊天面板
        addChatMessage(analysisContent, 'assistant');
        
        // 更新到newResumeData而不是直接更新resumeData
        setNewResumeData(finalProcessedData);
        
        // 原始数据保持不变
        setEditForm({
          name: name,
          text_content: text_content,
          structured_data: processedData,
        });
        setResumeData(processedData);
        
        updater.completeCurrentStep();
        console.log('简历优化完成');
        return { success: true };
      } else {
        throw new Error('格式化结果格式错误');
      }
    } catch (error) {
      console.error('第三阶段处理失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '简历分析优化失败' };
    }
  }, [initProgressUpdater, addChatMessage]);

  // 加载简历详情 - 重构后的简洁版本
  const loadResumeDetail = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await resumeAPI.getResume(id);
      if (response.code !== 0 || !response.data) {
        throw new Error('获取简历详情失败');
      }

      const { name, text_content, structured_data, file_id } = response.data;
      
      // 步骤1：解析文件
      if (!text_content && file_id) {
        const result = await executeStep1_ParseFile(id);
        if (result.success && result.needsReload) {
          setTimeout(() => loadResumeDetail(), 1000);
          return;
        } else if (!result.success) {
          throw new Error(result.error);
        }
      }
      
      // 步骤2：结构化数据
      if (text_content && text_content.length > 20 && (!structured_data || !Object.keys(structured_data).length)) {
        const result = await executeStep2_StructureData(id);
        if (result.success && result.needsReload) {
          setTimeout(() => loadResumeDetail(), 1000);
          return;
        } else if (!result.success) {
          throw new Error(result.error);
        }
      }
      
      // 文本太短，使用默认模板
      if (text_content && text_content.length <= 20) {
        setEditForm({ name, text_content, structured_data: ResumeExample });
        setResumeData(ResumeExample);
        setLoading(false);
        return;
      }
      
      // 有结构化数据
      if (structured_data && Object.keys(structured_data).length) {
        const processedData = {
          ...structured_data,
          workExperience: ensureItemsHaveIds(structured_data.workExperience || []),
          education: ensureItemsHaveIds(structured_data.education || []),
          projects: ensureItemsHaveIds(structured_data.projects || [])
        };
        console.log("processedData", processedData);
        
        // 步骤3：检查是否需要AI分析优化
        const hash = window.location.hash;
        if (hash === '#new_resume') {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          
          const result = await executeStep3_AnalyzeResume(id, processedData, name, text_content);
          if (!result.success) {
            showError(result.error || '简历分析优化失败');
            // 失败也显示原始数据
            setEditForm({ name, text_content, structured_data: processedData });
            setResumeData(processedData);
          }
        } else {
          // 直接显示数据
          setEditForm({ name, text_content, structured_data: processedData });
          setResumeData(processedData);
        }
        
        cleanupProgressState();
      }
    } catch (error) {
      cleanupProgressState();
      showError(error instanceof Error ? error.message : '获取简历详情失败');
    }
  }, [id, executeStep1_ParseFile, executeStep2_StructureData, executeStep3_AnalyzeResume, cleanupProgressState]);

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

  const handleSetNewResumeData = async (data: ResumeData) => {
    setNewResumeData(data);
  }

  const loadTimeOutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (loadTimeOutRef.current) {
      clearTimeout(loadTimeOutRef.current);
    }
    loadTimeOutRef.current = setTimeout(() => {
      loadResumeDetail();
    }, 1);
  }, [id, loadResumeDetail]);

  useEffect(() => {
    // 设置标签页标题
    document.title = `简历编辑 - 职管加`;
  }, []);

  // 清理进度更新器
  useEffect(() => {
    return () => {
      if (progressUpdaterRef.current) {
        progressUpdaterRef.current.stop();
      }
    };
  }, []);
  

  return (
    <div className="h-screen flex flex-col">
      {/* 头部导航 */}
      <div className="bg-white border-b border-gray-200 px-4 shadow-sm fixed top-0 w-full z-[1000]">
        <div className=" flex items-center justify-between h-14">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate("/resumes")} icon={<ArrowLeftIcon className="w-4 h-4" />}>
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
            <div className="w-full md:w-[70%] border-r border-gray-200 bg-white h-screen overflow-auto py-16">
              <ResumeEditor 
                resumeData={resumeData}
                newResumeData={newResumeData}
                onNewResumeDataChange={handleSetNewResumeData}
                onResumeDataChange={handleSetResumeData}
              />
            </div>

            {/* 右侧AI对话界面 (3/10) */}
            <div className="hidden md:block w-[30%] bg-gray-50 h-screen overflow-auto pt-14">
              <ChatPanel 
                resumeData={resumeData}
                onResumeDataChange={handleSetNewResumeData}
                initialMessages={chatMessages}
                onMessagesChange={setChatMessages}
              />
            </div>
          </>
        )}
        
      </div>
    </div>
  )
}
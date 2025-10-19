import { useEffect, useState, useCallback, useRef } from 'react';
import { FiMessageSquare, FiCheckCircle, FiSave } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, ArrowLeftIcon } from 'lucide-react';
import Button from "@/components/ui/Button";
import { useGlobalStore } from '@/store';
import ChatPanel, { type Message } from './components/ChatPanel';
import ResumeEditorV2 from './components/ResumeEditor';
import FontSettingsPanel, { type FontSettings } from './components/FontSettingsPanel';
import type { ResumeV2Data } from '@/types/resumeV2';
import { defaultResumeV2Data } from '@/types/resumeV2';
import { resumeAPI } from '@/api/resume';
import { showError, showSuccess } from '@/utils/toast';
import { isV1Format, isV2Format, convertV1ToV2 } from '@/utils/resumeConverter';
import { exportResumeToPDF } from '@/utils/pdfExport';
import { workflowAPI } from '@/api/workflow';
import type { ProcessingStage, StepResult } from './types';
import { TimeBasedProgressUpdater, RESUME_PROCESSING_STEPS } from '@/utils/progress';
import { parseAndFixResumeJson, fixResumeBlockFormat } from '@/utils/helpers';

export default function ResumeDetails() {
  const { setShowBanner } = useGlobalStore();
  useEffect(() => {
    setShowBanner(false);
    return () => {
      setShowBanner(true);
    };
  }, []);

  const [isJD, setIsJD] = useState(false);
  const appTypeRef = useRef<'jd' | 'new-resume' | 'normal'>('normal');

  // Resume data state
  const [resumeData, setResumeData] = useState<ResumeV2Data>(defaultResumeV2Data);
  const [newResumeData, setNewResumeData] = useState<ResumeV2Data>(defaultResumeV2Data);  // AI优化后的内容，需人工确认后合并
  // const [text_content, setTextContent] = useState<string>('');
  const [resumeName, setResumeName] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "您好，我是简历专家，我可以帮助您优化简历的各个板块。",
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
  const progressUpdaterRef = useRef<TimeBasedProgressUpdater | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isFontSettingsOpen, setIsFontSettingsOpen] = useState(false);
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    titleSize: 'medium',
    labelSize: 'medium',
    contentSize: 'medium',
  });

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

  // Add chat message
  const addChatMessage = useCallback((content: string, type: 'user' | 'assistant' = 'assistant') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    console.log('addChatMessage', newMessage);
    setChatMessages(prev => [...prev, newMessage]);
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
    const executeStep2_StructureData = useCallback(async (id: string, content: string): Promise<StepResult> => {
      try {
        setCurrentStage('structuring');
        setLoading(true);
        
        const updater = initProgressUpdater();
        updater.startStep(1);
  
        // const response = await resumeAPI.structureTextToJSON(resumeId);
        // 2. 调用阻塞式api，得到结构化的简历内容
        const uploadData = {
          current_resume: content,
          resume_edit: "请先结构化原文"
        }
        const structuredResumeResult = await workflowAPI.executeWorkflow("smart-format-2", uploadData, true);
        if (structuredResumeResult.code !== 0) {
          console.error('Execution error:', structuredResumeResult.data.message);
          return { success: false, error: '数据结构化失败' };
        }
        const structuredResumeData = structuredResumeResult.data.data.outputs?.output;
        console.log('structuredResumeData', structuredResumeData);

        if (structuredResumeData && typeof structuredResumeData === 'string') {
          const finalResumeData = parseAndFixResumeJson(structuredResumeData as string);
          setResumeData(finalResumeData);
          resumeAPI.updateResume(id, {
            structured_data: finalResumeData
          });
        }
        
        updater.completeCurrentStep();
        return { success: true, needsReload: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : '数据结构化失败' };
      }
    }, [initProgressUpdater]);
  
    // 步骤3：分析优化简历
    const executeStep3_AnalyzeResume = useCallback(async (
      _resumeId: string, // 保留用于未来扩展
      processedData: ResumeV2Data,
      _text_content: string
    ): Promise<StepResult> => {
      try {
        setCurrentStage('analyzing');
        setLoading(true);
        
        const updater = initProgressUpdater();
        updater.startStep(2);

        let analysisResult;

        if (appTypeRef.current === "jd") {
          // 1. 调用阻塞式 API common-analysis
          const job_description = localStorage.getItem('job_description');
          if (!job_description) {
            throw new Error('职位描述不存在，终止分析优化');
          }
          console.log('开始jd分析优化...', {
            job_description,
            resume_text: processedData
          });
          analysisResult = await workflowAPI.executeWorkflow("job-description-fitter", {
            job_description: job_description,
            resume_text: JSON.stringify(processedData)
          }, true);
        } else if (appTypeRef.current === "new-resume") {
          console.log('开始新简历分析优化...');
          analysisResult = await workflowAPI.executeWorkflow("common-analysis", {
            origin_resume: JSON.stringify(processedData)
          }, true);
        } else {
          return { success: false, error: '没有匹配的分析优化方式' };
        }
        
        if (analysisResult.code !== 0) {
          throw new Error('简历分析失败');
        }
        
        const analysisContent = analysisResult.data.data.outputs?.reply;
        console.log('分析结果:', analysisContent);

        // 添加AI优化消息到聊天面板
        addChatMessage(analysisContent, 'assistant');
        
        if (!analysisContent || typeof analysisContent !== 'string') {
          throw new Error('分析结果格式错误');
        }
        
        // 2. 格式化结果
        console.log('格式化优化后的简历...');
        // const lightResume = parseResumeSummary(processedData);
        const formatResult = await workflowAPI.executeWorkflow("smart-format-2", {
          current_resume: JSON.stringify(processedData),
          resume_edit: analysisContent
        }, true);
        
        if (formatResult.code !== 0) {
          throw new Error('简历格式化失败');
        }
        
        const structuredResumeData = formatResult.data.data.outputs?.output;
        console.log('格式化结果:', structuredResumeData);
        
        if (structuredResumeData && typeof structuredResumeData === 'string') {
          const finalResumeData = parseAndFixResumeJson(structuredResumeData as string);
          
          // parseAndFixResumeJson 已经确保了数据的有效性，直接使用
          // 更新到newResumeData而不是直接更新resumeData
          setNewResumeData(finalResumeData);
          
          // 原始数据保持不变
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
      } finally {
        setLoading(false);
      }
    }, [initProgressUpdater, addChatMessage]);

  // Load resume detail
  const loadResumeDetail = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await resumeAPI.getResume(id);
      if (response.code !== 0 || !response.data) {
        throw new Error('获取简历详情失败');
      }

      const { name, text_content, structured_data, file_id } = response.data;
      setResumeName(name);

      // 步骤1：没有文件时，解析文件
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
        const result = await executeStep2_StructureData(id, text_content);
        if (result.success && result.needsReload) {
          setTimeout(() => loadResumeDetail(), 1000);
          return;
        } else if (!result.success) {
          throw new Error(result.error);
        }
      }

      // 文本太短，使用默认模板
      if (text_content && text_content.length <= 20) {
        // setEditForm({ name, text_content, structured_data: defaultResumeV2Data });
        setResumeData(defaultResumeV2Data);
        setLoading(false);
        return;
      }

      // 有结构化数据，检查格式并自动转换版本
      if (structured_data && Object.keys(structured_data).length) {
        if (isV2Format(structured_data)) {
           // If V2 format, use directly
          setResumeData(structured_data as ResumeV2Data);
          console.log('structured_data', structured_data);
        } else if (isV1Format(structured_data)) { // If V1 format, convert to V2
          console.log('检测到V1格式简历，转换为V2格式');
          const convertedData = convertV1ToV2(structured_data);
          setResumeData(convertedData);
        } else { // Unknown format
          if (structured_data.blocks) {
            structured_data.blocks = fixResumeBlockFormat(structured_data.blocks) as any;
          }
          setResumeData(structured_data);
          console.log('未知简历格式，使用默认模板', structured_data);
        }

        // 步骤3：检查是否需要AI分析优化
        const hash = window.location.hash;
        if (hash === '#jd-new') {
          setIsJD(true);
          appTypeRef.current = "jd";
          document.title = `简历JD优化 - 职管加`;
          window.history.replaceState(null, '', window.location.pathname + window.location.search + '#jd');
          
          const result = await executeStep3_AnalyzeResume(id, structured_data as ResumeV2Data, text_content);
          if (!result.success) {
            showError(result.error || 'jd简历分析优化失败');
            console.warn(result.error);
          }
        } else if (hash === '#new_resume') {
          appTypeRef.current = "new-resume";
          document.title = `简历分析优化 - 职管加`;
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          
          const result = await executeStep3_AnalyzeResume(id, structured_data as ResumeV2Data, text_content);
          if (!result.success) {
            showError(result.error || '简历分析优化失败');
            console.warn(result.error);
          }
        } else if (hash === '#jd') {
          appTypeRef.current = "jd";
          setIsJD(true);
          document.title = `简历JD优化 - 职管加`;
        }
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error instanceof Error ? error.message : '获取简历详情失败');
    } finally {
      cleanupProgressState();
    }
  }, [id, addChatMessage, executeStep1_ParseFile, executeStep2_StructureData, executeStep3_AnalyzeResume, cleanupProgressState]);

  const loadTimeOutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (loadTimeOutRef.current) {
      clearTimeout(loadTimeOutRef.current);
    }
    loadTimeOutRef.current = setTimeout(() => {
      loadResumeDetail();
    }, 1);
  }, [id, loadResumeDetail]);

  // Save resume
  const handleSaveResume = async () => {
    if (!id) return;
    try {
      setSaving(true);
      await resumeAPI.updateResume(id, {
        name: resumeName,
        // text_content: text_content,
        structured_data: resumeData,
      });
      showSuccess('保存成功');
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 导出PDF
  const handleExportPDF = async () => {
    try {
      console.log('正在生成PDF，请稍候...');
      await exportResumeToPDF(resumeName || '简历');
      console.log('PDF导出成功');
    } catch (error) {
      showError(error instanceof Error ? error.message : '导出PDF失败');
    }
  }

  // Go back
  const handleGoBack = () => {
    navigate('/resumes');
  };

  // Handle resume data change
  const handleResumeDataChange = (newData: ResumeV2Data, require_commit: boolean) => {
    if (require_commit) {
      setNewResumeData(newData);
    } else {
      setResumeData(newData);
    }
  };

  useEffect(() => {
    // 设置标签页标题
    document.title = `简历优化 - 职管加`;
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              onClick={handleGoBack}
              variant="ghost"
              className="py-2 px-0 hover:bg-gray-100 rounded-lg transition-colors"
              title="返回"
              icon={<ArrowLeftIcon className="w-5 h-5" />}
            >
            </Button>
            <div className="hidden sm:flex items-center space-x-2 mr-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-semibold">简历编辑</h1>
            </div>
            <input
              id="resumeName"
              type="text"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              className="hidden md:block px-3 py-1 border border-gray-300 rounded-md focus:outline-none"
              placeholder="简历名称"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsChatOpen(!isChatOpen)}
              variant="ghost"
              icon={<FiMessageSquare className="w-4 h-4 mr-2" />}
            >
              AI对话
            </Button>

            <Button
              onClick={() => setIsFontSettingsOpen(true)}
              variant="outline"
              title="显示字体调节的面板"
            >
              页面
            </Button>
            
            <Button
              onClick={handleExportPDF}
              variant="outline"
            >
              导出PDF
            </Button>

            <Button
              onClick={handleSaveResume}
              disabled={isSaving}
              icon={<FiSave className="w-4 h-4 mr-2" />}
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
                      <span className="text-sm font-medium">{isJD ? 'JD简历优化' : '简历分析'}</span>
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
          {/* Editor Panel */}
          <div className="w-full flex-1 border-r border-gray-200 bg-white h-screen overflow-auto py-16">
            <ResumeEditorV2
              resumeData={resumeData}
              newResumeData={newResumeData}
              onNewResumeDataChange={setNewResumeData}
              onResumeDataChange={(data) => {handleResumeDataChange(data, false)}}
              fontSettings={fontSettings}
            />
          </div>

          {/* Chat Panel */}
          {isChatOpen && (
            <div className="hidden md:block w-[30%] bg-gray-50 h-screen overflow-auto pt-14">
              <ChatPanel
                initialMessages={chatMessages}
                onMessagesChange={setChatMessages}
                resumeData={resumeData}
                onResumeDataChange={(data, require_commit) => handleResumeDataChange(data as ResumeV2Data, require_commit)}
                isJD={isJD}
              />
            </div>
          )}

          {/* Font Settings Panel */}
          <FontSettingsPanel
            isOpen={isFontSettingsOpen}
            onClose={() => setIsFontSettingsOpen(false)}
            fontSettings={fontSettings}
            onFontSettingsChange={setFontSettings}
          />
          </>
          )}
      </div>
    </div>
  );
}


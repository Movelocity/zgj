import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { FiSave } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui";
import { useAuthStore, useGlobalStore } from '@/store';
import ChatPanel, { type Message } from './components/ChatPanel';
import ResumeEditorV2 from './components/ResumeEditor';
import FontSettingsDropdown from './components/FontSettingsDropdown';
import ExportSplitButton from './components/ExportSplitButton';
import VersionSelector from './components/VersionSelector';
import TargetSelector, { type TargetType } from './components/TargetSelector';
import { type FontSettings } from './components/FontSettingsPanel';
import LoadingIndicator, { type LoadingStage } from '@/components/LoadingIndicator';
import type { ResumeV2Data } from '@/types/resumeV2';
import { defaultResumeV2Data } from '@/types/resumeV2';
import { resumeAPI } from '@/api/resume';
import { showError, showSuccess, showInfo } from '@/utils/toast';
import { isV1Format, isV2Format, convertV1ToV2 } from '@/utils/resumeConverter';
import { exportResumeToPDF, exportResumeToPDFViaCanvas } from '@/utils/pdfExport';
import { workflowAPI } from '@/api/workflow';
import { createExportTask, getExportTaskStatus, downloadExportPdf } from '@/api/pdfExport';
import type { ProcessingStage, StepResult } from './types';
import { TimeBasedProgressUpdater, RESUME_PROCESSING_STEPS } from '@/utils/progress';
import { parseAndFixResumeJson, fixResumeBlockFormat } from '@/utils/helpers';
import { chatMessageAPI } from '@/api/chatMessage';


export default function ResumeDetails() {
  const { setShowBanner } = useGlobalStore();
  useEffect(() => {
    setShowBanner(false);
    return () => {
      setShowBanner(true);
    };
  }, []);

  const { id: resumeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Metadata state - 所有关键状态都从这里派生
  const [metadata, setMetadata] = useState<{
    currentTarget?: TargetType;
    isNewResume?: boolean;
    processingStage?: 'not_started' | 'parsed' | 'structured' | 'analyzed' | 'completed';
    lastUpdated?: string;
    [key: string]: any;
  }>({});
  
  // 使用 ref 保持最新的 metadata 引用，避免闭包问题
  const metadataRef = useRef(metadata);
  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  // 从 metadata 派生的状态
  const currentTarget = metadata.currentTarget || 'normal';
  const isJD = currentTarget === 'jd';
  
  // 更新 metadata 的钩子函数，可以传递给子组件使用
  const updateMetadata = useCallback(async (updates: Partial<typeof metadata>, persistToServer = true) => {
    const updatedMetadata = {
      ...metadataRef.current,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    
    console.log('[ResumeDetails] 更新metadata:', updates);
    setMetadata(updatedMetadata);
    
    // 持久化到服务器
    if (persistToServer && resumeId) {
      try {
        await resumeAPI.updateResume(resumeId, {
          metadata: updatedMetadata,
        });
      } catch (error) {
        console.error('[ResumeDetails] 保存metadata失败:', error);
      }
    }
    
    return updatedMetadata;
  }, [resumeId]); // 只依赖 resumeId

  // Resume data state
  const [resumeData, setResumeData] = useState<ResumeV2Data>(defaultResumeV2Data);
  const [newResumeData, setNewResumeData] = useState<ResumeV2Data>(defaultResumeV2Data);  // AI优化后的内容，需人工确认后合并
  const [resumeName, setResumeName] = useState<string>('');
  const [resumeNumber, setResumeNumber] = useState<string>('');
  const [resumeVersion, setResumeVersion] = useState<number>(1);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "您好，我是简历专家，我可以帮助您优化简历的各个板块。",
      timestamp: new Date(),
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState<ProcessingStage>('parsing');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const progressUpdaterRef = useRef<TimeBasedProgressUpdater | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    titleSize: 'medium',
    labelSize: 'medium',
    contentSize: 'medium',
  });

  // 加载步骤配置
  const loadingStages: LoadingStage[] = useMemo(() => [
    { key: 'parsing', label: '简历文件解析', order: 1 },
    { key: 'structuring', label: '简历信息结构化', order: 2 },
    { key: 'analyzing', label: isJD ? 'JD简历优化' : 'AI简历分析', order: 3 },
    { key: 'exporting', label: '简历内容优化', order: 4 },
  ], [isJD]);

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

  const { user } = useAuthStore();
  const userName = user?.name || user?.phone || '用户';

  // Save message to backend
  const saveMessageToBackend = async (message: Message) => {
    if (!resumeId) return;
    
    try {
      await chatMessageAPI.createMessage({
        resume_id: resumeId,
        sender_name: message.type === 'user' ? userName : 'AI助手',
        message: {
          content: message.content,
        },
      });
      console.log('[ChatPanel] 消息已保存到后端:', message.id);
    } catch (error) {
      console.error('[ChatPanel] 保存消息失败:', error);
    }
  };

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
    
    // 触发自定义事件，通知 ChatPanel 有新消息并滚动到底部
    window.dispatchEvent(new CustomEvent('chat-message-added', {
      detail: { message: newMessage }
    }));
    
    return newMessage;
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
        // 更新处理阶段到 metadata
        await updateMetadata({ processingStage: 'parsed' }, true);
        return { success: true, needsReload: true };
      } else {
        return { success: false, error: '文件解析失败' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '文件解析失败' };
    }
  }, [initProgressUpdater, updateMetadata]);
  
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
        await resumeAPI.updateResume(id, {
          structured_data: finalResumeData
        });
      }
      
      updater.completeCurrentStep();
      // 更新处理阶段到 metadata
      await updateMetadata({ processingStage: 'structured', hasStructuredData: true }, true);
      return { success: true, needsReload: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '数据结构化失败' };
    }
  }, [initProgressUpdater, updateMetadata]);


  // Load resume detail
  const loadResumeDetail = useCallback(async () => {
    if (!resumeId) return;
    
    // 防止并发加载
    if (isLoadingRef.current) {
      console.log('[ResumeDetails] 检测到并发加载请求，已忽略');
      return;
    }
    
    isLoadingRef.current = true;
    let shouldCleanup = true; // 用于控制是否清理状态
    
    try {
      setLoading(true);
      const response = await resumeAPI.getResume(resumeId);
      if (response.code !== 0 || !response.data) {
        throw new Error('获取简历详情失败');
      }

      const { name, text_content, structured_data, file_id, pending_content, metadata: serverMetadata, resume_number, version } = response.data;
      setResumeName(name);
      setResumeNumber(resume_number);
      setResumeVersion(version);
      
      // 恢复完整的 metadata
      if (serverMetadata && Object.keys(serverMetadata).length > 0) {
        console.log('[ResumeDetails] 从服务器恢复metadata:', serverMetadata);
        setMetadata(serverMetadata);
        
        // 同步更新文档标题
        if (serverMetadata.currentTarget === 'jd') {
          document.title = `简历JD优化 - 职管加`;
        } else if (serverMetadata.currentTarget === 'foreign') {
          document.title = `英文简历优化 - 职管加`;
        } else {
          document.title = `简历优化 - 职管加`;
        }
      }
      
      // 恢复pending_content中的聊天记录和简历数据
      if (pending_content) {
        console.log('[ResumeDetails] 发现pending_content，恢复数据:', pending_content);
        if (pending_content.newResumeData) {
          setNewResumeData(pending_content.newResumeData);
        }
      }

      // 步骤1：没有文件时，解析文件
      if (!text_content && file_id) {
        // 检查是否已经处理过，避免重复处理
        const currentMetadata = metadataRef.current;
        if (currentMetadata.processingStage === 'parsed' || currentMetadata.processingStage === 'structured' || currentMetadata.processingStage === 'analyzed') {
          console.log('[ResumeDetails] 已处理过步骤1，跳过');
        } else {
          const result = await executeStep1_ParseFile(resumeId);
          if (result.success && result.needsReload) {
            shouldCleanup = false; // 需要重新加载，不清理状态
            setTimeout(() => loadResumeDetail(), 1000);
            return;
          } else if (!result.success) {
            throw new Error(result.error);
          }
        }
      }
      
      // 步骤2：结构化数据
      if (text_content && text_content.length > 20 && (!structured_data || !Object.keys(structured_data).length)) {
        // 检查是否已经处理过，避免重复处理
        const currentMetadata = metadataRef.current;
        if (currentMetadata.processingStage === 'structured' || currentMetadata.processingStage === 'analyzed') {
          console.log('[ResumeDetails] 已处理过步骤2，跳过');
        } else {
          const result = await executeStep2_StructureData(resumeId, text_content);
          if (result.success && result.needsReload) {
            shouldCleanup = false; // 需要重新加载，不清理状态
            setTimeout(() => loadResumeDetail(), 1000);
            return;
          } else if (!result.success) {
            throw new Error(result.error);
          }
        }
      }

      // 文本太短，使用默认模板
      if (text_content && text_content.length <= 20) {
        setResumeData(defaultResumeV2Data);
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
        const currentMetadata = metadataRef.current;
        
        // 检查是否是从 SimpleResume.tsx 上传的新简历需要初始化分析
        if (currentMetadata.isNewResume === true) {
          console.log('[ResumeDetails] 检测到新简历，运行初始化分析...');
          document.title = `简历分析优化 - 职管加`;
          
          try {
            // Run common-analysis workflow directly
            console.log('开始新简历分析优化...');
            setLoading(true);
            setCurrentStage('analyzing');
            const updater = initProgressUpdater();
            updater.startStep(2);
            
            const processedData = structured_data as ResumeV2Data;
            let analysisContent = currentMetadata.initialAnalysisContent;
            if (!analysisContent) {
              const analysisResult = await workflowAPI.executeWorkflow("common-analysis", {
                origin_resume: JSON.stringify(processedData),
                job_description: metadataRef.current.jobDescription || '',
                scene: metadataRef.current.currentTarget || '',
              }, true);
              
              if (analysisResult.code !== 0) {
                throw new Error('简历分析失败');
              }
              
              const analysisContent = analysisResult.data.data.outputs?.reply;
  
              console.log('分析结果:', analysisContent);
              const newMessage = addChatMessage(analysisContent, 'assistant');
              saveMessageToBackend(newMessage);
  
              
              if (!analysisContent || typeof analysisContent !== 'string') {
                throw new Error('分析结果格式错误');
              }
  
              // Mark initialization complete and update processing stage
              await updateMetadata({
                initialAnalysisContent: analysisContent,
              }, true); // 暂存到服务器，防止下面的步骤炸了这里又要重来
            }
            
            // Format result
            console.log('格式化优化后的简历...');
            setCurrentStage('exporting');
            updater.startStep(3);
            // const formatResult = await workflowAPI.executeWorkflow("smart-format-2", {
            //   current_resume: JSON.stringify(processedData),
            //   resume_edit: analysisContent
            // }, true);
            
            // if (formatResult.code !== 0) {
            //   throw new Error('简历格式化失败');
            // }
            
            // const formattedResult = formatResult.data.data.outputs?.output;
            // if (!formattedResult) {
            //   throw new Error('格式化结果为空');
            // }
            
            // const formattedResumeData = parseAndFixResumeJson(formattedResult);
            // setNewResumeData(formattedResumeData);
            
            // Mark initialization complete and update processing stage
            await updateMetadata({
              isNewResume: false,
              processingStage: 'completed',
              initialAnalysisContent: "cleared"  // 内容已经被消费，可以清理了
            }, false); // 不立即持久化，和 pending_content 一起更新
            
            await resumeAPI.updateResume(resumeId, {
              metadata: {
                ...metadataRef.current,
                isNewResume: false,
                processingStage: 'completed',
                lastUpdated: new Date().toISOString(),
              },
              // pending_content: {
              //   newResumeData: formattedResumeData,
              // }
            });
            
            updater.completeCurrentStep();
            console.log('新简历分析完成');
            showSuccess('新简历分析完成');
          } catch (error) {
            console.error('[ResumeDetails] 新简历分析失败:', error);
            showError(error instanceof Error ? error.message : '简历分析优化失败');
          } finally {
            cleanupProgressState();
          }
        }
      }
      
    } catch (error) {
      showError(error instanceof Error ? error.message : '获取简历详情失败');
    } finally {
      // 只有在不需要重新加载时才清理状态
      if (shouldCleanup) {
        cleanupProgressState();
      }
      // 无论如何都要释放加载锁
      isLoadingRef.current = false;
    }
  }, [resumeId]); // 只依赖 resumeId，避免循环依赖

  // 添加加载锁，防止并发加载
  const isLoadingRef = useRef(false);
  const loadTimeOutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (loadTimeOutRef.current) {
      clearTimeout(loadTimeOutRef.current);
    }
    loadTimeOutRef.current = setTimeout(() => {
      loadResumeDetail();
    }, 1);
  }, [resumeId]); // 移除 loadResumeDetail 依赖，只依赖 resumeId

  // Save resume
  const handleSaveResume = async () => {
    if (!resumeId) return;
    try {
      setSaving(true);
      // 默认创建新版本（new_version: true）
      const response = await resumeAPI.updateResume(resumeId, {
        name: resumeName,
        // text_content: text_content,
        structured_data: resumeData,
        metadata: metadata, // 保存完整的 metadata
        new_version: true, // 创建新版本而不是覆盖原简历
      });
      
      // 如果创建了新版本，导航到新版本页面
      if (response.code === 0 && response.data?.new_resume_id) {
        showSuccess('保存成功，已创建新版本');
        // 导航到新版本
        navigate(`/editor/v2/${response.data.new_resume_id}`);
      } else {
        showSuccess('保存成功');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 导出文字PDF（浏览器打印）
  const handleTextPdfExport = async () => {
    try {
      setIsExporting(true);
      console.log('正在生成文字PDF，请稍候...');
      await exportResumeToPDF(resumeName || '简历');
      console.log('文字PDF导出成功');
    } catch (error) {
      showError(error instanceof Error ? error.message : '导出PDF失败');
    } finally {
      setIsExporting(false);
    }
  };

  // 导出图片PDF（Canvas方式）
  const handleImagePdfExport = async () => {
    try {
      setIsExporting(true);
      console.log('正在生成图片PDF，请稍候...');
      await exportResumeToPDFViaCanvas(resumeName || '简历');
      console.log('图片PDF导出成功');
      showSuccess('PDF导出成功');
    } catch (error) {
      showError(error instanceof Error ? error.message : '导出PDF失败，请尝试使用文字PDF打印');
    } finally {
      setIsExporting(false);
    }
  };

  // 服务端PDF导出
  const handleServerExport = async () => {
    if (!resumeId) {
      showError('简历ID不存在');
      return;
    }

    try {
      setIsExporting(true);
      showInfo('正在生成PDF，请稍候...');

      // 1. 创建导出任务（传递当前编辑的简历数据作为快照）
      const createRes: any = await createExportTask(resumeId, resumeData);
      if (createRes.code !== 0) {
        throw new Error(createRes.msg || '创建导出任务失败');
      }

      const taskId = createRes.data.task_id;
      console.log('导出任务已创建:', taskId);

      // 2. 轮询任务状态（简单版本）
      const maxAttempts = 60; // 最多轮询60次（120秒）
      let attempts = 0;

      const checkStatus = async (): Promise<void> => {
        attempts++;
        
        try {
          const statusRes: any = await getExportTaskStatus(taskId);
          const status = statusRes.data.status;

          if (status === 'completed') {
            showSuccess('PDF生成完成！');
            // 自动下载，使用简历标题作为文件名
            const filename = `${resumeName || '简历'}.pdf`;
            await downloadExportPdf(taskId, filename);
            setIsExporting(false);
          } else if (status === 'failed') {
            showError('PDF生成失败：' + (statusRes.data.error_message || '未知错误'));
            setIsExporting(false);
          } else if (attempts >= maxAttempts) {
            showError('PDF生成超时，请稍后重试');
            setIsExporting(false);
          } else {
            // 继续轮询
            setTimeout(checkStatus, 2000);
          }
        } catch (error) {
          showError(error instanceof Error ? error.message : '查询任务状态失败');
          setIsExporting(false);
        }
      };

      // 开始轮询
      setTimeout(checkStatus, 2000);

    } catch (error) {
      showError(error instanceof Error ? error.message : '导出失败，请重试');
      setIsExporting(false);
    }
  };

  // Go back
  const handleGoBack = () => {
    navigate('/resumes');
  };
  
  // Handle version change
  const handleVersionChange = (newResumeId: string, newVersion: number) => {
    console.log('Switching to version:', newVersion, 'ID:', newResumeId);
    navigate(`/editor/v2/${newResumeId}`);
    // 页面会重新加载，自动加载新版本的数据
  };

  // Handle resume data change
  const handleResumeDataChange = (newData: ResumeV2Data, require_commit: boolean) => {
    if (require_commit) {
      setNewResumeData(newData);
    } else {
      setResumeData(newData);
    }
  };

  // Handle target change
  const handleTargetChange = useCallback(async (newTarget: TargetType) => {
    console.log('[ResumeDetails] 切换目标类型:', newTarget);
    
    // 使用 updateMetadata 钩子更新并持久化
    await updateMetadata({ currentTarget: newTarget }, true);
    
    showSuccess(`已切换到${newTarget === 'jd' ? '职位匹配' : newTarget === 'foreign' ? '英文简历' : '常规优化'}模式`);
  }, [updateMetadata]);

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

  const showContent = !metadata.isNewResume || metadata.hasStructuredData;
  // console.log('showContent', showContent);

  return (
    <div className="fixed top-0 left-0 h-screen w-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 z-40">
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              onClick={handleGoBack}
              variant="ghost"
              className="py-2 px-0 hover:bg-gray-100 rounded-lg transition-colors"
              title="返回"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex items-center space-x-2 mr-4">
              <img src="/images/agent256.webp" alt="logo" className="h-8" />
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
            <VersionSelector
              currentResumeId={resumeId || ''}
              currentVersion={resumeVersion}
              resumeNumber={resumeNumber}
              onVersionChange={handleVersionChange}
            />
            
            <FontSettingsDropdown
              fontSettings={fontSettings}
              onFontSettingsChange={setFontSettings}
            />
            
            <ExportSplitButton
              onTextPdfExport={handleTextPdfExport}
              onImagePdfExport={handleImagePdfExport}
              onServerExport={handleServerExport}
              isExporting={isExporting}
            />

            <Button
              onClick={handleSaveResume}
              disabled={isSaving}
              variant="primary"
            >
              <FiSave className="w-4 h-4 mr-2" />
              保存
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {showContent && (
          <>
            {/* Editor Panel */}
            <div className="w-full md:flex-1 border-gray-200 bg-white overflow-auto" style={{ height: 'calc(100vh - 48px)' }}>
              <ResumeEditorV2
                resumeData={resumeData}
                newResumeData={newResumeData}
                onNewResumeDataChange={setNewResumeData}
                onResumeDataChange={(data) => {handleResumeDataChange(data, false)}}
                fontSettings={fontSettings}
              />
            </div>

            {/* Chat Panel - 始终渲染，内部控制显示/隐藏 */}
            <ChatPanel
              initialMessages={chatMessages}
              onMessagesChange={setChatMessages}
              resumeData={resumeData}
              onResumeDataChange={(data, require_commit) => handleResumeDataChange(data as ResumeV2Data, require_commit)}
              resumeId={resumeId}
              currentTarget={currentTarget}
              updateMetadata={updateMetadata}
              emptyComponent={
                <TargetSelector
                  currentTarget={currentTarget}
                  onTargetChange={handleTargetChange}
                />
              }
              saveMessageToBackend={saveMessageToBackend}
            />
          </>
        )}

        {loading && (
          <LoadingIndicator
            stages={loadingStages}
            currentStage={currentStage}
            progress={progress}
            progressText={progressText}
            showCompleted={showCompleted}
            title="正在处理您的简历"
            classNames={metadata.hasStructuredData ? 'bg-black/20' : ''}
          />
        )}
      </div>
    </div>
  );
}


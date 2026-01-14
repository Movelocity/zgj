/**
 * Interview Review Detail Page
 * Handles both creation workflow and view/retry modes
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiUpload, FiRefreshCw, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { Button } from '@/components/ui';
import { StepIndicator } from '@/components/interview/StepIndicator';
import { ReviewStatusBadge } from '@/components/interview/ReviewStatusBadge';
import { ASRResultViewer } from '@/components/interview/ASRResultViewer';
import { AnalysisMarkdownRenderer } from '@/components/interview/AnalysisMarkdownRenderer';
import { useInterviewWorkflow } from './hooks/useInterviewWorkflow';
import { useReviewPolling } from './hooks/useReviewPolling';
import { interviewAPI } from '@/api/interview';
import { tosAPI } from '@/api/tos';
import { asrAPI } from '@/api/asr';
import { showError, showSuccess, showInfo } from '@/utils/toast';
import type { InterviewReview, WorkflowStep } from '@/types/interview';
import type { ASRTask } from '@/api/asr';

const WORKFLOW_STEPS: WorkflowStep[] = [
  { key: 'upload', label: '上传音频' },
  { key: 'asr', label: '语音识别' },
  { key: 'analyze', label: 'AI分析' },
];

export const InterviewReviewDetail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reviewId = searchParams.get('id');

  // Mode: creation (no id) or view (with id)
  const isViewMode = !!reviewId;

  // Creation mode state
  const workflow = useInterviewWorkflow();

  // View mode state
  const [review, setReview] = useState<InterviewReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Step-specific state
  const [uploading, setUploading] = useState(false);
  const [asrProcessing, setAsrProcessing] = useState(false);
  const [asrTask, setAsrTask] = useState<ASRTask | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Polling for view mode
  const { review: polledReview, isPolling } = useReviewPolling(
    reviewId ? parseInt(reviewId) : null,
    {
      enabled: isViewMode,
      onComplete: (completedReview) => {
        setReview(completedReview);
        if (completedReview.metadata.status === 'completed') {
          showSuccess('分析完成！');
        }
      },
    }
  );

  // Load review data in view mode
  useEffect(() => {
    if (isViewMode && reviewId) {
      loadReview(parseInt(reviewId));
    }
  }, [reviewId, isViewMode]);

  // Update review when polling gets new data
  useEffect(() => {
    if (polledReview) {
      setReview(polledReview);
    }
  }, [polledReview]);

  /**
   * Load review from API
   */
  const loadReview = async (id: number) => {
    setLoading(true);
    try {
      const data = await interviewAPI.getReview(id);
      setReview(data);
    } catch (error) {
      showError('加载面试复盘失败');
      console.error('Failed to load review:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle audio file selection and upload
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) {
      showError('请上传 MP3、WAV 或 OGG 格式的音频文件');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('文件大小不能超过 100MB');
      return;
    }

    setUploading(true);
    try {
      // Upload to TOS
      const upload = await tosAPI.uploadToTOS(file);
      
      // Generate download URL
      const downloadResponse = await tosAPI.generateDownloadURL(upload.key);
      const audioUrl = downloadResponse.data.url;

      // Store in workflow state
      workflow.handleUploadComplete(audioUrl, upload.key, file);
      
      showSuccess('音频上传成功');
      
      // Auto-advance to next step
      workflow.goToStep(2);
    } catch (error) {
      showError('音频上传失败');
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Start ASR processing
   */
  const startAsrProcessing = async () => {
    if (!workflow.audioUrl) {
      showError('请先上传音频文件');
      return;
    }

    setAsrProcessing(true);
    try {
      // Determine audio format from file name
      const extension = workflow.audioFile?.name.split('.').pop()?.toLowerCase() || 'mp3';
      const format = extension === 'mp3' ? 'mp3' : extension === 'wav' ? 'wav' : 'mp3';

      // Submit ASR task
      const response = await asrAPI.submitTask({
        audio_url: workflow.audioUrl,
        audio_format: format as any,
        options: {
          enable_itn: true,
          enable_ddc: true,
        },
      });

      if (response.code !== 0) {
        throw new Error(response.msg || '提交识别任务失败');
      }

      const taskId = response.data.id;
      showInfo('语音识别任务已提交，正在处理...');

      // Poll until complete
      const completedTask = await asrAPI.pollUntilComplete(
        taskId,
        (task) => {
          setAsrTask(task);
        },
        60,
        3000
      );

      if (completedTask.status === 'failed') {
        throw new Error(completedTask.error_message || '语音识别失败');
      }

      // Parse result
      const parsedResult = asrAPI.parseResult(completedTask);
      if (!parsedResult) {
        throw new Error('无法解析识别结果');
      }

      // Store in workflow state
      workflow.handleAsrComplete(taskId, parsedResult);
      
      showSuccess('语音识别完成');
      
      // Auto-advance to next step
      workflow.goToStep(3);
    } catch (error) {
      showError(error instanceof Error ? error.message : '语音识别失败');
      console.error('ASR failed:', error);
    } finally {
      setAsrProcessing(false);
    }
  };

  /**
   * Create review and trigger analysis
   */
  const createReviewAndAnalyze = async () => {
    if (!workflow.asrTaskId || !workflow.asrResult) {
      showError('请先完成语音识别');
      return;
    }

    setAnalyzing(true);
    try {
      // Create review record
      // 后端期望 { main_audio_id, asr_result }，metadata 由后端自动构建
      const createdReview = await interviewAPI.createReview({
        main_audio_id: workflow.asrTaskId,
        asr_result: workflow.asrResult,
      });

      // Update workflow state
      workflow.handleReviewCreated(createdReview.id);

      // Update URL without navigation
      navigate(`/interview/reviews?id=${createdReview.id}`, { replace: true });

      showInfo('已创建复盘记录，正在提交分析任务...');

      // Trigger analysis
      await interviewAPI.triggerAnalysis(createdReview.id);
      
      showSuccess('分析任务已提交，请稍候...');

      // Load the created review into view mode
      await loadReview(createdReview.id);
    } catch (error) {
      showError('创建复盘失败');
      console.error('Create review failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Retry analysis for existing review
   */
  const retryAnalysis = async () => {
    if (!review) return;

    // Check if already processing
    if (review.metadata.status === 'transcribing' || review.metadata.status === 'analyzing') {
      showInfo('任务正在进行中，请稍候');
      return;
    }

    setRetrying(true);
    try {
      await interviewAPI.triggerAnalysis(review.id);
      showSuccess('已重新提交分析任务');
      
      // Reload review
      await loadReview(review.id);
    } catch (error) {
      showError('重新分析失败');
      console.error('Retry failed:', error);
    } finally {
      setRetrying(false);
    }
  };

  /**
   * Render creation mode
   */
  const renderCreationMode = () => (
    <div className="max-w-4xl mx-auto mt-12">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">新建面试复盘</h1>
          <p className="text-gray-600 mt-1">上传面试录音，获取 AI 分析反馈</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/interview')}>
          <FiArrowLeft className="mr-2" />
          返回列表
        </Button>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        steps={WORKFLOW_STEPS}
        currentStep={workflow.currentStep}
        completedSteps={workflow.completedSteps}
        onStepClick={workflow.goToStep}
        canNavigateBack={!workflow.reviewId}
      />

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {workflow.currentStep === 1 && renderUploadStep()}
        {workflow.currentStep === 2 && renderAsrStep()}
        {workflow.currentStep === 3 && renderAnalyzeStep()}
      </div>
    </div>
  );

  /**
   * Render Step 1: Upload Audio
   */
  const renderUploadStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">上传面试录音</h2>
        <p className="text-gray-600">
          支持 MP3、WAV、OGG 格式，文件大小不超过 100MB
        </p>
      </div>

      {workflow.audioFile ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">已选择文件</p>
              <p className="text-sm text-green-700">{workflow.audioFile.name}</p>
              <p className="text-xs text-green-600">
                {(workflow.audioFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm">
                重新选择
              </Button>
              <input
                type="file"
                accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      ) : (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
            <FiUpload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">点击选择文件或拖拽文件到此处</p>
            <p className="text-sm text-gray-500">支持 MP3、WAV、OGG 格式</p>
          </div>
          <input
            type="file"
            accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}

      {uploading && (
        <div className="text-center text-gray-600">
          <FiRefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
          <p>正在上传...</p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          onClick={() => workflow.goToStep(2)}
          disabled={!workflow.audioFile || uploading}
        >
          下一步
          <FiArrowRight className="ml-2" />
        </Button>
      </div>
    </div>
  );

  /**
   * Render Step 2: ASR Processing
   */
  const renderAsrStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">语音识别</h2>
        <p className="text-gray-600">
          将音频转换为文字，用于后续分析
        </p>
      </div>

      {workflow.asrResult ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-900 mb-2">识别完成</p>
          <p className="text-sm text-green-700">
            识别文本长度：{workflow.asrResult.text.length} 字
          </p>
          {workflow.asrResult.segments && (
            <p className="text-xs text-green-600">
              分段数量：{workflow.asrResult.segments.length}
            </p>
          )}
        </div>
      ) : asrProcessing ? (
        <div className="text-center py-8">
          <FiRefreshCw className="w-12 h-12 mx-auto animate-spin text-blue-500 mb-4" />
          <p className="text-gray-900 font-medium mb-2">正在识别音频内容...</p>
          {asrTask && (
            <div className="text-sm text-gray-600">
              <p>进度：{asrTask.progress}%</p>
              <p className="mt-1">状态：{asrTask.status}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">点击下方按钮开始语音识别</p>
          <Button onClick={startAsrProcessing} disabled={asrProcessing}>
            <FiRefreshCw className="mr-2" />
            开始识别
          </Button>
        </div>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => workflow.goToStep(1)}
          disabled={asrProcessing}
        >
          <FiArrowLeft className="mr-2" />
          上一步
        </Button>
        <Button
          onClick={() => workflow.goToStep(3)}
          disabled={!workflow.asrResult || asrProcessing}
        >
          下一步
          <FiArrowRight className="ml-2" />
        </Button>
      </div>
    </div>
  );

  /**
   * Render Step 3: Analysis
   */
  const renderAnalyzeStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 面试分析</h2>
        <p className="text-gray-600">
          基于语音识别结果，生成面试表现分析报告
        </p>
      </div>

      {workflow.reviewId ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">复盘记录已创建</p>
          <p className="text-sm text-blue-700">
            分析任务正在进行中，请稍候...
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">准备就绪，点击下方按钮开始分析</p>
          <Button onClick={createReviewAndAnalyze} disabled={analyzing}>
            {analyzing ? (
              <>
                <FiRefreshCw className="mr-2 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <FiRefreshCw className="mr-2" />
                开始分析
              </>
            )}
          </Button>
        </div>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => workflow.goToStep(2)}
          disabled={!!workflow.reviewId || analyzing}
        >
          <FiArrowLeft className="mr-2" />
          上一步
        </Button>
      </div>
    </div>
  );

  /**
   * Render view mode
   */
  const renderViewMode = () => {
    if (loading || !review) {
      return (
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      );
    }

    const isCompleted = review.metadata.status === 'completed';
    const isFailed = review.metadata.status === 'failed' || review.metadata.status === 'timeout';
    const isProcessing = review.metadata.status === 'transcribing' || review.metadata.status === 'analyzing';

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">面试复盘详情</h1>
              <ReviewStatusBadge status={review.metadata.status} />
            </div>
            <p className="text-gray-600">
              创建时间：{new Date(review.created_at).toLocaleString('zh-CN')}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/interview')}>
            <FiArrowLeft className="mr-2" />
            返回列表
          </Button>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">岗位：</span>
              <span className="text-gray-900">
                {review.metadata.job_position || '未填写'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">公司：</span>
              <span className="text-gray-900">
                {review.metadata.target_company || '未填写'}
              </span>
            </div>
            {review.metadata.audio_filename && (
              <div>
                <span className="text-gray-500">音频文件：</span>
                <span className="text-gray-900">
                  {review.metadata.audio_filename}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <FiRefreshCw className="w-12 h-12 mx-auto animate-spin text-blue-500 mb-4" />
            <p className="text-lg font-medium text-blue-900 mb-2">
              {review.metadata.status === 'transcribing' ? '语音识别中...' : 'AI分析中...'}
            </p>
            <p className="text-sm text-blue-700">
              这可能需要几分钟时间，请稍候
            </p>
            {isPolling && (
              <p className="text-xs text-blue-600 mt-2">
                正在自动刷新状态...
              </p>
            )}
          </div>
        )}

        {/* Failed Status */}
        {isFailed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-lg font-medium text-red-900 mb-2">分析失败</p>
            {review.metadata.error_message && (
              <p className="text-sm text-red-700 mb-4">
                错误信息：{review.metadata.error_message}
              </p>
            )}
            <Button
              variant="outline"
              onClick={retryAnalysis}
              disabled={retrying}
            >
              {retrying ? (
                <>
                  <FiRefreshCw className="mr-2 animate-spin" />
                  重试中...
                </>
              ) : (
                <>
                  <FiRefreshCw className="mr-2" />
                  重新分析
                </>
              )}
            </Button>
          </div>
        )}

        {/* Analysis Result */}
        {isCompleted && (
          <AnalysisMarkdownRenderer content={review.data} />
        )}

        {/* ASR Result */}
        {review.metadata.asr_result && (
          <ASRResultViewer asrResult={review.metadata.asr_result} defaultCollapsed={true} />
        )}

        {/* Retry Button for Completed */}
        {isCompleted && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={retryAnalysis}
              disabled={retrying}
            >
              <FiRefreshCw className="mr-2" />
              重新分析
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {isViewMode ? renderViewMode() : renderCreationMode()}
    </div>
  );
};

export default InterviewReviewDetail;

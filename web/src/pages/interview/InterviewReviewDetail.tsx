/**
 * Interview Review Detail Page
 * Handles both creation workflow and view/retry modes
 * 
 * Creation Flow (4 steps):
 * 1. Upload audio to TOS → Create review record immediately (status: pending)
 * 2. Start ASR → Poll until complete → User edits and saves as speech
 * 3. Fill info → Enter job position, company name, job description (optional)
 * 4. Trigger AI analysis → Poll until complete → View results
 * 
 * Note: ASR result is fetched from asr_tasks table, not stored in metadata.
 * The speech field in metadata stores the edited/confirmed transcript.
 * 
 * State Recovery:
 * - Page refresh with ?id=xxx will resume from the appropriate step
 * - pending (no speech): Show "Start ASR" button (step 2)
 * - pending (with speech): Show info form (step 3)
 * - transcribing: Resume ASR polling (step 2)
 * - analyzing: Show progress (step 4)
 * - completed: Show results (step 4)
 * - failed: Show retry options
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiUpload, FiRefreshCw, FiArrowLeft, FiArrowRight, FiSettings } from 'react-icons/fi';
import { Button, Modal, Input } from '@/components/ui';
import { StepIndicator } from '@/components/interview/StepIndicator';
import { ReviewStatusBadge } from '@/components/interview/ReviewStatusBadge';
import { ASRResultViewer } from '@/components/interview/ASRResultViewer';
import { AnalysisMarkdownRenderer } from '@/components/interview/AnalysisMarkdownRenderer';
import { interviewAPI } from '@/api/interview';
import { tosAPI } from '@/api/tos';
import { asrAPI } from '@/api/asr';
import { showError, showSuccess, showInfo } from '@/utils/toast';
import type { InterviewReview, WorkflowStep } from '@/types/interview';
import type { ASRTask } from '@/api/asr';

const WORKFLOW_STEPS: WorkflowStep[] = [
  { key: 'upload', label: '上传音频' },
  { key: 'asr', label: '音频识别' },
  { key: 'info', label: '信息填写' },
  { key: 'analyze', label: 'AI分析' },
];

// Polling interval in milliseconds
const ASR_POLL_INTERVAL = 3000;
const ASR_MAX_ATTEMPTS = 60; // 3 minutes max

export const InterviewReviewDetail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reviewId = searchParams.get('id');

  // Determine if we're in view mode (with existing review) or creation mode
  const isViewMode = !!reviewId;

  // Core state
  const [review, setReview] = useState<InterviewReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step-specific state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioKey, setAudioKey] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  
  const [asrProcessing, setAsrProcessing] = useState(false);
  const [asrTask, setAsrTask] = useState<ASRTask | null>(null);
  const [localAsrResult, setLocalAsrResult] = useState<any>(null); // 前端直接获取的ASR结果
  const [editedSpeechText, setEditedSpeechText] = useState<string>(''); // 编辑中的语音文本
  const [savingSpeech, setSavingSpeech] = useState(false);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Configuration modal state
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState({
    job_position: '',
    target_company: '',
    job_description: '',
  });
  const [savingConfig, setSavingConfig] = useState(false);

  /**
   * Format utterances with line numbers and blank lines between them
   */
  const formatUtterancesWithNumbers = (utterances: any[]) => {
    return utterances
      .map((u: any, idx: number) => `${idx + 1}. ${u.text}`)
      .join('\n\n');
  };

  /**
   * Get original ASR text from result (utterances joined or saved speech)
   * Note: asr_result is now fetched from asr_tasks table, not stored in metadata
   */
  const getOriginalSpeechText = useCallback(() => {
    // 优先使用已保存的 speech（字符串），否则从 ASR 结果提取
    if (review?.metadata.speech && typeof review.metadata.speech === 'string') {
      return review.metadata.speech;
    }
    // ASR结果只存在于localAsrResult中（从asr_tasks表获取）
    if (localAsrResult?.result?.utterances) {
      return formatUtterancesWithNumbers(localAsrResult.result.utterances);
    }
    if (localAsrResult?.result?.text) {
      return localAsrResult.result.text;
    }
    return '';
  }, [localAsrResult, review?.metadata.speech]);

  /**
   * Initialize edited speech text when ASR result becomes available
   * Note: ASR result is now only in localAsrResult (fetched from asr_tasks table)
   */
  useEffect(() => {
    // 有本地ASR结果或已保存的speech时，初始化编辑文本
    if ((localAsrResult || review?.metadata.speech) && !editedSpeechText) {
      setEditedSpeechText(getOriginalSpeechText());
    }
  }, [localAsrResult, review?.metadata.speech, editedSpeechText, getOriginalSpeechText]);

  /**
   * Load review from API
   * Note: Does NOT auto-resume polling to avoid high-frequency errors
   * Note: ASR result is no longer stored in metadata, must fetch from asr_tasks table
   */
  const loadReview = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const data = await interviewAPI.getReview(id);
      setReview(data);
      
      // Determine current step based on metadata
      // Note: use speech field instead of asr_result to determine if ASR step is complete
      const status = data.metadata.status;
      const hasSpeech = !!data.metadata.speech;
      
      if (status === 'pending' && !hasSpeech) {
        setCurrentStep(2); // Ready for ASR
      } else if (status === 'pending' && hasSpeech) {
        setCurrentStep(3); // Ready for info filling
      } else if (status === 'transcribing') {
        setCurrentStep(2);
        // Don't auto-resume polling - user can manually click to poll
      } else if (status === 'analyzing') {
        setCurrentStep(4); // Analysis step
        // Don't auto-resume polling - user can manually refresh
      } else if (status === 'completed') {
        setCurrentStep(4); // Analysis step
      } else if (status === 'failed' || status === 'timeout') {
        // Determine which step failed: if speech exists, analysis failed; otherwise ASR failed
        if (hasSpeech) {
          setCurrentStep(4); // Analysis step
        } else {
          setCurrentStep(2);
        }
      }
      
      // Update audio file info if available
      if (data.metadata.audio_filename) {
        setAudioFile({ name: data.metadata.audio_filename } as File);
      }
      if (data.metadata.tos_file_key) {
        setAudioKey(data.metadata.tos_file_key);
      }
      
      // If on ASR step and ASR task completed, fetch the result from asr_tasks table
      if (data.metadata.asr_task_id && !hasSpeech && status !== 'transcribing') {
        try {
          const taskResponse = await asrAPI.getTask(data.metadata.asr_task_id);
          if (taskResponse.code === 0 && taskResponse.data.status === 'completed' && taskResponse.data.result) {
            const parsedResult = JSON.parse(taskResponse.data.result);
            setLocalAsrResult(parsedResult);
            setAsrTask(taskResponse.data);
          }
        } catch (e) {
          console.error('Failed to fetch ASR task result:', e);
        }
      }
    } catch (error) {
      showError('加载面试复盘失败');
      console.error('Failed to load review:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load review on mount if in view mode
  useEffect(() => {
    if (isViewMode && reviewId) {
      loadReview(parseInt(reviewId));
    }
  }, [reviewId, isViewMode, loadReview]);

  // Initialize config form when review is loaded
  useEffect(() => {
    if (review) {
      setConfigForm({
        job_position: review.metadata.job_position || '',
        target_company: review.metadata.target_company || '',
        job_description: review.metadata.job_description || '',
      });
    }
  }, [review?.id]);

  /**
   * Handle audio file selection and upload
   * After upload, immediately create review record
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
      setAudioFile(file);
      setAudioKey(upload.key);
      
      showSuccess('音频上传成功');

      // Immediately create review record
      const createdReview = await interviewAPI.createReview({
        tos_file_key: upload.key,
        audio_filename: file.name,
      });

      setReview(createdReview);
      
      // Update URL to include review ID (for state recovery)
      navigate(`/interview/reviews?id=${createdReview.id}`, { replace: true });
      
      showInfo('已创建复盘记录');
      
      // Move to ASR step
      setCurrentStep(2);
    } catch (error) {
      showError(error instanceof Error ? error.message : '音频上传失败');
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Start ASR processing using the backend StartASR endpoint
   */
  const startAsrProcessing = async () => {
    if (!review) {
      showError('请先上传音频文件');
      return;
    }

    setAsrProcessing(true);
    try {
      // Call backend to start ASR (backend generates URL and submits task)
      const updatedReview = await interviewAPI.startASR(review.id);
      setReview(updatedReview);
      
      showInfo('语音识别任务已提交，等待处理...');

      // Wait 3 seconds before starting to poll (ASR service needs initialization time)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Start polling for ASR completion using the same logic as ASRTest
      if (updatedReview.metadata.asr_task_id) {
        const completedTask = await asrAPI.pollUntilComplete(
          updatedReview.metadata.asr_task_id,
          (task) => {
            setAsrTask(task);
          },
          ASR_MAX_ATTEMPTS,
          ASR_POLL_INTERVAL
        );

        if (completedTask.status === 'completed') {
          // Parse ASR result directly from task (前端直接解析，不走后端同步)
          if (completedTask.result) {
            try {
              const parsedResult = JSON.parse(completedTask.result);
              setLocalAsrResult(parsedResult);
              setAsrTask(completedTask);
              showSuccess('语音识别完成，请确认识别结果');
              // Stay on step 2 to show the result, don't auto-advance
            } catch (e) {
              console.error('Failed to parse ASR result:', e);
              showError('解析识别结果失败');
            }
          } else {
            showError('无法获取识别结果');
          }
        } else if (completedTask.status === 'failed') {
          showError(completedTask.error_message || '语音识别失败');
        }
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '启动语音识别失败');
      console.error('Start ASR failed:', error);
      // Reload review to get latest state
      if (review) {
        await loadReview(review.id);
      }
    } finally {
      setAsrProcessing(false);
    }
  };

  /**
   * Retry ASR for failed attempts
   */
  const handleRetryASR = async () => {
    if (!review) return;

    setRetrying(true);
    setAsrProcessing(true);
    setLocalAsrResult(null); // 清除之前的结果
    try {
      // Call backend retry endpoint (generates new URL and new task)
      const updatedReview = await interviewAPI.retryASR(review.id);
      setReview(updatedReview);
      
      showInfo('已重新提交语音识别任务，等待处理...');

      // Wait 3 seconds before starting to poll (ASR service needs initialization time)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Start polling using the same logic as ASRTest
      if (updatedReview.metadata.asr_task_id) {
        const completedTask = await asrAPI.pollUntilComplete(
          updatedReview.metadata.asr_task_id,
          (task) => {
            setAsrTask(task);
          },
          ASR_MAX_ATTEMPTS,
          ASR_POLL_INTERVAL
        );

        if (completedTask.status === 'completed') {
          // Parse ASR result directly from task
          if (completedTask.result) {
            try {
              const parsedResult = JSON.parse(completedTask.result);
              setLocalAsrResult(parsedResult);
              setAsrTask(completedTask);
              showSuccess('语音识别完成，请确认识别结果');
            } catch (e) {
              console.error('Failed to parse ASR result:', e);
              showError('解析识别结果失败');
            }
          } else {
            showError('无法获取识别结果');
          }
        } else if (completedTask.status === 'failed') {
          showError(completedTask.error_message || '语音识别失败');
        }
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '重试语音识别失败');
      if (review) {
        await loadReview(review.id);
      }
    } finally {
      setRetrying(false);
      setAsrProcessing(false);
    }
  };

  /**
   * Start analysis (job info should already be saved in step 3)
   */
  const handleStartAnalysis = async () => {
    if (!review) {
      showError('请先完成语音识别');
      return;
    }

    setAnalyzing(true);
    try {
      // Trigger analysis
      await interviewAPI.triggerAnalysis(review.id);
      showSuccess('分析任务已提交，请稍候...');
      
      // Start polling for completion
      await startAnalysisPolling(review.id);
    } catch (error) {
      showError(error instanceof Error ? error.message : '启动分析失败');
      await loadReview(review.id);
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Poll for analysis completion
   */
  const startAnalysisPolling = async (reviewId: number) => {
    const maxAttempts = 60; // 5 minutes with 5s interval
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const updatedReview = await interviewAPI.getReview(reviewId);
        setReview(updatedReview);

        if (updatedReview.metadata.status === 'completed') {
          showSuccess('分析完成！');
          return;
        }

        if (updatedReview.metadata.status === 'failed') {
          showError(updatedReview.metadata.error_message || '分析失败');
          return;
        }

        // Still analyzing, wait and retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error('Polling error:', error);
        attempts++;
      }
    }
  };

  /**
   * Retry analysis for failed attempts
   */
  const retryAnalysis = async () => {
    if (!review) return;

    if (review.metadata.status === 'transcribing' || review.metadata.status === 'analyzing') {
      showInfo('任务正在进行中，请稍候');
      return;
    }

    setRetrying(true);
    try {
      await interviewAPI.triggerAnalysis(review.id);
      showSuccess('已重新提交分析任务');
      await startAnalysisPolling(review.id);
    } catch (error) {
      showError(error instanceof Error ? error.message : '重新分析失败');
      await loadReview(review.id);
    } finally {
      setRetrying(false);
    }
  };

  /**
   * Open configuration modal with current values
   */
  const openConfigModal = () => {
    if (review) {
      setConfigForm({
        job_position: review.metadata.job_position || '',
        target_company: review.metadata.target_company || '',
        job_description: review.metadata.job_description || '',
      });
    }
    setConfigModalOpen(true);
  };

  /**
   * Save configuration (job position, target company, and job description)
   */
  const saveConfig = async () => {
    if (!review) return;

    setSavingConfig(true);
    try {
      const updatedReview = await interviewAPI.updateReviewMetadata(review.id, {
        metadata: {
          job_position: configForm.job_position,
          target_company: configForm.target_company,
          job_description: configForm.job_description,
        },
      });
      setReview(updatedReview);
      showSuccess('保存成功');
      setConfigModalOpen(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSavingConfig(false);
    }
  };

  /**
   * Save info step and proceed to analysis step
   */
  const saveInfoAndProceed = async () => {
    if (!review) return;

    setSavingConfig(true);
    try {
      const updatedReview = await interviewAPI.updateReviewMetadata(review.id, {
        metadata: {
          job_position: configForm.job_position,
          target_company: configForm.target_company,
          job_description: configForm.job_description,
        },
      });
      setReview(updatedReview);
      showSuccess('信息已保存');
      setCurrentStep(4);
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSavingConfig(false);
    }
  };

  /**
   * Save speech text
   */
  const saveSpeech = async (speech: string) => {
    if (!review) return;

    try {
      const updatedReview = await interviewAPI.updateReviewMetadata(review.id, {
        metadata: {
          speech: speech,
        },
      });
      setReview(updatedReview);
      // showSuccess('语音文本已保存');
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存失败');
      throw error;
    }
  };

  /**
   * Save speech text and proceed to next step
   */
  const saveSpeechAndProceed = async () => {
    if (!review) return;
    
    setSavingSpeech(true);
    try {
      // 直接保存为字符串
      const updatedReview = await interviewAPI.updateReviewMetadata(review.id, {
        metadata: {
          speech: editedSpeechText,
        },
      });
      setReview(updatedReview);
      // showSuccess('语音文本已保存');
      setCurrentStep(3);
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSavingSpeech(false);
    }
  };

  /**
   * Reset speech text to original ASR result
   * Fetches ASR result from asr_tasks table using asr_task_id
   */
  const resetSpeechText = async () => {
    // 优先使用已有的 localAsrResult
    if (localAsrResult?.result?.utterances) {
      setEditedSpeechText(formatUtterancesWithNumbers(localAsrResult.result.utterances));
      return;
    }
    if (localAsrResult?.result?.text) {
      setEditedSpeechText(localAsrResult.result.text);
      return;
    }

    // 如果没有 localAsrResult，从 asr_tasks 表获取
    const asrTaskId = review?.metadata.asr_task_id;
    if (!asrTaskId) {
      showError('无法获取ASR任务ID');
      return;
    }

    try {
      const response = await asrAPI.getTask(asrTaskId);
      if (response.code === 0 && response.data.status === 'completed' && response.data.result) {
        const parsedResult = JSON.parse(response.data.result);
        setLocalAsrResult(parsedResult);
        // 重置为原始 ASR 结果（带序号和空行）
        if (parsedResult?.result?.utterances) {
          setEditedSpeechText(formatUtterancesWithNumbers(parsedResult.result.utterances));
        } else if (parsedResult?.result?.text) {
          setEditedSpeechText(parsedResult.result.text);
        }
      } else {
        showError('获取ASR结果失败');
      }
    } catch (e) {
      console.error('Failed to fetch ASR task result:', e);
      showError('获取ASR结果失败');
    }
  };

  /**
   * Compute which steps are completed
   * Note: ASR step completion is determined by speech field, not asr_result
   */
  const getCompletedSteps = (): string[] => {
    const completed: string[] = [];
    
    // Upload is complete if we have a review with tos_file_key
    if (review?.metadata.tos_file_key || audioKey) {
      completed.push('upload');
    }
    
    // ASR is complete if we have speech saved (edited ASR text)
    if (review?.metadata.speech) {
      completed.push('asr');
    }
    
    // Info step is complete if we have job info filled or if analysis has started/completed
    const hasJobInfo = review?.metadata.job_position || review?.metadata.target_company || review?.metadata.job_description;
    const analysisStarted = review?.metadata.status === 'analyzing' || review?.metadata.status === 'completed';
    if (hasJobInfo || analysisStarted) {
      completed.push('info');
    }
    
    // Analysis is complete if status is completed
    if (review?.metadata.status === 'completed') {
      completed.push('analyze');
    }
    
    return completed;
  };

  /**
   * Render Step 1: Upload Audio
   */
  const renderUploadStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">上传面试录音</h2>
        {/* <p className="text-gray-600">
          支持 MP3、WAV、OGG 格式，文件大小不超过 100MB
        </p> */}
      </div>

      {audioFile ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">已选择文件</p>
              <p className="text-sm text-green-700">{audioFile.name}</p>
              {audioFile.size && (
                <p className="text-xs text-green-600">
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
            {!review && (
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
            )}
          </div>
        </div>
      ) : (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
            <FiUpload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">点击选择文件或拖拽文件到此处</p>
            <p className="text-sm text-gray-500">支持 MP3、WAV、OGG 格式，文件大小不超过 100MB</p>
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
          <p>正在上传并创建记录...</p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          onClick={() => setCurrentStep(2)}
          disabled={!review || uploading}
          variant="primary"
        >
          下一步
          <FiArrowRight className="ml-2" />
        </Button>
      </div>
    </div>
  );

  /**
   * Resume polling for transcribing status (manual trigger)
   */
  const resumeAsrPolling = async () => {
    if (!review || !review.metadata.asr_task_id) {
      showError('无法获取任务信息');
      return;
    }

    setAsrProcessing(true);
    try {
      const completedTask = await asrAPI.pollUntilComplete(
        review.metadata.asr_task_id,
        (task) => {
          setAsrTask(task);
        },
        ASR_MAX_ATTEMPTS,
        ASR_POLL_INTERVAL
      );

      if (completedTask.status === 'completed') {
        // Parse ASR result directly from task
        if (completedTask.result) {
          try {
            const parsedResult = JSON.parse(completedTask.result);
            setLocalAsrResult(parsedResult);
            setAsrTask(completedTask);
            showSuccess('语音识别完成，请确认识别结果');
          } catch (e) {
            console.error('Failed to parse ASR result:', e);
            showError('解析识别结果失败');
          }
        } else {
          showError('无法获取识别结果');
        }
      } else if (completedTask.status === 'failed') {
        showError(completedTask.error_message || '语音识别失败');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '轮询失败');
      if (review) {
        await loadReview(review.id);
      }
    } finally {
      setAsrProcessing(false);
    }
  };

  /**
   * Render Step 2: ASR Processing
   * Note: ASR result is now only in localAsrResult (fetched from asr_tasks table, not stored in metadata)
   */
  const renderAsrStep = () => {
    // ASR结果只存在于localAsrResult中（从asr_tasks表获取），或用户已保存speech
    const hasAsrResult = !!localAsrResult || !!review?.metadata.speech;
    const isFailed = review?.metadata.status === 'failed' && !localAsrResult && !review?.metadata.speech;
    const isTimeout = review?.metadata.status === 'timeout';
    const isTranscribing = review?.metadata.status === 'transcribing' && !localAsrResult;

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">语音识别</h2>
          <div className="flex justify-between">
            <span className="text-gray-600 ">将音频转换为文字，确认识别结果后进入下一步</span>
            {hasAsrResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetSpeechText}
              >
                <FiRefreshCw className="mr-1 w-4 h-4" />
                重置
              </Button>
            )}
          </div>
        </div>

        {/* ASR Processing State */}
        {asrProcessing ? (
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
        ) : hasAsrResult ? (
          // 有识别结果 - 显示可编辑的文本框
          <div className="space-y-4">         
            {/* 可编辑的文本框 */}
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <textarea
                value={editedSpeechText}
                onChange={(e) => setEditedSpeechText(e.target.value)}
                placeholder="识别结果将显示在这里..."
                rows={15}
                className="w-full px-4 py-3 text-sm text-gray-800 leading-relaxed resize-none focus:outline-none"
                style={{ minHeight: '300px', maxHeight: '500px' }}
              />
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                {editedSpeechText.length} 字 · {editedSpeechText.split('\n').filter(l => l.trim()).length} 行
              </div>
            </div>
          </div>
        ) : isTranscribing ? (
          // Transcribing but not actively polling - show resume button
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-lg font-medium text-yellow-900 mb-2">识别任务进行中</p>
            <p className="text-sm text-yellow-700 mb-4">
              任务ID: {review?.metadata.asr_task_id?.substring(0, 8)}...
            </p>
            <Button onClick={resumeAsrPolling} disabled={asrProcessing}>
              <FiRefreshCw className="mr-2" />
              继续轮询
            </Button>
          </div>
        ) : isFailed || isTimeout ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-lg font-medium text-red-900 mb-2">
              {isTimeout ? '语音识别超时' : '语音识别失败'}
            </p>
            {review?.metadata.error_message && (
              <p className="text-sm text-red-700 mb-4">
                错误信息：{review.metadata.error_message}
              </p>
            )}
            <Button
              variant="outline"
              onClick={handleRetryASR}
              disabled={retrying || asrProcessing}
            >
              {retrying || asrProcessing ? (
                <>
                  <FiRefreshCw className="mr-2 animate-spin" />
                  重试中...
                </>
              ) : (
                <>
                  <FiRefreshCw className="mr-2" />
                  重试语音识别
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">点击下方按钮开始语音识别</p>
            <Button onClick={startAsrProcessing} disabled={asrProcessing || !review} variant="primary">
              <FiRefreshCw className="mr-2" />
              开始识别
            </Button>
          </div>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(1)}
            disabled={asrProcessing || savingSpeech}
          >
            <FiArrowLeft className="mr-2" />
            上一步
          </Button>
          <Button
            onClick={saveSpeechAndProceed}
            disabled={!hasAsrResult || asrProcessing || savingSpeech || !editedSpeechText.trim()}
            variant="primary"
          >
            {savingSpeech ? (
              <>
                <FiRefreshCw className="mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                下一步
                <FiArrowRight className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Render Step 3: Info Filling
   */
  const renderInfoStep = () => {
    // const asrResult = localAsrResult || review?.metadata.asr_result;
    // const hasAsrResult = !!asrResult;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">填写面试信息</h2>
          <p className="text-gray-600">
            填写面试相关信息，AI将根据这些信息提供更精准的分析建议
          </p>
        </div>

        <div className="p-3 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              职位名称
            </label>
            <Input
              value={configForm.job_position}
              onChange={(e) => setConfigForm(prev => ({ ...prev, job_position: e.target.value }))}
              placeholder="例如：前端工程师、产品经理"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公司名称
            </label>
            <Input
              value={configForm.target_company}
              onChange={(e) => setConfigForm(prev => ({ ...prev, target_company: e.target.value }))}
              placeholder="例如：字节跳动、阿里巴巴（如敏感可使用指代性称呼）"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              职位描述
            </label>
            <textarea
              value={configForm.job_description}
              onChange={(e) => setConfigForm(prev => ({ ...prev, job_description: e.target.value }))}
              placeholder="请粘贴职位JD或简要描述岗位要求..."
              maxLength={2000}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {configForm.job_description.length}/2000 字
            </p>
          </div>
          <p className="text-xs text-gray-500">
            如果公司信息敏感，可使用指代性称呼（如"某互联网大厂"、"某金融公司"）
          </p>
        </div>


        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(2)}
          >
            <FiArrowLeft className="mr-2" />
            上一步
          </Button>
          <Button
            onClick={saveInfoAndProceed}
            disabled={savingConfig}
            variant="primary"
          >
            {savingConfig ? (
              <>
                <FiRefreshCw className="mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                下一步
                <FiArrowRight className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Render Step 4: Analysis
   * Note: For step 4, only need to check if speech field exists (not asr_result)
   */
  const renderAnalyzeStep = () => {
    const isCompleted = review?.metadata.status === 'completed';
    const isAnalyzing = review?.metadata.status === 'analyzing';
    // 第四步失败判断：状态为failed且有speech（说明是分析阶段失败）
    const isFailed = review?.metadata.status === 'failed' && !!review?.metadata.speech;
    // 第四步只需要检查是否有speech字段
    const hasSpeech = !!review?.metadata.speech;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 面试分析</h2>
          <p className="text-gray-600">
            基于语音识别结果和填写的面试信息，生成面试表现分析报告
          </p>
        </div>

        {isCompleted ? (
          <>
            <AnalysisMarkdownRenderer content={review?.data || {}} />
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
          </>
        ) : isAnalyzing || analyzing ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <FiRefreshCw className="w-12 h-12 mx-auto animate-spin text-blue-500 mb-4" />
            <p className="text-lg font-medium text-blue-900 mb-2">AI分析中...</p>
            <p className="text-sm text-blue-700">
              这可能需要几分钟时间，请稍候
            </p>
          </div>
        ) : isFailed ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-lg font-medium text-red-900 mb-2">分析失败</p>
            {review?.metadata.error_message && (
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
        ) : (
          <div className="">
            {/* Show job info summary */}
            {(review?.metadata.job_position || review?.metadata.target_company || review?.metadata.job_description) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
                <h3 className="text-base font-medium text-gray-900 mb-3">
                  面试信息
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {review?.metadata.job_position && (
                    <div>
                      <span className="text-gray-500">职位名称：</span>
                      <span className="text-gray-900">{review.metadata.job_position}</span>
                    </div>
                  )}
                  {review?.metadata.target_company && (
                    <div>
                      <span className="text-gray-500">公司名称：</span>
                      <span className="text-gray-900">{review.metadata.target_company}</span>
                    </div>
                  )}
                </div>
                {review?.metadata.job_description && (
                  <div className="mt-3 text-sm">
                    <span className="text-gray-500">职位描述：</span>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{review.metadata.job_description}</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="text-center">
              <Button onClick={handleStartAnalysis} disabled={analyzing || !hasSpeech} variant="primary">
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
          </div>
        )}

        {/* ASR Result Viewer - only show if we have localAsrResult (from asr_tasks table) */}
        {localAsrResult && !isCompleted && (
          <ASRResultViewer
            asrResult={localAsrResult}
            defaultCollapsed={false}
            initialSpeech={review?.metadata.speech}
            onSave={saveSpeech}
            editable={true}
          />
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(3)}
            disabled={isAnalyzing || analyzing}
          >
            <FiArrowLeft className="mr-2" />
            上一步
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto mt-12">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {review ? '面试复盘' : '新建面试复盘'}
              </h1>
              {review && <ReviewStatusBadge status={review.metadata.status} />}
            </div>
            {review && (
            <div className="text-xs flex gap-2">
              <div>
                {new Date(review.created_at).toLocaleString('zh-CN')}
              </div>
              <div>
                <span className="text-gray-500">公司：</span>
                <span className="text-gray-900">
                  {review.metadata.target_company || '未填写'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">岗位：</span>
                <span className="text-gray-900">
                  {review.metadata.job_position || '未填写'}
                </span>
              </div>
            </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/interview')}>
              <FiArrowLeft className="mr-2" />
              返回列表
            </Button>
            {review && (
              <Button variant="outline" onClick={openConfigModal}>
                <FiSettings />
              </Button>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator
          steps={WORKFLOW_STEPS}
          currentStep={currentStep}
          completedSteps={getCompletedSteps()}
          onStepClick={setCurrentStep}
          canNavigateBack={!asrProcessing && !analyzing}
        />

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg py-6 px-8">
          {currentStep === 1 && renderUploadStep()}
          {currentStep === 2 && renderAsrStep()}
          {currentStep === 3 && renderInfoStep()}
          {currentStep === 4 && renderAnalyzeStep()}
        </div>
      </div>

      {/* Configuration Modal */}
      <Modal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        title="面试信息配置"
        size="md"
        onConfirm={saveConfig}
        confirmText="保存"
        cancelText="取消"
        confirmDisabled={savingConfig}
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              职位名称
            </label>
            <Input
              value={configForm.job_position}
              onChange={(e) => setConfigForm(prev => ({ ...prev, job_position: e.target.value }))}
              placeholder="例如：前端工程师、产品经理"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公司名称
            </label>
            <Input
              value={configForm.target_company}
              onChange={(e) => setConfigForm(prev => ({ ...prev, target_company: e.target.value }))}
              placeholder="例如：字节跳动、阿里巴巴（如敏感可使用指代性称呼）"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              职位描述
            </label>
            <textarea
              value={configForm.job_description}
              onChange={(e) => setConfigForm(prev => ({ ...prev, job_description: e.target.value }))}
              placeholder="请粘贴职位JD或简要描述岗位要求..."
              maxLength={2000}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {configForm.job_description.length}/2000 字
            </p>
          </div>
          <p className="text-xs text-gray-500">
            填写面试相关信息，AI将根据这些信息提供更精准的分析建议。如果公司信息敏感，可使用指代性称呼。
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default InterviewReviewDetail;

import apiClient from './client';
import type { ApiResponse } from '@/types/global';

// ASR相关类型定义
export interface ASRTask {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  audio_url: string;
  audio_format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error_message?: string;
  result?: string; // JSON string
  options?: string; // JSON string
}

export interface ASRResult {
  text: string;
  segments?: Array<{
    text: string;
    start_time: number;
    end_time: number;
    speaker?: string;
  }>;
}

export interface SubmitTaskRequest {
  audio_url: string;
  audio_format: 'mp3' | 'wav' | 'ogg' | 'raw';
  options?: {
    enable_itn?: boolean; // 智能数字转换
    enable_ddc?: boolean; // 语气词删除
    enable_speaker_diarization?: boolean; // 说话人分离
    [key: string]: any;
  };
}

export interface TaskListResponse {
  total: number;
  page: number;
  per_page: number;
  items: ASRTask[];
}

export const asrAPI = {
  // 提交识别任务
  submitTask: (data: SubmitTaskRequest): Promise<ApiResponse<ASRTask>> => {
    return apiClient.post('/api/asr/tasks', data);
  },

  // 查询任务详情
  getTask: (taskId: string): Promise<ApiResponse<ASRTask>> => {
    return apiClient.get(`/api/asr/tasks/${taskId}`);
  },

  // 轮询任务结果
  pollTask: (taskId: string): Promise<ApiResponse<ASRTask>> => {
    return apiClient.post(`/api/asr/tasks/${taskId}/poll`);
  },

  // 获取任务列表
  listTasks: (params: {
    page?: number;
    page_size?: number;
  } = {}): Promise<ApiResponse<TaskListResponse>> => {
    return apiClient.get('/api/asr/tasks', { params });
  },

  // 删除任务
  deleteTask: (taskId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/asr/tasks/${taskId}`);
  },

  // 重试任务
  retryTask: (taskId: string): Promise<ApiResponse<ASRTask>> => {
    return apiClient.post(`/api/asr/tasks/${taskId}/retry`);
  },

  // 解析识别结果
  parseResult: (task: ASRTask): ASRResult | null => {
    if (!task.result) return null;
    try {
      const parsed = JSON.parse(task.result);
      
      // 火山引擎 ASR 响应格式：{ result: { text: "...", utterances: [...] }, audio_info: {...} }
      // 需要提取嵌套的 result 对象
      const volcResult = parsed.result;
      if (!volcResult) return null;

      // 转换 utterances 为 segments 格式
      const segments = volcResult.utterances?.map((utterance: any) => ({
        text: utterance.text || '',
        start_time: utterance.start_time / 1000, // 转换为秒
        end_time: utterance.end_time / 1000, // 转换为秒
        speaker: utterance.speaker,
      }));

      return {
        text: volcResult.text || '',
        segments,
      };
    } catch (error) {
      console.error('Failed to parse ASR result:', error);
      return null;
    }
  },

  // 轮询直到任务完成或失败
  pollUntilComplete: async (
    taskId: string,
    onProgress?: (task: ASRTask) => void,
    maxAttempts = 60,
    intervalMs = 3000
  ): Promise<ASRTask> => {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await asrAPI.pollTask(taskId);

      if (response.code !== 0) {
        throw new Error(response.msg || '查询任务失败');
      }

      const task = response.data;

      if (onProgress) {
        onProgress(task);
      }

      if (task.status === 'completed' || task.status === 'failed') {
        return task;
      }

      // 等待一段时间后再次轮询
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      attempts++;
    }

    throw new Error('轮询超时');
  },
};

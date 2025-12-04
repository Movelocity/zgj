import apiClient from './client';
import type { 
  ResumeDetail, 
  ResumeUploadData, 
  ResumeUploadResponse,
  ResumeListResponse,
  ResumeUpdateRequest,
  ResumeUpdateResponse,
  ResumeOptimizationRequest,
  CreateTextResumeData
} from '@/types/resume';
import type { ApiResponse, PaginationParams } from '@/types/global';

export const resumeAPI = {
  // 获取简历列表
  getResumes: (params?: PaginationParams): Promise<ApiResponse<ResumeListResponse>> => {
    return apiClient.get('/api/user/resumes', { params });
  },

  // 上传简历 - 使用新的简历专用接口
  uploadResume: (data: ResumeUploadData): Promise<ApiResponse<ResumeUploadResponse>> => {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.name) {
      formData.append('name', data.name);
    }
    return apiClient.post('/api/user/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 创建纯文本简历
  createTextResume: (data: CreateTextResumeData): Promise<ApiResponse<ResumeUploadResponse>> => {
    return apiClient.post('/api/user/resumes/create_text', data);
  },

  // 获取简历详情
  getResume: (id: string): Promise<ApiResponse<ResumeDetail>> => {
    return apiClient.get(`/api/user/resumes/${id}`);
  },

  // 删除简历
  deleteResume: (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/user/resumes/${id}`);
  },

  // 更新简历信息
  // 支持 new_version 参数创建新版本
  updateResume: (id: string, data: ResumeUpdateRequest): Promise<ApiResponse<ResumeUpdateResponse>> => {
    return apiClient.put(`/api/user/resumes/${id}`, data);
  },

  // 简历优化
  optimizeResume: (data: ResumeOptimizationRequest): Promise<ApiResponse<any>> => {
    return apiClient.post('/api/resume/optimize', data);
  },

  // 获取简历内容
  getResumeContent: (id: string): Promise<ApiResponse<{ content: string }>> => {
    return apiClient.get(`/api/resume/${id}/content`);
  },

  // 更新简历内容
  updateResumeContent: (id: string, content: string): Promise<ApiResponse> => {
    return apiClient.put(`/api/resume/${id}/content`, { content });
  },

  // 简历文件转文本
  resumeFileToText: (id: string): Promise<ApiResponse> => {
    return apiClient.post(`/api/user/resumes/file_to_text/${id}`);
  },

  // 简历文本转JSON
  structureTextToJSON: (id: string, v1?: boolean): Promise<ApiResponse> => {
    if (v1) {
      return apiClient.post(`/api/user/resumes/structure_data/${id}`);
    }
    return apiClient.post(`/api/user/resumes/structure_data/v2/${id}`);
  },

  // 保存待处理内容（AI生成内容未接收时临时保存）
  savePendingContent: (id: string, pendingContent: any): Promise<ApiResponse> => {
    return apiClient.post(`/api/user/resumes/${id}/pending`, { pending_content: pendingContent });
  },

  // 清除待处理内容（用户接收后清除）
  clearPendingContent: (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/user/resumes/${id}/pending`);
  },
};

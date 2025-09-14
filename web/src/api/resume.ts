import apiClient from './client';
import type { Resume, ResumeUploadData, ResumeOptimizationRequest } from '@/types/resume';
import type { ApiResponse, PaginationParams, PaginationResponse } from '@/types/global';

export const resumeAPI = {
  // 获取简历列表
  getResumes: (params?: PaginationParams): Promise<ApiResponse<PaginationResponse<Resume>>> => {
    return apiClient.get('/api/resume/list', { params });
  },

  // 上传简历
  uploadResume: (data: ResumeUploadData): Promise<ApiResponse<Resume>> => {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.name) {
      formData.append('name', data.name);
    }
    return apiClient.post('/api/file/upload/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 获取简历详情
  getResume: (id: string): Promise<ApiResponse<Resume>> => {
    return apiClient.get(`/api/resume/${id}`);
  },

  // 删除简历
  deleteResume: (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/resume/${id}`);
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
};

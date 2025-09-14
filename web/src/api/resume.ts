import apiClient from './client';
import type { Resume, ResumeUploadData, ResumeOptimizationRequest } from '@/types/resume';
import type { ApiResponse, PaginationParams, PaginationResponse } from '@/types/global';

export const resumeAPI = {
  // 获取简历列表
  getResumes: (params?: PaginationParams): Promise<ApiResponse<PaginationResponse<Resume>>> => {
    return apiClient.get('/api/user/resumes', { params });
  },

  // 上传简历
  uploadResume: (data: ResumeUploadData): Promise<ApiResponse<Resume>> => {
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

  // 获取简历详情
  getResume: (id: string): Promise<ApiResponse<Resume>> => {
    return apiClient.get(`/api/user/resumes/${id}`);
  },

  // 删除简历
  deleteResume: (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/user/resumes/${id}`);
  },

  // 更新简历信息
  updateResume: (id: string, data: { name: string }): Promise<ApiResponse<Resume>> => {
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
};

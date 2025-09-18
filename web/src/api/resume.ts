import apiClient from './client';
import type { 
  ResumeDetail, 
  ResumeUploadData, 
  ResumeUploadResponse,
  ResumeListResponse,
  ResumeUpdateRequest,
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
  updateResume: (id: string, data: ResumeUpdateRequest): Promise<ApiResponse> => {
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

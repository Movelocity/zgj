import apiClient from './client';
import type { User } from '@/types/user';
import type { Workflow } from '@/types/workflow';
import type { ApiResponse, PaginationParams, PaginationResponse } from '@/types/global';

export const adminAPI = {
  // 用户管理
  getUsers: (params?: PaginationParams & { keyword?: string }): Promise<ApiResponse<PaginationResponse<User>>> => {
    return apiClient.get('/api/admin/user', { params });
  },

  getUser: (userId: string): Promise<ApiResponse<User>> => {
    return apiClient.get(`/api/admin/user/${userId}`);
  },

  updateUser: (userId: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    return apiClient.put(`/api/admin/user/${userId}`, data);
  },

  deleteUser: (userId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/admin/user/${userId}`);
  },

  activateUser: (userId: string): Promise<ApiResponse> => {
    return apiClient.post(`/api/admin/user/${userId}/activate`);
  },

  deactivateUser: (userId: string): Promise<ApiResponse> => {
    return apiClient.post(`/api/admin/user/${userId}/deactivate`);
  },

  getUserResumes: (userId: string, params?: PaginationParams): Promise<ApiResponse<PaginationResponse<any>>> => {
    return apiClient.get(`/api/admin/user/${userId}/resumes`, { params });
  },

  // 工作流管理
  getAllWorkflows: (): Promise<ApiResponse<Workflow[]>> => {
    return apiClient.get('/api/admin/workflow/all');
  },

  updateWorkflowAsAdmin: (id: string, data: Partial<Workflow>): Promise<ApiResponse<Workflow>> => {
    return apiClient.put(`/api/admin/workflow/${id}`, data);
  },

  // 文件管理
  getFileStats: (): Promise<ApiResponse<{ 
    total_files: number; 
    total_size: number; 
    resume_count: number;
    avatar_count: number;
    storage_usage: string;
  }>> => {
    return apiClient.get('/api/admin/files/stats');
  },

  getFiles: (params?: PaginationParams & { type?: string }): Promise<ApiResponse<PaginationResponse<any>>> => {
    return apiClient.get('/api/admin/files', { params });
  },

  deleteFile: (fileId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/admin/files/${fileId}`);
  },

  batchDeleteFiles: (fileIds: string[]): Promise<ApiResponse> => {
    return apiClient.post('/api/admin/files/batch_delete', { file_ids: fileIds });
  },

  // 系统管理
  getSystemStats: (): Promise<ApiResponse<any>> => {
    return apiClient.get('/api/admin/system/stats');
  },

  getSystemLogs: (params?: PaginationParams): Promise<ApiResponse<PaginationResponse<any>>> => {
    return apiClient.get('/api/admin/system/logs', { params });
  },

  // 数据迁移
  migrateResumeData: (): Promise<ApiResponse> => {
    return apiClient.post('/api/admin/migration/resume');
  },
};

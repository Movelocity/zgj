import apiClient from './client';
import type { User } from '@/types/user';
import type { Workflow } from '@/types/workflow';
import type { ApiResponse, PaginationParams, PaginationResponse } from '@/types/global';

export const adminAPI = {
  // 用户管理
  getUsers: (params?: PaginationParams & { keyword?: string }): Promise<ApiResponse<PaginationResponse<User>>> => {
    return apiClient.get('/api/admin/users', { params });
  },

  createUser: (data: { phone: string; password: string; role?: number }): Promise<ApiResponse<User>> => {
    return apiClient.post('/api/admin/users', data);
  },

  resetUserPassword: (userId: string, newPassword: string): Promise<ApiResponse> => {
    return apiClient.put(`/api/admin/users/${userId}/password`, { password: newPassword });
  },

  // 工作流管理
  getWorkflows: (): Promise<ApiResponse<Workflow[]>> => {
    return apiClient.get('/api/admin/workflows');
  },

  createWorkflow: (data: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Workflow>> => {
    return apiClient.post('/api/admin/workflows', data);
  },

  updateWorkflow: (id: string, data: Partial<Workflow>): Promise<ApiResponse<Workflow>> => {
    return apiClient.put(`/api/admin/workflows/${id}`, data);
  },

  deleteWorkflow: (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/admin/workflows/${id}`);
  },

  // 文件统计
  getFileStats: (): Promise<ApiResponse<{ 
    total_files: number; 
    total_size: number; 
    file_types: Record<string, number> 
  }>> => {
    return apiClient.get('/api/admin/files/stats');
  },

  // 系统信息
  getSystemInfo: (): Promise<ApiResponse<{
    version: string;
    uptime: number;
    memory_usage: number;
    cpu_usage: number;
  }>> => {
    return apiClient.get('/api/system/info');
  },
};

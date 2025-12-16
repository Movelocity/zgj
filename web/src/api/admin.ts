import apiClient from './client';
import type { User } from '@/types/user';
import type { Workflow, CreateWorkflowRequest, UpdateWorkflowRequest } from '@/types/workflow';
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

  getUserResumes: (params?: PaginationParams): Promise<ApiResponse<PaginationResponse<any>>> => {
    return apiClient.get(`/api/admin/user-resumes`, { params });
  },

  // 角色权限管理
  updateUserRole: (userId: string, role: number): Promise<ApiResponse> => {
    return apiClient.put(`/api/admin/user/${userId}/role`, { role });
  },

  // 管理员修改用户密码
  adminChangePassword: (userId: string, newPassword: string): Promise<ApiResponse> => {
    return apiClient.put(`/api/admin/user/${userId}/password`, { new_password: newPassword });
  },

  // 工作流管理
  getAllWorkflows: (): Promise<ApiResponse<Workflow[]>> => {
    return apiClient.get('/api/workflow/all');
  },

  createWorkflow: (data: CreateWorkflowRequest): Promise<ApiResponse<Workflow>> => {
    return apiClient.post('/api/workflow', data);
  },

  updateWorkflow: (id: string, data: UpdateWorkflowRequest): Promise<ApiResponse<Workflow>> => {
    return apiClient.put(`/api/workflow/${id}`, data);
  },

  updateWorkflowAsAdmin: (id: string, data: UpdateWorkflowRequest): Promise<ApiResponse<Workflow>> => {
    return apiClient.put(`/api/workflow/${id}`, data);
  },

  deleteWorkflow: (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/workflow/${id}`);
  },

  // 文件管理
  getFileStats: (): Promise<ApiResponse<{ 
    total_files: number; 
    total_resumes: number;
    total_avatars: number;
    total_size: number; 
    storage_path: string;
    storage_used: number;
  }>> => {
    return apiClient.get('/api/admin/files/stats');
  },

  getFiles: (params?: { page?: number; page_size?: number; type?: string }): Promise<ApiResponse<{ list: any[]; total: number; page: number; page_size: number }>> => {
    return apiClient.get('/api/admin/files', { params });
  },

  deleteFile: (fileId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/admin/files/${fileId}`);
  },

  batchDeleteFiles: (fileIds: string[]): Promise<ApiResponse> => {
    return apiClient.post('/api/admin/files/batch_delete', { file_ids: fileIds });
  },

  // 上传文件（管理员）
  uploadFile: (file: File, userID?: string): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', userID || '1'); // 默认使用管理员ID
    return apiClient.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 系统管理
  getSystemStats: (): Promise<ApiResponse<any>> => {
    return apiClient.get('/api/admin/system/stats');
  },

  getSystemLogs: (params?: PaginationParams): Promise<ApiResponse<PaginationResponse<any>>> => {
    return apiClient.get('/api/admin/system/logs', { params });
  },

  // 获取每日用户增长统计
  getDailyUserGrowth: (params?: { start_date?: string; end_date?: string; days?: number }): Promise<ApiResponse<{
    stats: Array<{ date: string; count: number }>;
    total_users: number;
  }>> => {
    return apiClient.get('/api/admin/system/daily-user-growth', { params });
  },

  // 获取每日工作流使用统计
  getDailyWorkflowUsage: (params?: { start_date?: string; end_date?: string; days?: number; workflow_id?: string }): Promise<ApiResponse<{
    stats: Array<{ date: string; count: number }>;
    total_executions: number;
    success_count: number;
    failed_count: number;
    success_rate: number;
  }>> => {
    return apiClient.get('/api/admin/system/daily-workflow-usage', { params });
  },

  // 数据迁移
  migrateResumeData: (): Promise<ApiResponse> => {
    return apiClient.post('/api/admin/migration/resume');
  },

  // 文件数据迁移
  migrateFileData: (): Promise<ApiResponse> => {
    return apiClient.post('/api/admin/migration/files');
  },

  // 重新整理简历版本
  // 按文件哈希识别相同简历，按时间重新分配版本号
  reorganizeResumeVersions: (): Promise<ApiResponse<{
    processed_users: number;
    processed_resumes: number;
    updated_versions: number;
    errors: string[];
  }>> => {
    return apiClient.post('/api/admin/migration/reorganize-versions');
  },
};

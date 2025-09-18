import apiClient from './client';
import type { ApiResponse } from '@/types/global';
import { API_BASE_URL } from '@/utils/constants';

// 文件相关类型定义
export interface FileInfo {
  id: string;
  name: string;
  original_name: string;
  size: number;
  type: string;
  mime_type: string;
  user_id: string;
  user_name: string;
  created_at: string;
  updated_at: string;
}

export interface FileUploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: string;
}

export interface FileListResponse {
  list: FileInfo[];
  total: number;
  page: number;
  page_size: number;
}

export interface FileStatsResponse {
  total_files: number;
  total_resumes: number;
  total_avatars: number;
  total_size: number;
  storage_path: string;
  storage_used: number;
}

export const fileAPI = {
  // 上传文件 - 通用文件上传接口
  uploadFile: (file: File): Promise<ApiResponse<FileUploadResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 预览/下载文件
  previewFile: (fileId: string, asAttachment = false): string => {
    return `${API_BASE_URL}/api/files/${fileId}/preview${asAttachment ? '?as_attachment=true' : ''}`;
  },

  // 获取文件信息
  getFileInfo: (fileId: string): Promise<ApiResponse<FileInfo>> => {
    return apiClient.get(`/api/files/${fileId}/info`);
  },

  // 获取文件列表（管理员）
  getFileList: (params: {
    page?: number;
    page_size?: number;
    type?: string;
  } = {}): Promise<ApiResponse<FileListResponse>> => {
    return apiClient.get('/api/admin/files', { params });
  },

  // 获取文件统计（管理员）
  getFileStats: (): Promise<ApiResponse<FileStatsResponse>> => {
    return apiClient.get('/api/admin/files/stats');
  },

  // 删除文件（管理员）
  deleteFile: (fileId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/admin/files/${fileId}`);
  },

  // 批量删除文件（管理员）
  batchDeleteFiles: (fileIds: string[]): Promise<ApiResponse> => {
    return apiClient.post('/api/admin/files/batch-delete', { file_ids: fileIds });
  },
};

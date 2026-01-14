import apiClient from './client';
import type { ApiResponse } from '@/types/global';

// TOS相关类型定义
export interface STSCredentials {
  access_key_id: string;
  secret_access_key: string;
  session_token: string;
  expiration: string;
  region: string;
  endpoint: string;
  bucket: string;
}

export interface PresignRequest {
  key: string;
  content_type?: string;
  metadata?: Record<string, string>;
}

export interface PresignResponse {
  url: string;
  key: string;
  expires_in: number;
}

export interface DownloadResponse {
  url: string;
  expires_in: number;
}

export interface TOSUpload {
  id: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  key: string;
  filename: string;
  content_type: string;
  size: number;
  status: string;
  error_message?: string;
  metadata?: string;
}

export interface UploadListResponse {
  total: number;
  page: number;
  per_page: number;
  items: TOSUpload[];
}

export interface UploadCompleteRequest {
  key: string;
  filename: string;
  content_type?: string;
  size?: number;
  metadata?: string;
}

export const tosAPI = {
  // 获取STS临时凭证
  getSTSCredentials: (): Promise<ApiResponse<STSCredentials>> => {
    return apiClient.get('/api/tos/sts');
  },

  // 生成[上传]预签名URL
  generatePresignURL: (data: PresignRequest): Promise<ApiResponse<PresignResponse>> => {
    return apiClient.post('/api/tos/presign', data);
  },

  // 生成[下载]预签名URL
  generateDownloadURL: (key: string): Promise<ApiResponse<DownloadResponse>> => {
    return apiClient.get('/api/tos/presign/download', { params: { key } });
  },

  // 上传完成回调
  recordUploadComplete: (data: UploadCompleteRequest): Promise<ApiResponse<TOSUpload>> => {
    return apiClient.post('/api/tos/uploads/complete', data);
  },

  // 获取上传记录列表
  listUploads: (params: {
    page?: number;
    page_size?: number;
  } = {}): Promise<ApiResponse<UploadListResponse>> => {
    return apiClient.get('/api/tos/uploads', { params });
  },

  // 直接上传文件到TOS（使用预签名URL）
  uploadToTOS: async (file: File, key?: string): Promise<TOSUpload> => {
    // 如果没有提供key，生成一个
    if (!key) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop();
      key = `${timestamp}_${randomStr}.${extension}`;
    }

    // 1. 获取预签名URL
    const presignResponse = await tosAPI.generatePresignURL({
      key,
      content_type: file.type,
    });

    if (presignResponse.code !== 0) {
      throw new Error(presignResponse.msg || '获取预签名URL失败');
    }

    const { url, key: fullKey } = presignResponse.data;

    // 2. 上传文件到TOS
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('上传文件失败');
    }

    // 3. 记录上传完成
    const completeResponse = await tosAPI.recordUploadComplete({
      key: fullKey,
      filename: file.name,
      content_type: file.type,
      size: file.size,
    });

    if (completeResponse.code !== 0) {
      throw new Error(completeResponse.msg || '记录上传失败');
    }

    return completeResponse.data;
  },
};

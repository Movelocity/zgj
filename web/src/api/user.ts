import apiClient from './client';
import type { UserProfile } from '@/types/user';
import type { ApiResponse } from '@/types/global';

export const userAPI = {
  // 获取用户资料
  getProfile: (): Promise<ApiResponse<UserProfile>> => {
    return apiClient.get('/api/user/profile');
  },

  // 更新用户资料
  updateProfile: (data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    return apiClient.put('/api/user/profile', data);
  },

  // 上传头像
  uploadAvatar: (file: File): Promise<ApiResponse<{ avatar_url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/file/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

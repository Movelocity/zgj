import apiClient from './client';
import type { UserProfile, UserProfileResponse } from '@/types/user';
import type { ApiResponse } from '@/types/global';

export const userAPI = {
  // 获取用户资料
  getProfile: (): Promise<ApiResponse<UserProfileResponse>> => {
    return apiClient.get('/api/user/profile');
  },

  // 更新用户资料
  updateProfile: (data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    return apiClient.put('/api/user/profile', data).then(res => res.data);
  },

  // 上传头像
  uploadAvatar: (file: File): Promise<ApiResponse<{ url: string; filename: string; size: number }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/user/upload_avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 修改密码
  changePassword: (data: { current_password: string; new_password: string }): Promise<ApiResponse<null>> => {
    return apiClient.put('/api/user/password', data);
  },
};

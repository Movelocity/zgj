import apiClient from './client';
import type { LoginCredentials, AuthData, User } from '@/types/user';
import type { ApiResponse } from '@/types/global';

export const authAPI = {
  // 登录
  login: (credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiClient.post('/api/user/login', credentials).then(res => res.data);
  },

  // 手机号+验证码认证
  auth: (data: AuthData): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiClient.post('/api/user/auth', data).then(res => res.data);
  },

  // 发送短信验证码
  sendSMS: (phone: string): Promise<ApiResponse> => {
    return apiClient.post('/api/user/send_sms', { phone }).then(res => res.data);
  },

  // 验证短信验证码
  verifySMS: (phone: string, sms_code: string): Promise<ApiResponse> => {
    return apiClient.post('/api/user/verify_sms', { phone, sms_code }).then(res => res.data);
  },

  // 获取当前用户信息
  getCurrentUser: (): Promise<ApiResponse<UserProfileResponse>> => {
    return apiClient.get('/api/user/profile').then(res => res.data);
  },
};

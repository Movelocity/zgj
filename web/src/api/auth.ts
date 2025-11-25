import apiClient from './client';
import type { LoginCredentials, AuthData, RegisterData, User, UserProfileResponse, AuthResponse } from '@/types/user';
import type { ApiResponse } from '@/types/global';

export const authAPI = {
  // 登录
  login: (credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiClient.post('/api/user/login', credentials);
  },

  // 手机号+验证码认证（自动注册，不需要邀请码）
  auth: (data: AuthData): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post('/api/user/auth', data);
  },

  // 注册（邀请码选填，如果用户已存在则直接登录）
  register: (data: RegisterData): Promise<ApiResponse<{ token: string; user: User; message?: string }>> => {
    return apiClient.post('/api/user/register', data);
  },

  // 发送短信验证码
  sendSMS: (phone: string): Promise<ApiResponse> => {
    return apiClient.post('/api/user/send_sms', { phone });
  },

  // 验证短信验证码
  verifySMS: (phone: string, sms_code: string): Promise<ApiResponse> => {
    return apiClient.post('/api/user/verify_sms', { phone, sms_code });
  },

  // 获取当前用户信息
  getCurrentUser: (): Promise<ApiResponse<UserProfileResponse>> => {
    return apiClient.get('/api/user/profile');
  },
};

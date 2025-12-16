import apiClient from './client';
import type { 
  InvitationCode, 
  CreateInvitationRequest,
  AdminCreateInvitationRequest,
  ValidateInvitationRequest, 
  ValidateInvitationResponse,
  InvitationListResponse,
  BatchUpdateInvitationRequest,
  UpdateInvitationRequest,
  UserInvitationUseResponse
} from '@/types/invitation';
import type { ApiResponse } from '@/types/global';

export const invitationAPI = {
  // 创建邀请码
  createInvitation: (data: CreateInvitationRequest): Promise<ApiResponse<InvitationCode>> => {
    return apiClient.post('/api/invitations', data);
  },

  // 管理员为指定用户创建邀请码
  adminCreateInvitation: (data: AdminCreateInvitationRequest): Promise<ApiResponse<InvitationCode>> => {
    return apiClient.post('/api/invitations/admin-create', data);
  },

  // 验证邀请码
  validateInvitation: (data: ValidateInvitationRequest): Promise<ApiResponse<ValidateInvitationResponse>> => {
    return apiClient.post('/api/invitations/validate', data);
  },

  // 使用邀请码（需要登录，会自动从 JWT 获取用户ID）
  useInvitation: (code: string): Promise<ApiResponse<null>> => {
    return apiClient.post('/api/invitations/use', { code });
  },

  // 查询当前用户的邀请码使用记录
  getMyInvitationUse: (): Promise<ApiResponse<UserInvitationUseResponse>> => {
    return apiClient.get('/api/invitations/my-use');
  },

  // 获取当前用户创建的邀请码列表
  getMyCreatedInvitations: (params?: { page?: number; limit?: number }): Promise<ApiResponse<InvitationListResponse>> => {
    return apiClient.get('/api/invitations/my-created', { params });
  },

  // 获取或创建普通邀请码（自动返回最新有效邀请码，如果没有则创建）
  getNormalCode: (): Promise<ApiResponse<InvitationCode>> => {
    return apiClient.get('/api/invitations/normal');
  },

  // 获取邀请码列表（管理员）
  getInvitationList: (params?: { page?: number; limit?: number }): Promise<ApiResponse<InvitationListResponse>> => {
    return apiClient.get('/api/invitations', { params });
  },

  // 获取邀请码详情（管理员）
  getInvitationDetail: (code: string): Promise<ApiResponse<InvitationCode>> => {
    return apiClient.get(`/api/invitations/${code}`);
  },

  // 禁用邀请码（管理员）
  deactivateInvitation: (code: string): Promise<ApiResponse<null>> => {
    return apiClient.post(`/api/invitations/${code}/deactivate`);
  },

  // 激活邀请码（管理员）
  activateInvitation: (code: string): Promise<ApiResponse<null>> => {
    return apiClient.post(`/api/invitations/${code}/activate`);
  },

  // 更新单个邀请码（管理员）
  updateInvitation: (code: string, data: UpdateInvitationRequest): Promise<ApiResponse<null>> => {
    return apiClient.put(`/api/invitations/${code}`, data);
  },

  // 批量更新邀请码（管理员）
  batchUpdateInvitations: (data: BatchUpdateInvitationRequest): Promise<ApiResponse<null>> => {
    return apiClient.post('/api/invitations/batch-update', data);
  },

  // 获取邀请码统计信息（管理员）
  getInvitationStats: (): Promise<ApiResponse<{
    total_codes: number;
    active_codes: number;
    inactive_codes: number;
    total_uses: number;
    unique_users: number;
  }>> => {
    return apiClient.get('/api/invitations/stats');
  },
};


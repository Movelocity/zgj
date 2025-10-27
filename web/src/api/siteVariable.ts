import apiClient from './client';
import type { 
  SiteVariable,
  CreateSiteVariableRequest,
  UpdateSiteVariableRequest,
  GetSiteVariableListParams,
  SiteVariableListResponse,
  GetSiteVariableByKeyResponse
} from '@/types/siteVariable';
import type { ApiResponse } from '@/types/global';

export const siteVariableAPI = {
  // ========== 管理员接口 ==========
  
  // 创建网站变量（管理员）
  createSiteVariable: (data: CreateSiteVariableRequest): Promise<ApiResponse<null>> => {
    return apiClient.post('/api/admin/site-variables', data);
  },

  // 更新网站变量（管理员）
  updateSiteVariable: (id: number, data: UpdateSiteVariableRequest): Promise<ApiResponse<null>> => {
    return apiClient.put(`/api/admin/site-variables/${id}`, data);
  },

  // 删除网站变量（管理员）
  deleteSiteVariable: (id: number): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/admin/site-variables/${id}`);
  },

  // 获取网站变量列表（管理员）
  getSiteVariableList: (params?: GetSiteVariableListParams): Promise<ApiResponse<SiteVariableListResponse>> => {
    return apiClient.get('/api/admin/site-variables', { params });
  },

  // 通过ID获取网站变量详情（管理员）
  getSiteVariableByID: (id: number): Promise<ApiResponse<SiteVariable>> => {
    return apiClient.get(`/api/admin/site-variables/${id}`);
  },

  // ========== 公开接口 ==========
  
  // 通过key获取网站变量（公开）
  getSiteVariableByKey: (key: string): Promise<ApiResponse<GetSiteVariableByKeyResponse>> => {
    return apiClient.get('/api/public/site-variables/by-key', { params: { key } });
  },
};


/**
 * Billing API Client
 * 计费系统API封装
 */

import apiClient from './client';
import type { ApiResponse } from '@/types/global';
import type {
  BillingActionPrice,
  BillingPackage,
  UserBillingPackage,
  CreateBillingPackageRequest,
  AssignBillingPackageRequest,
  CheckCreditsRequest,
  CheckCreditsResponse,
  DeductCreditsRequest,
  DeductCreditsResponse,
  MyCreditsResponse,
} from '@/types/billing';

/**
 * ==================== 公共API ====================
 */

/**
 * 查询动作价格列表
 */
export const listActionPrices = (activeOnly: boolean = true): Promise<ApiResponse<BillingActionPrice[]>> => {
  return apiClient.get<ApiResponse<BillingActionPrice[]>>('/api/billing/action-prices', {
    params: { active_only: activeOnly },
  }) as any;
};

/**
 * 获取启用的动作价格
 */
export const getActiveActionPrices = (): Promise<ApiResponse<BillingActionPrice[]>> => {
  return apiClient.get<ApiResponse<BillingActionPrice[]>>('/api/billing/action-prices/active') as any;
};

/**
 * ==================== 用户API ====================
 */

/**
 * 查询我的套餐
 */
export const getMyBillingPackages = (): Promise<ApiResponse<UserBillingPackage[]>> => {
  return apiClient.get<ApiResponse<UserBillingPackage[]>>('/api/user/billing/packages') as any;
};

/**
 * 查询我的积分
 */
export const getMyCredits = (): Promise<ApiResponse<MyCreditsResponse>> => {
  return apiClient.get<ApiResponse<MyCreditsResponse>>('/api/user/billing/credits') as any;
};

/**
 * ==================== 管理员API ====================
 */

/**
 * 创建套餐
 */
export const createBillingPackage = (data: CreateBillingPackageRequest): Promise<ApiResponse<BillingPackage>> => {
  return apiClient.post<ApiResponse<BillingPackage>>('/api/admin/billing/packages', data) as any;
};

/**
 * 查询套餐列表
 */
export const listBillingPackages = (params?: { active_only?: boolean; visible_only?: boolean }): Promise<ApiResponse<BillingPackage[]>> => {
  return apiClient.get<ApiResponse<BillingPackage[]>>('/api/admin/billing/packages', { params }) as any;
};

/**
 * 获取单个套餐
 */
export const getBillingPackage = (id: number): Promise<ApiResponse<BillingPackage>> => {
  return apiClient.get<ApiResponse<BillingPackage>>(`/api/admin/billing/packages/${id}`) as any;
};

/**
 * 更新套餐
 */
export const updateBillingPackage = (id: number, data: CreateBillingPackageRequest): Promise<ApiResponse<BillingPackage>> => {
  return apiClient.put<ApiResponse<BillingPackage>>(`/api/admin/billing/packages/${id}`, data) as any;
};

/**
 * 为用户分配套餐
 */
export const assignBillingPackage = (data: AssignBillingPackageRequest): Promise<ApiResponse<UserBillingPackage>> => {
  return apiClient.post<ApiResponse<UserBillingPackage>>('/api/admin/billing/user-packages', data) as any;
};

/**
 * 查询用户套餐列表
 */
export const getUserBillingPackages = (userId: string): Promise<ApiResponse<UserBillingPackage[]>> => {
  return apiClient.get<ApiResponse<UserBillingPackage[]>>(`/api/admin/billing/users/${userId}/billing-packages`) as any;
};

/**
 * 激活套餐
 */
export const activateBillingPackage = (id: number): Promise<ApiResponse> => {
  return apiClient.post<ApiResponse>(`/api/admin/billing/user-packages/${id}/activate`) as any;
};

/**
 * ==================== 内部API ====================
 */

/**
 * 检查积分
 */
export const checkCredits = (data: CheckCreditsRequest): Promise<ApiResponse<CheckCreditsResponse>> => {
  return apiClient.post<ApiResponse<CheckCreditsResponse>>('/api/internal/billing/credits/check', data) as any;
};

/**
 * 扣减积分
 */
export const deductCredits = (data: DeductCreditsRequest): Promise<ApiResponse<DeductCreditsResponse>> => {
  return apiClient.post<ApiResponse<DeductCreditsResponse>>('/api/internal/billing/credits/deduct', data) as any;
};


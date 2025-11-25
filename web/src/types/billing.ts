/**
 * Billing Type Definitions
 * 计费系统类型定义
 */

// 套餐类型枚举
export type PackageType = 'duration' | 'credits' | 'hybrid' | 'permanent';

// 套餐状态枚举
export type PackageStatus = 'pending' | 'active' | 'expired' | 'depleted';

// 套餐来源枚举
export type PackageSource = 'purchase' | 'gift' | 'promotion' | 'system';

// 动作key枚举
export type ActionKey = 'resume_optimize' | 'ai_chat' | 'pdf_export' | 'advanced_analysis';

// 动作计价
export interface BillingActionPrice {
  id: number;
  created_at: string;
  updated_at: string;
  action_key: ActionKey;
  action_name: string;
  description: string;
  credits_cost: number;
  is_active: boolean;
  sort_order: number;
  metadata?: Record<string, any>;
}

// 套餐定义
export interface BillingPackage {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  package_type: PackageType;
  price: number;
  original_price?: number;
  credits_amount: number;
  validity_days: number;
  is_active: boolean;
  is_visible: boolean;
  sort_order: number;
  display_order: number;
  metadata?: Record<string, any>;
}

// 用户套餐
export interface UserBillingPackage {
  id: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  billing_package_id: number;
  package_name: string;
  package_type: PackageType;
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  activated_at?: string;
  expires_at?: string;
  status: PackageStatus;
  priority: number;
  source: PackageSource;
  order_id?: string;
  notes?: string;
}

// 创建套餐请求
export interface CreateBillingPackageRequest {
  name: string;
  description?: string;
  package_type: PackageType;
  price: number;
  original_price?: number;
  credits_amount: number;
  validity_days: number;
  is_active: boolean;
  is_visible: boolean;
  sort_order?: number;
  display_order?: number;
}

// 分配套餐请求
export interface AssignBillingPackageRequest {
  user_id: string;
  package_id: number;
  source?: PackageSource;
  notes?: string;
  auto_activate?: boolean;
}

// 检查积分请求
export interface CheckCreditsRequest {
  user_id: string;
  action_key: ActionKey;
}

// 检查积分响应
export interface CheckCreditsResponse {
  has_enough: boolean;
  total_credits: number;
  required_credits: number;
}

// 扣减积分请求
export interface DeductCreditsRequest {
  user_id: string;
  action_key: ActionKey;
  resource_type?: string;
  resource_id?: string;
}

// 扣减积分响应
export interface DeductCreditsResponse {
  success: boolean;
  deducted_credits: number;
  remaining_credits: number;
  message?: string;
}

// 我的积分响应
export interface MyCreditsResponse {
  total_credits: number;
  user_id: string;
}

// 动作名称映射
export const ACTION_NAME_MAP: Record<ActionKey, string> = {
  resume_optimize: '简历优化',
  ai_chat: 'AI对话',
  pdf_export: 'PDF导出',
  advanced_analysis: '高级分析',
};

// 套餐类型名称映射
export const PACKAGE_TYPE_NAME_MAP: Record<PackageType, string> = {
  duration: '时长型',
  credits: '积分包',
  hybrid: '混合型',
  permanent: '永久型',
};

// 套餐状态名称映射
export const PACKAGE_STATUS_NAME_MAP: Record<PackageStatus, string> = {
  pending: '待激活',
  active: '使用中',
  expired: '已过期',
  depleted: '已耗尽',
};

// 套餐来源名称映射
export const PACKAGE_SOURCE_NAME_MAP: Record<PackageSource, string> = {
  purchase: '购买',
  gift: '赠送',
  promotion: '促销',
  system: '系统',
};


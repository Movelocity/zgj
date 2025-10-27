// 网站变量类型定义

export interface SiteVariable {
  id: number;
  created_at: string;
  updated_at: string;
  key: string;
  value: string;
  description: string;
}

// 创建网站变量请求
export interface CreateSiteVariableRequest {
  key: string;
  value: string;
  description?: string;
}

// 更新网站变量请求
export interface UpdateSiteVariableRequest {
  value: string;
  description?: string;
}

// 网站变量列表请求参数
export interface GetSiteVariableListParams {
  page?: number;
  pageSize?: number;
  key?: string; // 模糊搜索
}

// 网站变量列表响应
export interface SiteVariableListResponse {
  list: SiteVariable[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 通过key获取网站变量响应
export interface GetSiteVariableByKeyResponse {
  value: string;
  description: string;
}


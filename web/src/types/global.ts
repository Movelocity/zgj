// 全局类型定义
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  msg: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface FileUploadProgress {
  percent: number;
  status: 'uploading' | 'success' | 'error' | 'removed';
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

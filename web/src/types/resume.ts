// 简历相关类型定义 - 与后端 ResumeRecord 结构保持一致
export interface Resume {
  id: string;
  user_id: string;
  resume_number: string;
  version: number;
  name: string;
  original_filename: string;
  file_id: string;
  file_size: number;
  file_type: string;
  text_content?: string;
  structured_data?: any;
  status: 'active' | 'deleted';
  created_at: string;
  updated_at: string;
}

// 简历基本信息 - 用于列表显示
export interface ResumeInfo {
  id: string;
  resume_number: string;
  version: number;
  name: string;
  original_filename: string;
  file_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// 简历详细信息 - 包含文本内容和结构化数据
export interface ResumeDetail {
  id: string;
  resume_number: string;
  version: number;
  name: string;
  original_filename: string;
  file_id: string;
  text_content: string;
  structured_data: any;
  status: string;
  created_at: string;
  updated_at: string;
}

// 简历上传请求数据
export interface ResumeUploadData {
  file: File;
  name?: string;
}

// 创建纯文本简历请求数据
export interface CreateTextResumeData {
  name: string;
  text_content: string;
}

// 简历上传响应
export interface ResumeUploadResponse {
  id: string;
  resume_number: string;
  url: string;
  filename: string;
  size: number;
}

// 简历列表响应
export interface ResumeListResponse {
  list: ResumeInfo[];
  total: number;
  page: number;
  page_size: number;
}

// 简历更新请求
export interface ResumeUpdateRequest {
  name?: string;
  text_content?: string;
  structured_data?: any;
}

export interface ResumeVersion {
  id: string;
  resume_id: string;
  version: number;
  content: string;
  changes: string;
  created_at: string;
}

export interface ResumeOptimizationRequest {
  resume_id: string;
  job_description?: string;
  optimization_type: 'simple' | 'job_targeted';
  requirements?: string;
}

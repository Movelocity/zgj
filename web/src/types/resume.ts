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

// 简历元数据 - 存储页面状态信息
export interface ResumeMetadata {
  currentTarget?: 'jd' | 'normal' | 'foreign'; // 当前编辑目标类型
  isNewResume?: boolean; // 标记是否已完成初始分析（true=分析中，false=已完成，undefined=需要初始化）
  [key: string]: any; // 支持未来扩展的其他字段
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
  pending_content?: any; // 待保存的AI生成内容
  metadata?: ResumeMetadata; // 元数据，存储页面状态信息
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
  metadata?: ResumeMetadata; // 元数据，存储页面状态信息
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
  pending_content?: any; // 待保存的AI生成内容
  metadata?: ResumeMetadata; // 元数据，存储页面状态信息
  new_version?: boolean; // 是否创建新版本而不是覆盖原简历，默认true
}

// 简历更新响应（创建新版本时）
export interface ResumeUpdateResponse {
  message: string;
  new_resume_id?: string; // 创建新版本时返回的新简历ID
  is_new_version?: boolean; // 是否创建了新版本
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


/** ============= */


export interface OptimizationResult {
  totalChanges: number;
  sectionsImproved: string[];
  improvementPercentage: number;
  resumeId?: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  duration: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  duration: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  duration: string;
  description: string;
  technologies: string;
}

export type OptimizedSections = {
  personalInfo: string[];
  summary: boolean;
  workExperience: {
    [key: string]: string[];
  };
  education: {
    [key: string]: string[];
  };
  skills: boolean;
  projects: {
    [key: string]: string[];
  };
}

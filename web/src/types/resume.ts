// 简历相关类型定义
export interface Resume {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  original_name: string;
  status: 'active' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface ResumeUploadData {
  file: File;
  name?: string;
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

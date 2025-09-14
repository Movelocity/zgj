// 工作流相关类型定义
export interface Workflow {
  id: string;
  api_url: string;
  api_key: string;
  name: string;
  description: string;
  creator_id?: string;
  inputs: any;
  outputs: any;
  used: number;
  is_public: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// 工作流字段定义
export interface WorkflowField {
  field_name: string;
  field_type: 'string' | 'number' | 'boolean' | 'file';
  required: boolean;
}

// 创建工作流请求
export interface CreateWorkflowRequest {
  api_url: string;
  api_key: string;
  name: string;
  description?: string;
  inputs?: any;
  outputs?: any;
  is_public?: boolean;
  enabled?: boolean;
}

// 更新工作流请求
export interface UpdateWorkflowRequest {
  api_url?: string;
  api_key?: string;
  name?: string;
  description?: string;
  inputs?: any;
  outputs?: any;
  is_public?: boolean;
  enabled?: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string;
  inputs: any;
  outputs?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  started_at: string;
  completed_at?: string;
  execution_time?: number;
}

export interface WorkflowResult {
  execution_id: string;
  status: 'completed' | 'failed';
  result?: any;
  error?: string;
}

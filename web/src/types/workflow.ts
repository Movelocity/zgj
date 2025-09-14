// 工作流相关类型定义
export interface Workflow {
  id: string;
  name: string;
  description: string;
  api_endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  input_schema?: any;
  output_schema?: any;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
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

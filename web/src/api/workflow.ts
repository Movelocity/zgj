import apiClient from './client';
import type { Workflow, WorkflowExecution } from '@/types/workflow';
import type { ApiResponse, PaginationParams, PaginationResponse } from '@/types/global';

export const workflowAPI = {
  // 获取工作流列表
  getWorkflows: (): Promise<ApiResponse<Workflow[]>> => {
    return apiClient.get('/api/workflow/list');
  },

  // 执行工作流
  executeWorkflow: (id: string, inputs: any): Promise<ApiResponse<WorkflowExecution>> => {
    return apiClient.post(`/api/workflow/${id}/execute`, { inputs });
  },

  // 获取执行历史
  getExecutionHistory: (params?: PaginationParams): Promise<ApiResponse<PaginationResponse<WorkflowExecution>>> => {
    return apiClient.get('/api/workflow/executions', { params });
  },

  // 获取执行结果
  getExecutionResult: (executionId: string): Promise<ApiResponse<WorkflowExecution>> => {
    return apiClient.get(`/api/workflow/execution/${executionId}`);
  },
};

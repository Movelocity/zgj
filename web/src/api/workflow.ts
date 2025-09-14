import apiClient from './client';
import type { Workflow, WorkflowExecution } from '@/types/workflow';
import type { ApiResponse, PaginationParams, PaginationResponse } from '@/types/global';

export const workflowAPI = {
  // 获取工作流列表
  getWorkflows: (): Promise<ApiResponse<Workflow[]>> => {
    return apiClient.get('/api/workflow');
  },

  // 获取特定工作流
  getWorkflow: (id: string): Promise<ApiResponse<Workflow>> => {
    return apiClient.get(`/api/workflow/${id}`);
  },

  // 创建工作流
  createWorkflow: (data: any): Promise<ApiResponse<Workflow>> => {
    return apiClient.post('/api/workflow', data);
  },

  // 更新工作流
  updateWorkflow: (id: string, data: any): Promise<ApiResponse<Workflow>> => {
    return apiClient.put(`/api/workflow/${id}`, data);
  },

  // 删除工作流
  deleteWorkflow: (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/workflow/${id}`);
  },

  // 执行工作流
  executeWorkflow: (id: string, inputs: any): Promise<ApiResponse<any>> => {
    return apiClient.post(`/api/workflow/${id}/execute`, { inputs });
  },

  // 获取工作流执行历史
  getWorkflowHistory: (id: string, params?: PaginationParams): Promise<ApiResponse<PaginationResponse<WorkflowExecution>>> => {
    return apiClient.get(`/api/workflow/${id}/history`, { params });
  },

  // 获取用户工作流使用历史
  getUserWorkflowHistory: (params?: PaginationParams): Promise<ApiResponse<PaginationResponse<WorkflowExecution>>> => {
    return apiClient.get('/api/user/workflow_history', { params });
  },

  // 获取工作流统计信息
  getWorkflowStats: (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/api/workflow/${id}/stats`);
  },

  // 获取执行详情
  getExecutionDetail: (executionId: string): Promise<ApiResponse<WorkflowExecution>> => {
    return apiClient.get(`/api/execution/${executionId}`);
  },
};

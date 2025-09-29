import apiClient from './client';
import type { Workflow, WorkflowExecution } from '@/types/workflow';
import type { ApiResponse, PaginationParams, PaginationResponse } from '@/types/global';
import { TOKEN_KEY } from '@/utils/constants';

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
    return apiClient.post(`/api/workflow/${id}/execute`, { inputs, response_mode: 'blocking' });
  },

  // 流式执行工作流
  executeWorkflowStream: async (
    id: string, 
    inputs: any, 
    onMessage?: (data: any) => void, 
    onError?: (error: any) => void
  ): Promise<void> => {
    const token = localStorage.getItem(TOKEN_KEY);
    const body = { inputs, response_mode: 'streaming' };
    try {
      const response = await fetch(`/api/workflow/${id}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();
            
            if (data === '[DONE]') {
              return;
            }
            
            if (data) {
              try {
                const parsedData = JSON.parse(data);
                onMessage?.(parsedData);
              } catch (e) {
                console.warn('Failed to parse SSE data:', data);
              }
            }
          }
        }
      }
    } catch (error) {
      onError?.(error);
      throw error;
    }
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

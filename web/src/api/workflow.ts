import apiClient from './client';
import type { Workflow, WorkflowExecution } from '@/types/workflow';
import type { ApiResponse, PaginationParams, PaginationResponse } from '@/types/global';
import { TOKEN_KEY } from '@/utils/constants';

type ExecuteWorkflowStreamParams = {
  id?: string,
  name?: string,
  inputs: any,
  onMessage?: (data: any) => void,
  onError?: (error: any) => void,
}

// executeWorkflow_v2 的参数类型
type ExecuteWorkflowV2Params = {
  id: string,
  inputs: Record<string, unknown>,
  idAsName?: boolean,
  onNodeEvent?: (event: { type: string; nodeName?: string; nodeId?: string }) => void,
  signal?: AbortSignal,
}

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

  // 执行工作流（阻塞式）
  executeWorkflow: (id: string, inputs: any, idAsName: boolean = false): Promise<ApiResponse<any>> => {
    const url = idAsName ? `/api/workflow/v2/${id}/execute` : `/api/workflow/v1/${id}/execute`;
    return apiClient.post(url, { inputs, response_mode: 'blocking' });
  },

  // 执行工作流 v2（流式传输，Promise 包装返回最终结果）
  // 底层使用 SSE 流式连接，避免长时间阻塞导致连接被掐断
  // 返回格式与 executeWorkflow 兼容：{ code: 0, data: { data: { outputs: ... } } }
  executeWorkflow_v2: async ({
    id,
    inputs,
    idAsName = false,
    onNodeEvent,
    signal,
  }: ExecuteWorkflowV2Params): Promise<ApiResponse<any>> => {
    const tag = `[executeWorkflow_v2] [${id}]`;
    console.log(`${tag} 开始执行`);
    const token = localStorage.getItem(TOKEN_KEY);
    const url = idAsName ? `/api/workflow/v2/${id}/execute` : `/api/workflow/v1/${id}/execute`;
    const body = { inputs, response_mode: 'streaming' };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let finalOutputs: Record<string, unknown> | null = null;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // 保留最后一个可能不完整的行
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.substring(6).trim();
        if (!raw || raw === '[DONE]') continue;

        try {
          const event = JSON.parse(raw);

          switch (event.event) {
            case 'workflow_started':
              console.log(`${tag} 工作流开始`);
              onNodeEvent?.({ type: 'workflow_started' });
              break;
            case 'node_started':
              console.log(`${tag} 节点开始: ${event.data?.node_name || ''}`);
              onNodeEvent?.({
                type: 'node_started',
                nodeName: event.data?.node_name,
                nodeId: event.data?.node_id,
              });
              break;
            case 'node_finished':
              console.log(`${tag} 节点完成: ${event.data?.node_name || ''}`);
              onNodeEvent?.({
                type: 'node_finished',
                nodeName: event.data?.node_name,
                nodeId: event.data?.node_id,
              });
              break;
            case 'workflow_finished':
              console.log(`${tag} 工作流完成`);
              finalOutputs = event.data?.outputs ?? null;
              onNodeEvent?.({ type: 'workflow_finished' });
              break;
            case 'error':
              console.error(`${tag} 工作流错误:`, event.data?.message);
              throw new Error(event.data?.message || '工作流执行失败');
          }
        } catch (e) {
          if (e instanceof SyntaxError) {
            console.warn(`${tag} SSE 数据解析失败:`, raw);
          } else {
            throw e;
          }
        }
      }
    }

    if (!finalOutputs) {
      throw new Error(`${tag} 工作流未返回结果（流意外结束）`);
    }

    console.log(`${tag} 执行完成，返回结果`);
    // 返回与 executeWorkflow 兼容的格式
    return {
      code: 0,
      msg: '操作成功',
      data: {
        data: {
          outputs: finalOutputs,
        },
      },
    };
  },

  // 流式执行工作流（原始 SSE 回调模式）
  executeWorkflowStream: async ({
    id, 
    name,
    inputs, 
    onMessage, 
    onError, 
  }: ExecuteWorkflowStreamParams): Promise<void> => {
    if (!id && !name) {
      throw new Error('id 或 name 必须提供一个');
    }
    const token = localStorage.getItem(TOKEN_KEY);
    const body = { inputs, response_mode: 'streaming' };
    try {
      const url = name ? `/api/workflow/v2/${name}/execute` : `/api/workflow/v1/${id}/execute`;
      const response = await fetch(url, {
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

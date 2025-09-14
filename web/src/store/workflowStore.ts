import { create } from 'zustand';
import { Workflow, WorkflowExecution } from '@/types/workflow';
import { PaginationParams } from '@/types/global';
import { workflowAPI } from '@/api/workflow';

interface WorkflowState {
  workflows: Workflow[];
  executions: WorkflowExecution[];
  currentExecution: WorkflowExecution | null;
  isLoading: boolean;
  isExecuting: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  
  // Actions
  fetchWorkflows: () => Promise<void>;
  executeWorkflow: (id: string, inputs: any) => Promise<WorkflowExecution>;
  fetchExecutionHistory: (params?: PaginationParams) => Promise<void>;
  getExecutionResult: (executionId: string) => Promise<void>;
  setCurrentExecution: (execution: WorkflowExecution | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  workflows: [],
  executions: [],
  currentExecution: null,
  isLoading: false,
  isExecuting: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  },
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  ...initialState,

  fetchWorkflows: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await workflowAPI.getWorkflows();
      set({
        workflows: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '获取工作流列表失败',
      });
    }
  },

  executeWorkflow: async (id: string, inputs: any) => {
    set({ isExecuting: true, error: null });
    try {
      const response = await workflowAPI.executeWorkflow(id, inputs);
      const execution = response.data;
      
      set(state => ({
        executions: [execution, ...state.executions],
        currentExecution: execution,
        isExecuting: false,
      }));
      
      return execution;
    } catch (error) {
      set({
        isExecuting: false,
        error: error instanceof Error ? error.message : '执行工作流失败',
      });
      throw error;
    }
  },

  fetchExecutionHistory: async (params?: PaginationParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await workflowAPI.getExecutionHistory(params);
      const { list, total, page, pageSize, totalPages } = response.data;
      
      set({
        executions: list,
        pagination: { page, pageSize, total, totalPages },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '获取执行历史失败',
      });
    }
  },

  getExecutionResult: async (executionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await workflowAPI.getExecutionResult(executionId);
      set({
        currentExecution: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '获取执行结果失败',
      });
    }
  },

  setCurrentExecution: (execution: WorkflowExecution | null) => {
    set({ currentExecution: execution });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));

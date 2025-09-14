// API相关类型定义
import { ApiResponse, PaginationParams, PaginationResponse } from './global';
import { User, UserProfile, LoginCredentials, AuthData } from './user';
import { Resume, ResumeUploadData, ResumeOptimizationRequest } from './resume';
import { Workflow, WorkflowExecution } from './workflow';

// 认证API
export interface AuthAPI {
  login: (credentials: LoginCredentials) => Promise<ApiResponse<{ token: string; user: User }>>;
  auth: (data: AuthData) => Promise<ApiResponse<{ token: string; user: User }>>;
  sendSMS: (phone: string) => Promise<ApiResponse>;
  verifySMS: (phone: string, sms_code: string) => Promise<ApiResponse>;
}

// 用户API
export interface UserAPI {
  getProfile: () => Promise<ApiResponse<UserProfile>>;
  updateProfile: (data: Partial<UserProfile>) => Promise<ApiResponse<UserProfile>>;
  uploadAvatar: (file: File) => Promise<ApiResponse<{ avatar_url: string }>>;
}

// 简历API
export interface ResumeAPI {
  getResumes: (params?: PaginationParams) => Promise<ApiResponse<PaginationResponse<Resume>>>;
  uploadResume: (data: ResumeUploadData) => Promise<ApiResponse<Resume>>;
  getResume: (id: string) => Promise<ApiResponse<Resume>>;
  deleteResume: (id: string) => Promise<ApiResponse>;
  optimizeResume: (data: ResumeOptimizationRequest) => Promise<ApiResponse<any>>;
}

// 工作流API
export interface WorkflowAPI {
  getWorkflows: () => Promise<ApiResponse<Workflow[]>>;
  executeWorkflow: (id: string, inputs: any) => Promise<ApiResponse<WorkflowExecution>>;
  getExecutionHistory: (params?: PaginationParams) => Promise<ApiResponse<PaginationResponse<WorkflowExecution>>>;
}

// 管理员API
export interface AdminAPI {
  getUsers: (params?: PaginationParams & { keyword?: string }) => Promise<ApiResponse<PaginationResponse<User>>>;
  createUser: (data: { phone: string; password: string; role?: number }) => Promise<ApiResponse<User>>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<ApiResponse>;
  getWorkflows: () => Promise<ApiResponse<Workflow[]>>;
  createWorkflow: (data: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>) => Promise<ApiResponse<Workflow>>;
  updateWorkflow: (id: string, data: Partial<Workflow>) => Promise<ApiResponse<Workflow>>;
  deleteWorkflow: (id: string) => Promise<ApiResponse>;
  getFileStats: () => Promise<ApiResponse<{ total_files: number; total_size: number; file_types: Record<string, number> }>>;
}

import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '@/utils/constants';
import type { ApiResponse } from '@/types/global';

// 调试日志管理器
class DebugLogger {
  private logs: Array<{
    id: string;
    timestamp: Date;
    type: 'request' | 'response' | 'error';
    method?: string;
    url?: string;
    status?: number;
    data?: any;
    error?: string;
    duration?: number;
  }> = [];

  private isDebug = import.meta.env.DEV;
  private maxLogs = 100;

  log(entry: any) {
    if (!this.isDebug) return;
    
    this.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      ...entry
    });
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    // 控制台输出
    const { type, method, url } = entry;
    const emoji = type === 'request' ? '🚀' : type === 'response' ? '✅' : '❌';
    console.log(`${emoji} [API] ${method?.toUpperCase()} ${url}`, entry);
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const debugLogger = new DebugLogger();

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 记录请求开始时间
    (config as any)._requestStartTime = Date.now();
    
    // 记录请求日志
    debugLogger.log({
      type: 'request',
      method: config.method,
      url: config.url,
      data: config.data,
      params: config.params,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    debugLogger.log({
      type: 'error',
      error: error.message,
      stage: 'request'
    });
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const duration = Date.now() - (response.config as any)._requestStartTime;
    
    // 记录响应日志
    debugLogger.log({
      type: 'response',
      method: response.config.method,
      url: response.config.url,
      status: response.status,
      data: response.data,
      duration
    });
    
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    const duration = error.config ? Date.now() - (error.config as any)._requestStartTime : 0;
    
    // 记录错误日志
    debugLogger.log({
      type: 'error',
      method: error.config?.method,
      url: error.config?.url,
      status: error.response?.status,
      error: (error.response?.data as any)?.msg || error.message,
      duration
    });
    
    // 处理401未授权错误
    if (error.response?.status === 401) {
      // 只清除 token，不直接重定向，让 authStore 处理
      localStorage.removeItem(TOKEN_KEY);
      return Promise.reject(new Error('登录已过期，请重新登录'));
    }

    // 处理其他HTTP错误
    const message = (error.response?.data as any)?.msg || (error.response?.data as any)?.message || error.message || '网络请求失败';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;

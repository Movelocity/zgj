import axios, { AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '@/utils/constants';
import { ApiResponse } from '@/types/global';

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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response.data;
  },
  (error: AxiosError<ApiResponse>) => {
    // 处理401未授权错误
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/auth';
      return Promise.reject(new Error('登录已过期，请重新登录'));
    }

    // 处理其他HTTP错误
    const message = error.response?.data?.message || error.message || '网络请求失败';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;

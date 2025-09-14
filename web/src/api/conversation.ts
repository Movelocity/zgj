import apiClient from './client';
import type { ApiResponse } from '@/types/global';

export interface Conversation {
  id: string;
  title: string;
  messages: any[];
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export const conversationAPI = {
  // 获取对话列表
  getConversations: (): Promise<ApiResponse<Conversation[]>> => {
    return apiClient.get('/api/conversation');
  },

  // 获取特定对话
  getConversation: (id: string): Promise<ApiResponse<Conversation>> => {
    return apiClient.get(`/api/conversation/${id}`);
  },

  // 创建对话
  createConversation: (data: { title: string }): Promise<ApiResponse<Conversation>> => {
    return apiClient.post('/api/conversation', data);
  },

  // 更新对话
  updateConversation: (id: string, data: Partial<Conversation>): Promise<ApiResponse<Conversation>> => {
    return apiClient.put(`/api/conversation/${id}`, data);
  },

  // 删除对话
  deleteConversation: (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/conversation/${id}`);
  },
};

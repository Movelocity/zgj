import apiClient from './client';
import type { ApiResponse } from '@/types/global';
import type {
  ChatMessage,
  CreateChatMessageRequest,
  GetChatMessagesRequest,
  ChatMessagesListResponse,
} from '@/types/chatMessage';

export const chatMessageAPI = {
  // Create a chat message
  createMessage: (data: CreateChatMessageRequest): Promise<ApiResponse<ChatMessage>> => {
    return apiClient.post('/api/chat-messages', data);
  },

  // Get chat messages list with pagination
  getMessages: (params: GetChatMessagesRequest): Promise<ApiResponse<ChatMessagesListResponse>> => {
    return apiClient.get('/api/chat-messages', { params });
  },

  // Delete a single chat message
  deleteMessage: (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/chat-messages/${id}`);
  },

  // Delete all messages under a resume
  deleteAllMessages: (resumeId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/chat-messages/resume/${resumeId}`);
  },
};

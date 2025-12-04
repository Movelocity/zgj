// Chat message types based on API documentation

export interface MessageContent {
  content: string;
  // Future extensions:
  // file_id?: string;
  // image_id?: string;
}

export interface ChatMessage {
  id: string;
  resume_id: string;
  user_id: string;
  sender_name: string;
  message: MessageContent;
  created_at: string; // ISO 8601 format
}

export interface CreateChatMessageRequest {
  resume_id: string;
  sender_name: string;
  message: MessageContent;
}

export interface GetChatMessagesRequest {
  resume_id: string;
  page?: number;
  page_size?: number;
  before_time?: string; // ISO 8601 format for loading older messages
}

export interface ChatMessagesListResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

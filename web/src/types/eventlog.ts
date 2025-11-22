// Event Log Types

/**
 * Event log entry interface
 * Corresponds to backend model.EventLog
 */
export interface EventLog {
  id: number;
  created_at: string; // ISO 8601 format
  user_id: string;
  event_type: string;
  event_category: string;
  ip_address: string;
  user_agent: string;
  resource_type?: string;
  resource_id?: string;
  status: string;
  error_message?: string;
  details: Record<string, any> | null;
}

/**
 * Query parameters for event log API
 * Corresponds to backend QueryRequest
 */
export interface EventLogQueryParams {
  page?: number;
  page_size?: number;
  user_id?: string;
  event_type?: string;
  event_category?: string;
  status?: string;
  start_time?: string; // ISO 8601 format: 2006-01-02T15:04:05
  end_time?: string;   // ISO 8601 format: 2006-01-02T15:04:05
}

/**
 * Query response from event log API
 * Corresponds to backend QueryResponse
 */
export interface EventLogQueryResponse {
  list: EventLog[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Event categories
 */
export const EventCategory = {
  AUTH: 'auth',       // 认证相关
  USER: 'user',       // 用户操作
  RESUME: 'resume',   // 简历操作
  PAYMENT: 'payment', // 付费相关
  SYSTEM: 'system',   // 系统事件
} as const;

export type EventCategoryType = typeof EventCategory[keyof typeof EventCategory];

/**
 * Event types
 */
export const EventType = {
  // 认证相关 (auth)
  SMS_SENT: 'sms_sent',
  USER_REGISTER: 'user_register',
  USER_LOGIN: 'user_login',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGE: 'password_change',
  USER_LOGOUT: 'user_logout',
  
  // 用户操作 (user)
  PROFILE_UPDATE: 'profile_update',
  AVATAR_UPLOAD: 'avatar_upload',
  
  // 简历操作 (resume)
  RESUME_UPLOAD: 'resume_upload',
  RESUME_OPTIMIZE: 'resume_optimize',
  RESUME_EXPORT: 'resume_export',
  
  // 系统事件 (system)
  BUSINESS_ERROR: 'business_error',
  SYSTEM_ERROR: 'system_error',
  
  // 付费相关 (payment) - 预留
  ORDER_CREATE: 'order_create',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  BALANCE_CHANGE: 'balance_change',
} as const;

export type EventTypeType = typeof EventType[keyof typeof EventType];

/**
 * Event status
 */
export const EventStatus = {
  SUCCESS: 'success', // 成功
  FAILED: 'failed',   // 失败
  ERROR: 'error',     // 错误
} as const;

export type EventStatusType = typeof EventStatus[keyof typeof EventStatus];

/**
 * Category display names (Chinese)
 */
export const CategoryDisplayNames: Record<string, string> = {
  [EventCategory.AUTH]: '认证相关',
  [EventCategory.USER]: '用户操作',
  [EventCategory.RESUME]: '简历操作',
  [EventCategory.PAYMENT]: '付费相关',
  [EventCategory.SYSTEM]: '系统事件',
};

/**
 * Event type display names (Chinese)
 */
export const EventTypeDisplayNames: Record<string, string> = {
  // Auth
  [EventType.SMS_SENT]: '发送验证码',
  [EventType.USER_REGISTER]: '用户注册',
  [EventType.USER_LOGIN]: '用户登录',
  [EventType.LOGIN_FAILED]: '登录失败',
  [EventType.PASSWORD_RESET]: '密码重置',
  [EventType.PASSWORD_CHANGE]: '密码修改',
  [EventType.USER_LOGOUT]: '退出登录',
  
  // User
  [EventType.PROFILE_UPDATE]: '修改资料',
  [EventType.AVATAR_UPLOAD]: '上传头像',
  
  // Resume
  [EventType.RESUME_UPLOAD]: '上传简历',
  [EventType.RESUME_OPTIMIZE]: '简历优化',
  [EventType.RESUME_EXPORT]: '导出简历',
  
  // System
  [EventType.BUSINESS_ERROR]: '业务错误',
  [EventType.SYSTEM_ERROR]: '系统错误',
  
  // Payment
  [EventType.ORDER_CREATE]: '创建订单',
  [EventType.PAYMENT_SUCCESS]: '支付成功',
  [EventType.PAYMENT_FAILED]: '支付失败',
  [EventType.BALANCE_CHANGE]: '余额变动',
};

/**
 * Status display names (Chinese)
 */
export const StatusDisplayNames: Record<string, string> = {
  [EventStatus.SUCCESS]: '成功',
  [EventStatus.FAILED]: '失败',
  [EventStatus.ERROR]: '错误',
};

/**
 * Get event types by category
 */
export const getEventTypesByCategory = (category: string): string[] => {
  const categoryMap: Record<string, string[]> = {
    [EventCategory.AUTH]: [
      EventType.SMS_SENT,
      EventType.USER_REGISTER,
      EventType.USER_LOGIN,
      EventType.LOGIN_FAILED,
      EventType.PASSWORD_RESET,
      EventType.PASSWORD_CHANGE,
      EventType.USER_LOGOUT,
    ],
    [EventCategory.USER]: [
      EventType.PROFILE_UPDATE,
      EventType.AVATAR_UPLOAD,
    ],
    [EventCategory.RESUME]: [
      EventType.RESUME_UPLOAD,
      EventType.RESUME_OPTIMIZE,
      EventType.RESUME_EXPORT,
    ],
    [EventCategory.SYSTEM]: [
      EventType.BUSINESS_ERROR,
      EventType.SYSTEM_ERROR,
    ],
    [EventCategory.PAYMENT]: [
      EventType.ORDER_CREATE,
      EventType.PAYMENT_SUCCESS,
      EventType.PAYMENT_FAILED,
      EventType.BALANCE_CHANGE,
    ],
  };
  
  return categoryMap[category] || [];
};


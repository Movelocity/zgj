// 用户相关类型定义
export interface User {
  id: string;
  phone: string;
  nickname?: string;
  avatar?: string;
  role: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  real_name?: string;
  email?: string;
  company?: string;
  position?: string;
  industry?: string;
  work_experience?: string;
  education?: string;
  skills?: string[];
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  phone: string;
  password?: string;
  sms_code?: string;
}

export interface AuthData {
  phone: string;
  sms_code: string;
  name?: string; // 可选，首次注册时提供
}

export interface RegisterData {
  phone: string;
  password: string;
  sms_code: string;
  nickname?: string;
}

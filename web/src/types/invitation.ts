// 邀请码相关类型定义

export interface InvitationCode {
  code: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
  note: string;
  creator_id?: string; // 创建者ID
  creator?: string;    // 创建者名称
}

export interface CreateInvitationRequest {
  max_uses: number;
  expires_in_days: number | null;
  note?: string;
}

export interface AdminCreateInvitationRequest {
  creator_id: string;
  max_uses: number;
  expires_in_days: number | null;
  note?: string;
}

export interface ValidateInvitationRequest {
  code: string;
}

export interface ValidateInvitationResponse {
  is_valid: boolean;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  message?: string;
}

export interface UseInvitationRequest {
  code: string;
  user_id: string;
}

export interface InvitationListResponse {
  data: InvitationCode[];
  total: number;
  page: number;
  limit: number;
}

export interface UserInvitationInfo extends InvitationCode {
  user_id: string;
  user_name: string;
  user_phone: string;
}

export interface BatchUpdateInvitationRequest {
  codes: string[];
  max_uses?: number | null;
  expires_in_days?: number | null;
}

export interface UpdateInvitationRequest {
  max_uses?: number | null;
  expires_in_days?: number | null;
  note?: string | null;
}


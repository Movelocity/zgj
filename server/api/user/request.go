package user

import "server/types/user"

// Re-export types for convenience
type RegisterRequest = user.RegisterRequest
type LoginRequest = user.LoginRequest
type SendSMSRequest = user.SendSMSRequest
type VerifySMSRequest = user.VerifySMSRequest
type ResetPasswordRequest = user.ResetPasswordRequest
type UpdateUserProfileRequest = user.UpdateUserProfileRequest

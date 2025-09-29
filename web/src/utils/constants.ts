// 常量定义

export const TOKEN_KEY = 'console_token';

export const UPLOAD_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: {
    RESUME: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/png', 'image/jpeg'],
    IMAGE: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
  }
};

export const ADMIN_ROLE = 888;

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  CODE_AUTH: '/code-auth',
  SIMPLE_RESUME: '/simple-resume',
  JOB_RESUME: '/job-resume',
  PROFILE: '/profile',
  ADMINISTRATOR: '/administrator',
  API_TEST: '/api-test',
} as const;

export const SMS_CONFIG = {
  COUNTDOWN_TIME: 60, // 秒
  CODE_LENGTH: 6
};

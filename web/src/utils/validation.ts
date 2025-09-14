// 表单验证工具
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { 
  isValid: boolean; 
  message?: string 
} => {
  if (password.length < 6) {
    return { isValid: false, message: '密码长度至少6位' };
  }
  
  if (password.length > 20) {
    return { isValid: false, message: '密码长度不能超过20位' };
  }
  
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return { isValid: false, message: '密码必须包含字母和数字' };
  }
  
  return { isValid: true };
};

export const validateSMSCode = (code: string): boolean => {
  const codeRegex = /^\d{6}$/;
  return codeRegex.test(code);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateFileType = (file: File, acceptedTypes: string[]): boolean => {
  return acceptedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validator?: (value: string) => boolean | { isValid: boolean; message?: string };
  message?: string;
}

export const validateField = (value: string, rules: ValidationRule): {
  isValid: boolean;
  message?: string;
} => {
  // Required validation
  if (rules.required && !validateRequired(value)) {
    return { isValid: false, message: rules.message || '此字段为必填项' };
  }
  
  // Skip other validations if value is empty and not required
  if (!rules.required && !value.trim()) {
    return { isValid: true };
  }
  
  // Min length validation
  if (rules.minLength && value.length < rules.minLength) {
    return { 
      isValid: false, 
      message: rules.message || `最少需要${rules.minLength}个字符` 
    };
  }
  
  // Max length validation
  if (rules.maxLength && value.length > rules.maxLength) {
    return { 
      isValid: false, 
      message: rules.message || `最多允许${rules.maxLength}个字符` 
    };
  }
  
  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    return { isValid: false, message: rules.message || '格式不正确' };
  }
  
  // Custom validator
  if (rules.validator) {
    const result = rules.validator(value);
    if (typeof result === 'boolean') {
      return { 
        isValid: result, 
        message: result ? undefined : (rules.message || '验证失败') 
      };
    } else {
      return result;
    }
  }
  
  return { isValid: true };
};

import type { ResumeData } from '@/types/resume';

// 辅助函数
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分钟前`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}小时前`;
  } else if (diffInSeconds < 2592000) {
    return `${Math.floor(diffInSeconds / 86400)}天前`;
  } else {
    return formatDate(date);
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const truncate = (text: string, maxLength: number): string => {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

export const parseResumeSummary = (resumeData: ResumeData): ResumeData => {
  return {
    personalInfo: resumeData.personalInfo,
    summary: truncate(resumeData.summary, 100),
    workExperience: resumeData.workExperience.map(w => ({
      ...w,
      description: truncate(w.description, 100)
    })),
    education: resumeData.education.map(e => ({
      ...e,
      description: truncate(e.description, 100)
    })),
    skills: resumeData.skills,
    projects: resumeData.projects.map(p => ({
      ...p,
      description: truncate(p.description, 100)
    }))
  }
}

/** 智能解析JSON，
 * 形如 ```json\n{}``` 等格式的文本，都能顺利解析出其中的有效json，
 * 主要是通过匹配首尾括号的位置来截取和校验有效json
 * 
 */
export const smartJsonParser = <T>(json: string): T => {
  const jsonStart = json.indexOf('{');
  const jsonEnd = json.lastIndexOf('}');
  const jsonStr = json.slice(jsonStart, jsonEnd + 1);
  console.debug('jsonStr', jsonStr);
  return JSON.parse(jsonStr);
}
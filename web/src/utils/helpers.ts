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

export const truncate = (text: string, maxLength: number): string => {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
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

/**
 * 纠正异常格式的 Resume Block 数据
 * 处理字段名映射不一致的问题，例如：
 * - full_name -> name
 * - block.name -> block.title
 * - 其他常见的字段映射错误
 */
export const fixResumeBlockFormat = (blocks: any[]): any[] => {
  if (!Array.isArray(blocks)) return blocks;

  return blocks.map((block: any) => {
    // 修正块级别的字段映射
    const fixedBlock: any = {
      title: block.title || block.name || '',
      type: block.type || 'text',
      data: block.data
    };

    // 如果是 object 类型（个人信息），需要修正内部字段
    if (fixedBlock.type === 'object' && typeof block === 'object') {
      const personalInfo: any = {};
      
      // 字段映射规则
      const fieldMapping: Record<string, string> = {
        'full_name': 'name',
        'birth_date': 'birth_date', // 保留但可能不在标准字段中
      };

      // 处理所有字段
      Object.keys(block).forEach(key => {
        if (key === 'type' || key === 'name') return; // 跳过块级字段
        
        const mappedKey = fieldMapping[key] || key;
        
        // 只保留个人信息相关字段
        if (['name', 'email', 'phone', 'location', 'title', 'photo', 'birth_date'].includes(mappedKey)) {
          personalInfo[mappedKey] = block[key];
        }
      });

      // 确保必要字段存在
      fixedBlock.data = {
        name: personalInfo.name || personalInfo.full_name || '',
        email: personalInfo.email || '',
        phone: personalInfo.phone || '',
        location: personalInfo.location || '',
        title: personalInfo.title || '',
        photo: personalInfo.photo || '',
        ...personalInfo
      };
    } else if (fixedBlock.type === 'list' && !Array.isArray(fixedBlock.data)) {
      // 如果标记为 list 但 data 不是数组，尝试修正
      fixedBlock.data = [];
    } else if (fixedBlock.type === 'text' && typeof fixedBlock.data !== 'string') {
      // 如果标记为 text 但 data 不是字符串，尝试修正
      fixedBlock.data = '';
    }

    return fixedBlock;
  });
}

/**
 * 智能解析并修正 JSON 格式
 * 结合 smartJsonParser 和 fixResumeBlockFormat，自动处理异常格式
 */
export const parseAndFixResumeJson = (json: string): any => {
  try {
    const parsed = smartJsonParser<any>(json);
    
    // 如果包含 blocks 字段，进行格式修正
    if (parsed.blocks && Array.isArray(parsed.blocks)) {
      return {
        ...parsed,
        blocks: fixResumeBlockFormat(parsed.blocks)
      };
    }
    
    // 如果本身就是 blocks 数组
    if (Array.isArray(parsed)) {
      return fixResumeBlockFormat(parsed);
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse and fix JSON:', error);
    throw error;
  }
}

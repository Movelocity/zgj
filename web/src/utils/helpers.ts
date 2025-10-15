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
 * - 确保 list 类型的每个项都有唯一 ID
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
    if (fixedBlock.type === 'object' && typeof block.data === 'object' && !Array.isArray(block.data)) {
      const personalInfo: any = block.data || {};
      
      // 字段映射规则
      const fieldMapping: Record<string, string> = {
        'full_name': 'name',
        'birth_date': 'birth_date', // 保留但可能不在标准字段中
      };

      // 处理字段映射
      const mappedInfo: any = {};
      Object.keys(personalInfo).forEach(key => {
        const mappedKey = fieldMapping[key] || key;
        
        // 只保留个人信息相关字段
        if (['name', 'email', 'phone', 'location', 'title', 'photo', 'birth_date'].includes(mappedKey)) {
          mappedInfo[mappedKey] = personalInfo[key];
        }
      });

      // 确保必要字段存在
      fixedBlock.data = {
        name: mappedInfo.name || mappedInfo.full_name || '',
        email: mappedInfo.email || '',
        phone: mappedInfo.phone || '',
        location: mappedInfo.location || '',
        title: mappedInfo.title || '',
        photo: mappedInfo.photo || '',
        ...mappedInfo
      };
    } else if (fixedBlock.type === 'list') {
      // 确保是数组
      if (!Array.isArray(fixedBlock.data)) {
        fixedBlock.data = [];
      } else {
        // 确保每个列表项都有必要的字段和唯一ID
        fixedBlock.data = fixedBlock.data.map((item: any, index: number) => {
          if (!item || typeof item !== 'object') {
            return {
              id: `item-${Date.now()}-${index}`,
              name: '',
              description: '',
              time: '',
              highlight: ''
            };
          }
          
          return {
            id: item.id || `item-${Date.now()}-${index}`,
            name: item.name || '',
            description: item.description || '',
            time: item.time || '',
            highlight: item.highlight || ''
          };
        });
      }
    } else if (fixedBlock.type === 'text' && typeof fixedBlock.data !== 'string') {
      // 如果标记为 text 但 data 不是字符串，尝试修正
      fixedBlock.data = String(fixedBlock.data || '');
    }

    return fixedBlock;
  });
}

/**
 * 智能解析并修正 JSON 格式
 * 结合 smartJsonParser 和 fixResumeBlockFormat，自动处理异常格式
 * 确保返回的数据总是有效的 ResumeV2Data 格式
 */
export const parseAndFixResumeJson = (json: string): any => {
  try {
    const parsed = smartJsonParser<any>(json);
    
    // 如果包含 blocks 字段，进行格式修正
    if (parsed.blocks && Array.isArray(parsed.blocks)) {
      const fixedBlocks = fixResumeBlockFormat(parsed.blocks);
      
      // 确保每个 block 都有必要的字段
      const validatedBlocks = fixedBlocks.map((block: any) => {
        if (!block || typeof block !== 'object') {
          return { title: '', type: 'text', data: '' };
        }
        
        // 确保有 type 字段
        if (!block.type || !['list', 'text', 'object'].includes(block.type)) {
          block.type = 'text';
        }
        
        // 确保 data 字段与 type 匹配
        if (block.type === 'list' && !Array.isArray(block.data)) {
          block.data = [];
        } else if (block.type === 'text' && typeof block.data !== 'string') {
          block.data = String(block.data || '');
        } else if (block.type === 'object' && (typeof block.data !== 'object' || Array.isArray(block.data))) {
          block.data = {
            name: '',
            email: '',
            phone: '',
            location: '',
            title: '',
            photo: ''
          };
        }
        
        return block;
      });
      
      return {
        version: parsed.version || 2,
        portrait_img: parsed.portrait_img || '',
        blocks: validatedBlocks
      };
    }
    
    // 如果本身就是 blocks 数组
    if (Array.isArray(parsed)) {
      const fixedBlocks = fixResumeBlockFormat(parsed);
      return {
        version: 2,
        blocks: fixedBlocks
      };
    }
    
    // 如果既没有 blocks 也不是数组，返回默认结构
    console.warn('Unexpected JSON format, returning default structure');
    return {
      version: 2,
      blocks: []
    };
  } catch (error) {
    console.error('Failed to parse and fix JSON:', error);
    // 返回安全的默认值，而不是抛出错误
    return {
      version: 2,
      blocks: []
    };
  }
}

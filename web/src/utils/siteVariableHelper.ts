/**
 * 网站变量辅助工具函数
 * 
 * 由于网站变量的 value 字段总是字符串类型，
 * 这些工具函数可以帮助你转换为其他类型
 */

/**
 * 将字符串转换为布尔值
 * @param value 字符串值
 * @returns 布尔值，"true" 返回 true，其他返回 false
 * @example
 * toBool("true")  // true
 * toBool("false") // false
 * toBool("")      // false
 */
export const toBool = (value: string): boolean => {
  return value === 'true';
};

/**
 * 将字符串转换为数字
 * @param value 字符串值
 * @param defaultValue 默认值，当转换失败时返回
 * @returns 数字值
 * @example
 * toNumber("123", 0)      // 123
 * toNumber("abc", 100)    // 100
 * toNumber("", 0)         // 0
 */
export const toNumber = (value: string, defaultValue: number = 0): number => {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

/**
 * 将字符串转换为浮点数
 * @param value 字符串值
 * @param defaultValue 默认值，当转换失败时返回
 * @returns 浮点数值
 * @example
 * toFloat("123.45", 0)    // 123.45
 * toFloat("abc", 0.0)     // 0.0
 */
export const toFloat = (value: string, defaultValue: number = 0): number => {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * 将字符串转换为JSON对象
 * @param value JSON字符串
 * @param defaultValue 默认值，当解析失败时返回
 * @returns 解析后的对象
 * @example
 * toJSON('{"name":"test"}', {})  // { name: "test" }
 * toJSON('invalid', {})          // {}
 */
export const toJSON = <T = any>(value: string, defaultValue: T | null = null): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

/**
 * 将字符串转换为数组（逗号分隔）
 * @param value 逗号分隔的字符串
 * @returns 字符串数组
 * @example
 * toArray("a,b,c")           // ["a", "b", "c"]
 * toArray("a, b , c")        // ["a", "b", "c"] (自动去除空格)
 * toArray("")                // []
 */
export const toArray = (value: string): string[] => {
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

/**
 * 将字符串转换为数字数组（逗号分隔）
 * @param value 逗号分隔的数字字符串
 * @returns 数字数组
 * @example
 * toNumberArray("1,2,3")     // [1, 2, 3]
 * toNumberArray("1,abc,3")   // [1, 3] (忽略无效数字)
 * toNumberArray("")          // []
 */
export const toNumberArray = (value: string): number[] => {
  if (!value) return [];
  return value
    .split(',')
    .map(item => parseInt(item.trim(), 10))
    .filter(num => !isNaN(num));
};

/**
 * 检查字符串是否为有效的JSON
 * @param value 待检查的字符串
 * @returns 是否为有效JSON
 * @example
 * isValidJSON('{"name":"test"}')  // true
 * isValidJSON('invalid')          // false
 */
export const isValidJSON = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * 将字符串转换为枚举值
 * @param value 字符串值
 * @param enumObj 枚举对象
 * @param defaultValue 默认值
 * @returns 枚举值
 * @example
 * enum Theme { LIGHT = 'light', DARK = 'dark' }
 * toEnum('dark', Theme, Theme.LIGHT)  // Theme.DARK
 * toEnum('invalid', Theme, Theme.LIGHT)  // Theme.LIGHT
 */
export const toEnum = <T extends Record<string, string>>(
  value: string,
  enumObj: T,
  defaultValue: T[keyof T]
): T[keyof T] => {
  const enumValues = Object.values(enumObj);
  return enumValues.includes(value as any) ? (value as T[keyof T]) : defaultValue;
};

/**
 * 将字符串按行分割为数组
 * @param value 多行字符串
 * @returns 字符串数组
 * @example
 * toLines("line1\nline2\nline3")  // ["line1", "line2", "line3"]
 * toLines("")                     // []
 */
export const toLines = (value: string): string[] => {
  if (!value) return [];
  return value.split('\n').map(line => line.trim()).filter(Boolean);
};

/**
 * 将字符串转换为Map
 * @param value 键值对字符串，格式：key1:value1,key2:value2
 * @returns Map对象
 * @example
 * toMap("name:张三,age:25")  // Map { "name" => "张三", "age" => "25" }
 */
export const toMap = (value: string): Map<string, string> => {
  const map = new Map<string, string>();
  if (!value) return map;
  
  value.split(',').forEach(pair => {
    const [key, val] = pair.split(':').map(s => s.trim());
    if (key && val) {
      map.set(key, val);
    }
  });
  
  return map;
};

/**
 * 将字符串转换为键值对对象
 * @param value 键值对字符串，格式：key1:value1,key2:value2
 * @returns 对象
 * @example
 * toKeyValue("name:张三,age:25")  // { name: "张三", age: "25" }
 */
export const toKeyValue = (value: string): Record<string, string> => {
  const obj: Record<string, string> = {};
  if (!value) return obj;
  
  value.split(',').forEach(pair => {
    const [key, val] = pair.split(':').map(s => s.trim());
    if (key && val) {
      obj[key] = val;
    }
  });
  
  return obj;
};

/**
 * 格式化文件大小字符串（字节数转为人类可读格式）
 * @param value 字节数（字符串）
 * @returns 格式化后的字符串
 * @example
 * formatFileSize("1024")       // "1.00 KB"
 * formatFileSize("1048576")    // "1.00 MB"
 * formatFileSize("1073741824") // "1.00 GB"
 */
export const formatFileSize = (value: string): string => {
  const bytes = toNumber(value, 0);
  
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 将时间字符串转换为 Date 对象
 * @param value ISO格式的时间字符串
 * @returns Date对象，失败返回null
 * @example
 * toDate("2025-10-27T10:00:00Z")  // Date对象
 * toDate("invalid")               // null
 */
export const toDate = (value: string): Date | null => {
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

/**
 * 将颜色十六进制字符串转换为RGB对象
 * @param value 十六进制颜色字符串（如 "#ff0000" 或 "ff0000"）
 * @returns RGB对象 { r, g, b } 或 null
 * @example
 * hexToRgb("#ff0000")  // { r: 255, g: 0, b: 0 }
 * hexToRgb("00ff00")   // { r: 0, g: 255, b: 0 }
 */
export const hexToRgb = (value: string): { r: number; g: number; b: number } | null => {
  const hex = value.replace('#', '');
  
  if (hex.length !== 6) return null;
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  
  return { r, g, b };
};


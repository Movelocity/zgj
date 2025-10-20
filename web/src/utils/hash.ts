/**
 * 生成字符串的简单哈希值
 * 用于生成唯一标识符
 */
export function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * 生成更长的哈希值（用于需要更高唯一性的场景）
 */
export function generateLongHash(str: string): string {
  let hash1 = 0;
  let hash2 = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 = hash1 & hash1;
    hash2 = ((hash2 << 7) - hash2) + char;
    hash2 = hash2 & hash2;
  }
  
  return Math.abs(hash1).toString(36) + Math.abs(hash2).toString(36);
}


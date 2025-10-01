/**
 * ID生成工具函数
 * 用于为简历数据中的列表项生成唯一标识符
 */

/**
 * 生成唯一ID - 8位随机大写字母
 * @returns 8位大写字母组成的随机字符串
 */
export const generateId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '#';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 确保数组中的每个项目都有唯一ID
 * @param items 需要检查ID的项目数组
 * @returns 确保每个项目都有ID的新数组
 */
export const ensureItemsHaveIds = <T extends { id?: string }>(items: T[]): (T & { id: string })[] => {
  return items.map(item => ({
    ...item,
    id: (item.id && item.id.length>3)? item.id : generateId()
  }));
};

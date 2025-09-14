import { useToastStore } from '@/store/toastStore';

/**
 * Toast工具函数 - 提供全局使用的便捷方法
 * 这些函数可以在任何地方调用，不需要在React组件中使用
 */

let toastStore: ReturnType<typeof useToastStore> | null = null;

/**
 * 初始化Toast工具函数
 * 这个函数在应用启动时调用一次，获取store实例
 */
export const initToast = () => {
  toastStore = useToastStore.getState();
};

/**
 * 获取Toast store实例
 */
const getToastStore = () => {
  if (!toastStore) {
    toastStore = useToastStore.getState();
  }
  return toastStore;
};

/**
 * 显示错误Toast
 * @param message 错误消息
 * @param duration 显示时长，默认5秒
 */
export const showError = (message: string, duration = 5000) => {
  getToastStore().showError(message, duration);
};

/**
 * 显示警告Toast
 * @param message 警告消息
 * @param duration 显示时长，默认4秒
 */
export const showWarning = (message: string, duration = 4000) => {
  getToastStore().showWarning(message, duration);
};

/**
 * 显示信息Toast
 * @param message 信息消息
 * @param duration 显示时长，默认3秒
 */
export const showInfo = (message: string, duration = 3000) => {
  getToastStore().showInfo(message, duration);
};

/**
 * 显示成功Toast（使用info类型，绿色主题）
 * @param message 成功消息
 * @param duration 显示时长，默认3秒
 */
export const showSuccess = (message: string, duration = 3000) => {
  getToastStore().addToast(message, { type: 'info', duration });
};

/**
 * 通用Toast显示方法
 * @param message 消息内容
 * @param type Toast类型
 * @param duration 显示时长
 */
export const showToast = (
  message: string, 
  type: 'error' | 'warn' | 'info' = 'info', 
  duration = 3000
) => {
  getToastStore().addToast(message, { type, duration });
};

/**
 * 清空所有Toast
 */
export const clearAllToasts = () => {
  getToastStore().clearToasts();
};

// 默认导出所有工具函数
export default {
  showError,
  showWarning,
  showInfo,
  showSuccess,
  showToast,
  clearAllToasts,
  initToast
};

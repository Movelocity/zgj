/**
 * Toast 通知类型定义
 */

export type ToastType = 'error' | 'warn' | 'info';

export interface Toast {
  /** 唯一标识符 */
  id: string;
  /** 消息内容 */
  message: string;
  /** Toast类型 */
  type: ToastType;
  /** 显示时长(毫秒)，默认3000ms */
  duration?: number;
  /** 创建时间戳 */
  createdAt: number;
}

export interface ToastOptions {
  /** Toast类型，默认info */
  type?: ToastType;
  /** 显示时长(毫秒)，默认3000ms */
  duration?: number;
}

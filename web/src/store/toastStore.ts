import { create } from 'zustand';
import type { Toast, ToastOptions } from '@/types/toast';

interface ToastState {
  /** 所有toast列表 */
  toasts: Toast[];
  /** 添加toast */
  addToast: (message: string, options?: ToastOptions) => void;
  /** 移除指定toast */
  removeToast: (id: string) => void;
  /** 清空所有toast */
  clearToasts: () => void;
  /** 便捷方法：显示错误toast */
  showError: (message: string, duration?: number) => void;
  /** 便捷方法：显示警告toast */
  showWarning: (message: string, duration?: number) => void;
  /** 便捷方法：显示信息toast */
  showInfo: (message: string, duration?: number) => void;
}

/**
 * 生成唯一ID
 */
const generateId = (): string => {
  return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Toast状态管理
 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (message: string, options: ToastOptions = {}) => {
    const toast: Toast = {
      id: generateId(),
      message,
      type: options.type || 'info',
      duration: options.duration || 3000,
      createdAt: Date.now()
    };

    set((state) => {
      const newToasts = [...state.toasts, toast];
      // 如果超过最大数量，移除最老的toast
      if (newToasts.length > 10) { // 保留更多toast在内存中，但UI只显示3个
        return { toasts: newToasts.slice(-10) };
      }
      return { toasts: newToasts };
    });
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  showError: (message: string, duration = 5000) => {
    get().addToast(message, { type: 'error', duration });
  },

  showWarning: (message: string, duration = 4000) => {
    get().addToast(message, { type: 'warn', duration });
  },

  showInfo: (message: string, duration = 3000) => {
    get().addToast(message, { type: 'info', duration });
  }
}));

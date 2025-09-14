import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface Modal {
  id: string;
  title: string;
  content: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface GlobalState {
  // Toast 通知
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Modal 弹窗
  modals: Modal[];
  openModal: (modal: Omit<Modal, 'id'>) => void;
  closeModal: (id: string) => void;
  clearModals: () => void;
  
  // 全局加载状态
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // 侧边栏状态
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // 主题
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

let toastId = 0;
let modalId = 0;

export const useGlobalStore = create<GlobalState>((set, get) => ({
  // Toast 通知
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastId}`;
    const newToast = { ...toast, id };
    
    set(state => ({
      toasts: [...state.toasts, newToast],
    }));
    
    // 自动移除 toast
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },
  
  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id),
    }));
  },
  
  clearToasts: () => {
    set({ toasts: [] });
  },
  
  // Modal 弹窗
  modals: [],
  openModal: (modal) => {
    const id = `modal-${++modalId}`;
    const newModal = { ...modal, id };
    
    set(state => ({
      modals: [...state.modals, newModal],
    }));
  },
  
  closeModal: (id) => {
    set(state => ({
      modals: state.modals.filter(modal => modal.id !== id),
    }));
  },
  
  clearModals: () => {
    set({ modals: [] });
  },
  
  // 全局加载状态
  globalLoading: false,
  setGlobalLoading: (loading) => {
    set({ globalLoading: loading });
  },
  
  // 侧边栏状态
  sidebarCollapsed: false,
  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },
  
  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },
  
  // 主题
  theme: 'light',
  toggleTheme: () => {
    set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
  },
  
  setTheme: (theme) => {
    set({ theme });
  },
}));

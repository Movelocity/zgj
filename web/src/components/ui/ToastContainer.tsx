import React from 'react';
import Toast from './Toast';
import { useToastStore } from '@/store/toastStore';

/**
 * Toast容器组件 - 显示在页面右上角，最多显示3个toast
 */
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  // 只显示最新的3个toast
  const visibleToasts = toasts.slice(-3);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2"
      aria-live="polite"
      aria-label="通知区域"
    >
      {visibleToasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;

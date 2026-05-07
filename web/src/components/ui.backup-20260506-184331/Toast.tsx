import React, { useEffect, useState } from 'react';
import type { Toast as ToastType } from '@/types/toast';
import { FaTimes } from 'react-icons/fa';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

/**
 * 单个Toast组件
 */
const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // 进入动画
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    // 自动移除定时器
    const removeTimer = setTimeout(() => {
      handleRemove();
    }, toast.duration || 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.duration]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // 等待退出动画完成
  };

  // 根据类型获取样式
  const getTypeStyles = () => {
    switch (toast.type) {
      case 'error':
        return {
          bg: 'bg-red-50/80 border-red-200',
          icon: '❌',
          iconBg: 'bg-red-100',
          text: 'text-red-800'
        };
      case 'warn':
        return {
          bg: 'bg-yellow-50/80 border-yellow-200',
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          text: 'text-yellow-800'
        };
      case 'info':
      default:
        // 如果消息包含成功相关词汇，使用绿色主题
        if (toast.message.includes('成功') || toast.message.includes('完成')) {
          return {
            bg: 'bg-green-50/80 border-green-200',
            icon: '✅',
            iconBg: 'bg-green-100',
            text: 'text-green-800'
          };
        }
        return {
          bg: 'bg-blue-50/80 border-blue-200',
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          text: 'text-blue-800'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`
        ${styles.bg} ${styles.text}
        border rounded-lg p-4 mb-2 shadow-lg max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isRemoving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
      `}
      role="alert"
    >
      <div className="flex items-center">
        <div className={`rounded-full mr-3 flex-shrink-0`}>
          <span className="text-sm">{styles.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">{toast.message}</p>
        </div>
        <button
          onClick={handleRemove}
          className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
          aria-label="关闭通知"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;

import React, { type ReactNode } from 'react';
import { FiX } from 'react-icons/fi';
import { Button } from '@/components/ui';

export interface ModalProps {
  /** 是否显示模态框 */
  open: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
  /** 模态框标题 */
  title?: string;
  /** 模态框内容 */
  children: ReactNode;
  /** 模态框尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 是否显示头部 */
  showHeader?: boolean;
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 是否显示底部 */
  showFooter?: boolean;
  /** 底部内容 */
  footer?: ReactNode;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮点击回调 */
  onConfirm?: () => void;
  /** 取消按钮点击回调 */
  onCancel?: () => void;
  /** 确认按钮加载状态 */
  confirmLoading?: boolean;
  /** 确认按钮是否禁用 */
  confirmDisabled?: boolean;
  /** 确认按钮变体 */
  confirmVariant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  /** 是否可以通过点击遮罩关闭 */
  maskClosable?: boolean;
  /** 是否可以通过ESC键关闭 */
  escClosable?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 内容区域自定义类名 */
  contentClassName?: string;
  /** z-index层级 */
  zIndex?: number;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  size = 'md',
  showHeader = true,
  showCloseButton = true,
  showFooter = false,
  footer,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  // confirmLoading = false,
  confirmDisabled = false,
  confirmVariant = 'default',
  maskClosable = true,
  escClosable = true,
  className = '',
  contentClassName = '',
  zIndex = 1000,
}) => {
  if (!open) return null;

  // 处理ESC键关闭
  React.useEffect(() => {
    if (!open || !escClosable) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, escClosable, onClose]);

  // 阻止body滚动
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  

  // 尺寸配置
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]',
  };

  // 处理遮罩点击
  const handleMaskClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && maskClosable) {
      onClose();
    }
  };

  // 处理取消
  const handleCancel = () => {
    onCancel?.() || onClose();
  };

  // 处理确认
  const handleConfirm = () => {
    onConfirm?.();
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-2 ${className}`}
      style={{ zIndex }}
      onMouseDown={handleMaskClick}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} ${contentClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 模态框头部 */}
        {showHeader && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            {title && (
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            )}
            {showCloseButton && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1 rounded-md"
              >
                <FiX className="w-6 h-6" />
              </div>
            )}
          </div>
        )}

        {/* 模态框内容 */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {children}
        </div>

        {/* 模态框底部 */}
        {(showFooter || footer || onConfirm) && (
          <div className="flex items-center justify-end space-x-3 p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            {footer ? (
              footer
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {cancelText}
                </Button>
                {onConfirm && (
                  <Button
                    variant={confirmVariant}
                    onClick={handleConfirm}
                    // loading={confirmLoading}
                    disabled={confirmDisabled}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium"
                  >
                    {confirmText}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

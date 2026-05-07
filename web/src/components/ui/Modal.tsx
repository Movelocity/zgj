import React, { type ReactNode } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

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
  confirmVariant?: string;
  /** 是否可以通过点击遮罩关闭 */
  maskClosable?: boolean;
  /** 是否可以通过ESC键关闭 */
  escClosable?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 内容区域自定义类名 */
  contentClassName?: string;
  /** z-index层级，保留兼容旧 API，Radix 负责实际层级 */
  zIndex?: number;
  /** 是否在移动端全屏 */
  fullScreenOnMobile?: boolean;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-2xl',
  lg: 'sm:max-w-4xl',
  xl: 'sm:max-w-6xl',
  full: 'sm:max-w-[95vw]',
};

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
  confirmLoading = false,
  confirmDisabled = false,
  confirmVariant = 'primary',
  maskClosable = true,
  escClosable = true,
  className = '',
  contentClassName = '',
  fullScreenOnMobile = false,
}) => {
  const isMobile = useIsMobile();

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;
    if (maskClosable || escClosable) {
      onClose();
    }
  };

  const handleCancel = () => {
    onCancel?.() || onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        onEscapeKeyDown={(event) => {
          if (!escClosable) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (!maskClosable) event.preventDefault();
        }}
        className={cn(
          'gap-0 p-0',
          fullScreenOnMobile && isMobile
            ? 'h-dvh max-h-dvh w-screen max-w-none rounded-none'
            : sizeClasses[size],
          className,
          contentClassName
        )}
      >
        {showHeader ? (
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle>{title || 'Dialog'}</DialogTitle>
          </DialogHeader>
        ) : (
          <DialogTitle className="sr-only">{title || 'Dialog'}</DialogTitle>
        )}

        <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
          {children}
        </div>

        {(showFooter || footer || onConfirm) && (
          <DialogFooter className="border-t bg-muted/40 p-3">
            {footer ? (
              footer
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  {cancelText}
                </Button>
                {onConfirm && (
                  <Button
                    variant={confirmVariant as any}
                    onClick={onConfirm}
                    disabled={confirmDisabled || confirmLoading}
                  >
                    {confirmLoading ? '处理中...' : confirmText}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;

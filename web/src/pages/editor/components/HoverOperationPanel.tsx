import { useState, useEffect, type ReactNode } from 'react';
import cn from 'classnames';

interface HoverOperationPanelProps {
  trigger: ReactNode;
  children: ReactNode;
  delay?: number;
  triggerClassName?: string;
  panelClassName?: string;
  /** 动画类型：fade(淡入淡出) | scale(缩放) | slideDown(下滑) | slideUp(上滑) */
  animationType?: 'fade' | 'scale' | 'slideDown' | 'slideUp';
  /** 动画持续时间（毫秒），默认200ms */
  animationDuration?: number;
}

/**
 * 悬停操作面板组件
 * 
 * @param trigger - 触发器内容（图标）
 * @param children - 操作面板内容（按钮等）
 * @param delay - 鼠标移出后关闭面板的延迟时间（毫秒），默认200ms
 * @param triggerClassName - 触发器额外的样式类
 * @param panelClassName - 面板额外的样式类
 * @param animationType - 动画类型
 * @param animationDuration - 动画持续时间
 */
export default function HoverOperationPanel({
  trigger,
  children,
  delay = 200,
  triggerClassName = '',
  panelClassName = '',
  animationType = 'scale',
  animationDuration = 200,
}: HoverOperationPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // 鼠标进入触发器或面板
  const handleMouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(true);
  };

  // 鼠标离开触发器或面板
  const handleMouseLeave = () => {
    const id = setTimeout(() => {
      setIsVisible(false);
    }, delay);
    setTimeoutId(id);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  // 根据动画类型生成对应的样式类
  const getAnimationClasses = () => {
    const duration = `duration-${animationDuration}`;
    const baseClasses = `transition-all ease-out ${duration}`;
    
    switch (animationType) {
      case 'fade':
        return cn(
          baseClasses,
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        );
      case 'scale':
        return cn(
          baseClasses,
          isVisible 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95 pointer-events-none'
        );
      case 'slideDown':
        return cn(
          baseClasses,
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-2 pointer-events-none'
        );
      case 'slideUp':
        return cn(
          baseClasses,
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-2 pointer-events-none'
        );
      default:
        return cn(
          baseClasses,
          isVisible 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95 pointer-events-none'
        );
    }
  };

  return (
    <span className="relative inline-block">
      {/* 触发器 */}
      <span
        className={triggerClassName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {trigger}
      </span>

      {/* 操作面板 */}
      <div
        className={cn(panelClassName, getAnimationClasses())}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </span>
  );
}


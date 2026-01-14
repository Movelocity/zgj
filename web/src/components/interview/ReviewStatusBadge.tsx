/**
 * Review Status Badge Component
 * Displays colored badge with icon for review status
 */

import { FiClock, FiRefreshCw, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import type { ReviewStatus } from '@/types/interview';

interface ReviewStatusBadgeProps {
  status: ReviewStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const STATUS_CONFIG: Record<ReviewStatus, StatusConfig> = {
  pending: {
    label: '待处理',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: <FiClock className="inline-block" />,
  },
  transcribing: {
    label: '识别中',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: <FiRefreshCw className="inline-block animate-spin" />,
  },
  analyzing: {
    label: '分析中',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: <FiRefreshCw className="inline-block animate-spin" />,
  },
  completed: {
    label: '已完成',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: <FiCheck className="inline-block" />,
  },
  failed: {
    label: '失败',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: <FiX className="inline-block" />,
  },
  timeout: {
    label: '超时',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: <FiAlertCircle className="inline-block" />,
  },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const ReviewStatusBadge: React.FC<ReviewStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${config.color} ${config.bgColor} ${SIZE_CLASSES[size]}
      `}
      role="status"
      aria-label={`状态: ${config.label}`}
    >
      {showIcon && <span className="w-4 h-4">{config.icon}</span>}
      {config.label}
    </span>
  );
};

export default ReviewStatusBadge;

import React, { useEffect, useState } from 'react';
import { getMyCredits } from '@/api/billing';
import { showError } from '@/utils/toast';

interface CreditsDisplayProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * 积分显示组件
 * 用于在页面头部或其他位置显示用户当前积分
 */
const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ className = '', showLabel = true }) => {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      setLoading(true);
      const response = await getMyCredits();
      if (response.code === 0) {
        setCredits(response.data.total_credits);
      } else {
        showError('加载积分失败');
      }
    } catch (error) {
      console.error('加载积分失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {showLabel && <span className="text-sm text-gray-600">积分:</span>}
        <span className="text-sm text-gray-400">加载中...</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showLabel && <span className="text-sm text-gray-600">我的积分:</span>}
      <span className="text-lg font-semibold text-blue-600">
        {credits !== null ? credits : '-'}
      </span>
      <button
        onClick={loadCredits}
        className="text-xs text-gray-500 hover:text-gray-700"
        title="刷新积分"
      >
        ↻
      </button>
    </div>
  );
};

export default CreditsDisplay;


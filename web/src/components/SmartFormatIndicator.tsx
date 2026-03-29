import { Loader2 } from 'lucide-react';

interface Props {
  visible: boolean;
}

/**
 * 固定在页面顶部的简历格式化等待提示。
 * 不阻断用户交互（pointer-events-none）。
 */
export default function SmartFormatIndicator({ visible }: Props) {
  if (!visible) return null;
  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-1.5 text-sm text-gray-500 pointer-events-none select-none">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" />
      <span>正在整理简历修改…</span>
    </div>
  );
}

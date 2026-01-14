/**
 * ASR Result Viewer Component
 * Displays ASR transcription result with collapsible JSON viewer
 */

import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Button } from '@/components/ui';

interface ASRResultViewerProps {
  asrResult: any;
  defaultCollapsed?: boolean;
}

export const ASRResultViewer: React.FC<ASRResultViewerProps> = ({
  asrResult,
  defaultCollapsed = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showFullContent, setShowFullContent] = useState(false);

  if (!asrResult) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-gray-500 text-sm">暂无语音识别结果</p>
      </div>
    );
  }

  const jsonString = JSON.stringify(asrResult, null, 2);
  const lines = jsonString.split('\n');
  const displayLines = showFullContent ? lines : lines.slice(0, 50);
  const hasMore = lines.length > 50;

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="font-medium text-gray-900">语音识别结果</h3>
        <button
          className="text-gray-600 hover:text-gray-900"
          aria-label={isCollapsed ? '展开' : '收起'}
        >
          {isCollapsed ? <FiChevronDown className="w-5 h-5" /> : <FiChevronUp className="w-5 h-5" />}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4">
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
            <code>{displayLines.join('\n')}</code>
          </pre>

          {hasMore && !showFullContent && (
            <div className="mt-3 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullContent(true)}
              >
                显示更多 ({lines.length - 50} 行)
              </Button>
            </div>
          )}

          {showFullContent && hasMore && (
            <div className="mt-3 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullContent(false)}
              >
                收起
              </Button>
            </div>
          )}

          {/* Copy to Clipboard Button */}
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(jsonString);
                // Could add a toast notification here
              }}
            >
              复制到剪贴板
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ASRResultViewer;

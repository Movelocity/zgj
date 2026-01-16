/**
 * ASR Result Viewer Component
 * Displays ASR transcription result with editable utterances
 * Each utterance is displayed as a line with line number and can be edited
 */

import { useState, useEffect, useCallback } from 'react';
import { FiChevronDown, FiChevronUp, FiSave, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui';

interface Utterance {
  text: string;
  words?: any[];
  start_time?: number;
  end_time?: number;
}

interface ASRResult {
  result?: {
    text?: string;
    additions?: {
      duration?: string;
    };
    utterances?: Utterance[];
  };
  segments?: any[];
}

interface ASRResultViewerProps {
  asrResult: ASRResult;
  defaultCollapsed?: boolean;
  /** Initial speech text (from metadata.speech) */
  initialSpeech?: string;
  /** Callback when speech is saved */
  onSave?: (speech: string) => Promise<void>;
  /** Whether editing is enabled */
  editable?: boolean;
}

export const ASRResultViewer: React.FC<ASRResultViewerProps> = ({
  asrResult,
  defaultCollapsed = true,
  initialSpeech,
  onSave,
  editable = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [lines, setLines] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Extract utterances from ASR result
  const utterances = asrResult?.result?.utterances || [];
  
  // Initialize lines from initialSpeech (string) or utterances
  useEffect(() => {
    if (initialSpeech && initialSpeech.length > 0) {
      // Parse string to lines (split by newlines, filter empty)
      setLines(initialSpeech.split('\n').filter(l => l.trim()));
    } else if (utterances.length > 0) {
      setLines(utterances.map(u => u.text));
    }
  }, []);

  // Track changes
  const originalLines = useCallback(() => {
    if (initialSpeech && initialSpeech.length > 0) {
      return initialSpeech.split('\n').filter(l => l.trim());
    }
    return utterances.map(u => u.text);
  }, [initialSpeech, utterances]);

  useEffect(() => {
    const original = originalLines();
    const changed = lines.length !== original.length || 
      lines.some((line, i) => line !== original[i]);
    setHasChanges(changed);
  }, [lines, originalLines]);

  if (!asrResult) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-gray-500 text-sm">暂无语音识别结果</p>
      </div>
    );
  }

  const handleStartEdit = (index: number) => {
    if (!editable) return;
    setEditingLine(index);
    setEditValue(lines[index]);
  };

  const handleCancelEdit = () => {
    setEditingLine(null);
    setEditValue('');
  };

  const handleConfirmEdit = () => {
    if (editingLine === null) return;
    const newLines = [...lines];
    newLines[editingLine] = editValue;
    setLines(newLines);
    setEditingLine(null);
    setEditValue('');
  };

  const handleSave = async () => {
    if (!onSave || !hasChanges) return;
    setSaving(true);
    try {
      // Join lines into a single string
      await onSave(lines.join('\n'));
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Get duration in readable format
  const duration = asrResult?.result?.additions?.duration;
  const durationSeconds = duration ? Math.round(parseInt(duration) / 1000) : 0;
  const durationMinutes = Math.floor(durationSeconds / 60);
  const durationRemainder = durationSeconds % 60;

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">语音识别结果</h3>
          {duration && (
            <span className="text-xs text-gray-500">
              时长: {durationMinutes}分{durationRemainder}秒
            </span>
          )}
          {lines.length > 0 && (
            <span className="text-xs text-gray-500">
              {lines.length} 行
            </span>
          )}
          {hasChanges && (
            <span className="text-xs text-orange-500 font-medium">
              (有未保存的修改)
            </span>
          )}
        </div>
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
          {lines.length > 0 ? (
            <>
              {/* Editable Lines */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {lines.map((line, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-100 transition-colors ${
                        editingLine === index ? 'bg-blue-50' : ''
                      }`}
                    >
                      {/* Line Number */}
                      <span className="flex-shrink-0 w-8 text-right text-xs text-gray-400 font-mono pt-1 select-none">
                        {index + 1}
                      </span>
                      
                      {/* Content */}
                      {editingLine === index ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={handleConfirmEdit}
                            className="p-1 text-green-600 hover:text-green-700"
                            title="确认"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-600 hover:text-red-700"
                            title="取消"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`flex-1 text-sm text-gray-800 ${editable ? 'cursor-pointer' : ''}`}
                          onClick={() => handleStartEdit(index)}
                        >
                          {line}
                          {editable && (
                            <FiEdit2 className="inline-block ml-2 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex justify-end items-center">
                {/* <div className="text-xs text-gray-500">
                  {editable && '点击文本行可编辑内容'}
                </div> */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(lines.join('\n'));
                    }}
                  >
                    复制
                  </Button>
                  {onSave && editable && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                    >
                      {saving ? (
                        '保存中...'
                      ) : (
                        <>
                          <FiSave className="mr-1 w-4 h-4" />
                          保存修改
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>未检测到语音内容</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ASRResultViewer;

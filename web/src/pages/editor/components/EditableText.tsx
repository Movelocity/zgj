import { useState, useRef, useEffect } from 'react';
import { useHover } from '@/utils/hover';
import Button from "@/components/ui/Button";
import cn from 'classnames';
import type { EditorState } from './useEditing';

// EditableText component with AI optimization support
export const EditableText = ({ 
  editorState,
  fieldId, 
  value, 
  multiline = false,
  placeholder = '点击编辑',
  className = '',
  blockIndex,
  itemId,
  field
}: { 
  editorState: EditorState;
  fieldId: string; 
  value: string; 
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  blockIndex?: number;
  itemId?: string;
  field?: string;
}) => {
  const { editingField, editingValueRef, startEditing, saveEdit, cancelEdit, getNewValue, acceptUpdate, clearNewValue } = editorState;
  const isCurrentlyEditing = editingField === fieldId;
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get new content from newResumeData
  const newValue = blockIndex !== undefined ? getNewValue(blockIndex, itemId, field) : '';
  const hasNewContent = newValue && newValue !== value;
  
  // State: showing original or new content
  const [showingOriginal, setShowingOriginal] = useState(false);
  
  // Current display value
  const currentDisplayValue = hasNewContent ? (showingOriginal ? value : newValue) : value;

  const { isHoverOpen, handleMouseEnter, handleMouseLeave } = useHover()
  
  // Auto-resize textarea to fit content
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight to fit content
    textarea.style.height = `${textarea.scrollHeight}px`;
  };
  
  // Adjust height when textarea is mounted or content changes
  useEffect(() => {
    if (isCurrentlyEditing && multiline && textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [isCurrentlyEditing, multiline]);
  
  // Accept update
  const handleAcceptUpdate = () => {
    if (blockIndex !== undefined) {
      acceptUpdate(blockIndex, itemId, field);
      clearNewValue(blockIndex, itemId, field);
    }
  };
  
  // Reject update
  const handleRejectUpdate = () => {
    if (blockIndex !== undefined) {
      clearNewValue(blockIndex, itemId, field);
    }
  };
  
  // Editing mode
  if (isCurrentlyEditing) {
    return (
      <div className="flex items-start relative">
        {multiline ? (
          <textarea
            ref={textareaRef}
            defaultValue={editingValueRef.current}
            className="flex-1 min-h-20 p-2 resize-none outline-none bg-gray-100 rounded overflow-hidden"
            autoFocus
            onInput={(e) => {
              adjustTextareaHeight(e.currentTarget);
            }}
          />
        ) : (
          <input
            ref={inputRef}
            defaultValue={editingValueRef.current}
            className="flex-1 h-8 px-2 focus:outline-none outline-none bg-gray-100 rounded"
            autoFocus
          />
        )}
        <div className="absolute top-full right-0 bg-white border border-gray-200 rounded-md shadow-lg whitespace-nowrap z-20 flex items-center p-1 gap-1 mt-1">
          <Button 
            size="xs2" 
            variant="none"
            className="bg-green-100 hover:bg-green-200 rounded text-green-700"
            onClick={() => {
              const element = multiline ? textareaRef.current : inputRef.current;
              if (element) saveEdit(fieldId, element);
            }}
          >
            确定
          </Button>
          <Button 
            size="xs2" 
            variant="none" 
            className="bg-red-100 hover:bg-red-200 rounded text-red-700" 
            onClick={cancelEdit}
          >
            取消
          </Button>
        </div>
      </div>
    );
  }

  const content = currentDisplayValue || placeholder;
  const baseClasses = multiline ? 'min-h-[2rem] block' : 'min-h-[1.5rem] inline-block';

  // Display with new content (AI optimized)
  if (hasNewContent) {
    return (
      <div 
        className={cn(
          'cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors relative',
          baseClasses, 
          className, 
          !currentDisplayValue ? 'text-gray-400 italic' : '',
          'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100/80'
        )}
        onClick={() => startEditing(fieldId, currentDisplayValue)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {content}

        {/* Action buttons */}
        <div 
          className={cn(
            "transition-opacity whitespace-nowrap z-20 flex items-center p-1 gap-1",
            "absolute bg-white border border-gray-200 rounded-md shadow-lg",
            isHoverOpen ? "opacity-100" : "opacity-0",
            multiline? "top-full right-0" : "top-0 left-full"
          )}
        >
          {/* Toggle button */}
          <Button
            variant="none"
            onClick={(e) => {
              e.stopPropagation();
              setShowingOriginal(!showingOriginal);
            }}
            size="xs2"
            className="bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            title={showingOriginal ? "查看AI优化版本" : "查看原始版本"}
          >
            {showingOriginal ? "查看新版" : "查看原版"}
          </Button>
          
          {/* Accept button */}
          <Button
            variant="none"
            onClick={(e) => {
              e.stopPropagation();
              handleAcceptUpdate();
            }}
            size="xs2"
            className="bg-green-100 hover:bg-green-200 rounded text-green-700"
            title="接收AI优化版本"
          >
            接收
          </Button>
          
          {/* Reject button */}
          <Button
            variant="none"
            onClick={(e) => {
              e.stopPropagation();
              handleRejectUpdate();
            }}
            size="xs2"
            className="bg-red-100 hover:bg-red-200 rounded text-red-700 transition-colors"
            title="保留原版本"
          >
            拒绝
          </Button>
        </div>
      </div>
    );
  }
  
  // Normal display without new content
  return (
    <span 
      className={cn(
        'cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors',
        baseClasses, 
        className, 
        !value ? 'text-gray-400 italic' : ''
      )}
      style={{lineHeight: '1.2'}}
      onClick={() => startEditing(fieldId, value)}
    >
      {content}
    </span>
  );
};
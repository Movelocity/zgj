import { useState, useRef, useEffect } from 'react';
import { useHover } from '@/utils/hover';
import cn from 'classnames';
import ReactMarkdown from 'react-markdown';
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
  const { editingField, editingValueRef, startEditing, saveEdit, getNewValue, acceptUpdate, clearNewValue } = editorState;
  const isCurrentlyEditing = editingField === fieldId;
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ignoreBlurRef = useRef(false);
  
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
      // acceptUpdate 会同时更新 resumeData 和清除 newResumeData 中的对应字段
      acceptUpdate(blockIndex, itemId, field);
      // 重置显示状态
      setShowingOriginal(false);
    }
  };
  
  // Reject update
  const handleRejectUpdate = () => {
    if (blockIndex !== undefined) {
      // 清除 newResumeData 中的对应字段，避免编辑时重新识别
      clearNewValue(blockIndex, itemId, field);
      // 重置显示状态
      setShowingOriginal(false);
    }
  };
  
  // Handle blur event to save edit
  const handleBlur = () => {
    // Delay blur handling to allow button clicks to process first
    setTimeout(() => {
      // Ignore blur if button was clicked
      if (ignoreBlurRef.current) {
        ignoreBlurRef.current = false;
        return;
      }
      const element = multiline ? textareaRef.current : inputRef.current;
      if (element && isCurrentlyEditing) {
        saveEdit(fieldId, element);
      }
    }, 0);
  };

  // Editing mode
  if (isCurrentlyEditing) {
    return (
      <div className="flex items-start relative">
        {multiline ? (
          <textarea
            ref={textareaRef}
            defaultValue={editingValueRef.current}
            className="flex-1 min-h-20 px-1 py-0.5 resize-none outline-none bg-gray-100 rounded overflow-hidden"
            autoFocus
            onInput={(e) => {
              adjustTextareaHeight(e.currentTarget);
            }}
            onBlur={handleBlur}
          />
        ) : (
          <input
            ref={inputRef}
            defaultValue={editingValueRef.current}
            className="flex-1 h-8 px-2 focus:outline-none outline-none bg-gray-100 rounded"
            autoFocus
            onBlur={handleBlur}
          />
        )}
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
        // onClick={() => startEditing(fieldId, currentDisplayValue)} 不允许点击编辑
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowingOriginal(!showingOriginal);
            }}
            className="bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-sm px-1 cursor-pointer"
            title={showingOriginal ? "查看AI优化版本" : "查看原始版本"}
          >
            {showingOriginal ? "查看新版" : "查看原版"}
          </button>
          
          {/* Accept button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAcceptUpdate();
            }}
            className="bg-green-100 hover:bg-green-200 rounded text-green-700 text-sm px-1 cursor-pointer"
            title="接收AI优化版本"
          >
            接收
          </button>
          
          {/* Reject button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRejectUpdate();
            }}
            className="bg-red-100 hover:bg-red-200 rounded text-red-700 text-sm px-1 transition-colors cursor-pointer"
            title="保留原版本"
          >
            拒绝
          </button>
        </div>
      </div>
    );
  }
  
  // Normal display without new content
  return (
    <div 
      className={cn(
        'cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors',
        baseClasses, 
        className, 
        !value ? 'text-gray-400 italic' : ''
      )}
      onClick={() => startEditing(fieldId, value)}
    >
      {value ? (
        <ReactMarkdown
          components={{
            p: ({ children, ...props }) => (
              <p className="inline" {...props}>{children}</p>
            ),
            strong: ({ children, ...props }) => (
              <strong className="font-semibold" {...props}>{children}</strong>
            ),
            em: ({ children, ...props }) => (
              <em className="italic" {...props}>{children}</em>
            ),
            ul: ({ children, ...props }) => (
              <ul className="list-disc list-inside" {...props}>{children}</ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal list-inside" {...props}>{children}</ol>
            ),
            li: ({ children, ...props }) => (
              <li className="" {...props}>{children}</li>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <span>{content}</span>
      )}
    </div>
  );
};
import { useRef, useEffect } from 'react';
import { useHover } from '@/utils/hover';
import cn from 'classnames';
import ReactMarkdown from 'react-markdown';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  
  // Current display value
  const currentDisplayValue = hasNewContent ? newValue : value;

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
    }
  };
  
  // Reject update
  const handleRejectUpdate = () => {
    if (blockIndex !== undefined) {
      // 清除 newResumeData 中的对应字段，避免编辑时重新识别
      clearNewValue(blockIndex, itemId, field);
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
  const baseClasses = multiline ? 'min-h-[2rem] flex flex-col' : 'min-h-[1.5rem] inline-block';

  // Display with new content (AI optimized)
  if (hasNewContent) {
    return (
      <div 
        className={cn(
          'relative cursor-default transition-colors',
          baseClasses, 
          className, 
          !currentDisplayValue ? 'text-muted-foreground italic' : ''
        )}
        // onClick={() => startEditing(fieldId, currentDisplayValue)} 不允许点击编辑
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Card
          className={cn(
            'relative gap-3 overflow-hidden rounded-lg border-border/80 bg-background/95 py-3 shadow-sm',
            'bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklab,var(--muted-foreground)_18%,transparent)_1px,transparent_0),linear-gradient(color-mix(in_oklab,var(--border)_38%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklab,var(--border)_38%,transparent)_1px,transparent_1px)]',
            'bg-[length:12px_12px,24px_24px,24px_24px]'
          )}
        >
          <CardHeader className="gap-1 px-3">
            <CardTitle className="text-xs">AI 修改建议</CardTitle>
            <CardDescription className="text-xs">确认后应用到简历</CardDescription>
            <CardAction
              className={cn(
                'flex items-center gap-1 rounded-md border bg-background/95 p-1 shadow-sm transition-opacity',
                isHoverOpen ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcceptUpdate();
                }}
                title="接收AI优化版本"
              >
                <Check data-icon="inline-start" />
                接收
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRejectUpdate();
                }}
                title="保留原版本"
              >
                <X data-icon="inline-start" />
                拒绝
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent className="flex flex-col gap-3 px-3">
            <div className="rounded-md border bg-background/85 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary">原始内容</Badge>
              </div>
              <div className="whitespace-pre-wrap break-words text-muted-foreground">{value || placeholder}</div>
            </div>

            <Separator />

            <div className="rounded-md border bg-card/95 p-3 shadow-xs">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="default">修改内容</Badge>
              </div>
              <div className="whitespace-pre-wrap break-words text-card-foreground">{content}</div>
            </div>
          </CardContent>
        </Card>
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
              <p className="whitespace-pre-wrap" {...props}>{children}</p>
            ),
            strong: ({ children, ...props }) => (
              <strong className="font-semibold" {...props}>{children}</strong>
            ),
            em: ({ children, ...props }) => (
              <em className="italic" {...props}>{children}</em>
            ),
            ul: ({ children, ...props }) => (
              <ul className="list-disc list-inside flex flex-col" {...props}>{children}</ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal list-inside flex flex-col" {...props}>{children}</ol>
            ),
            li: ({ children, ...props }) => (
              <li className="" {...props}>{children}</li>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote className="flex flex-col border-l-2 border-l-gray-200 pl-2" {...props}>{children}</blockquote>
            )
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

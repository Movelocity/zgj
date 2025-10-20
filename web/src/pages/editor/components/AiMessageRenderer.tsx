import { useEffect, useRef, useState } from 'react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { FiFileText, FiCheckSquare } from 'react-icons/fi';
import { generateHash } from '@/utils/hash';

interface AiMessageRendererProps {
  content: string;
  messageId: string;
  className?: string;
}

interface ResumeUpdateBlock {
  id: string;
  content: string;
  status: 'updating' | 'completed';
}

/**
 * AI消息渲染器
 * 支持特殊的resume-update代码块渲染和事件触发
 */
export default function AiMessageRenderer({ 
  content, 
  messageId,
  className 
}: AiMessageRendererProps) {
  const [processedContent, setProcessedContent] = useState<string>('');
  const [updateBlocks, setUpdateBlocks] = useState<ResumeUpdateBlock[]>([]);
  const lastProcessedRef = useRef<string>('');

  useEffect(() => {
    // 避免重复处理相同内容
    if (content === lastProcessedRef.current) {
      return;
    }
    lastProcessedRef.current = content;

    const lines = content.split('\n');
    let newContent = '';
    let inResumeUpdateBlock = false;
    let currentBlockContent = '';
    let currentBlockStartLine = -1;
    const newUpdateBlocks: ResumeUpdateBlock[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '```resume-update') {
        // 开始resume-update块
        inResumeUpdateBlock = true;
        currentBlockContent = '';
        currentBlockStartLine = i;
        // 不在这里添加占位符，等到block结束时再添加
        continue;
      }
      
      if (inResumeUpdateBlock && line.trim() === '```') {
        // 结束resume-update块
        inResumeUpdateBlock = false;
        // 使用位置生成稳定的 blockId（不依赖内容，确保更新中和完成时ID一致）
        const blockId = generateHash(`${messageId}-block-${currentBlockStartLine}`);
        
        newUpdateBlocks.push({
          id: blockId,
          content: currentBlockContent,
          status: 'completed'
        });

        // 在block结束时添加占位符
        newContent += `\n__RESUME_UPDATE_BLOCK_${newUpdateBlocks.length - 1}__\n`;

        // 触发自定义事件，传递简历更新内容
        const event = new CustomEvent('resume-update-detected', {
          detail: {
            blockId,
            content: currentBlockContent,
            messageId
          }
        });
        window.dispatchEvent(event);
        
        currentBlockContent = '';
        currentBlockStartLine = -1;
        continue;
      }
      
      if (inResumeUpdateBlock) {
        // 收集resume-update块的内容
        currentBlockContent += (currentBlockContent ? '\n' : '') + line;
      } else {
        // 正常内容
        newContent += line + '\n';
      }
    }

    // 如果还有未结束的块（正在更新中）
    if (inResumeUpdateBlock) {
      // 使用位置生成稳定的 blockId（与完成状态使用相同的ID生成方式）
      const blockId = generateHash(`${messageId}-block-${currentBlockStartLine}`);
      newUpdateBlocks.push({
        id: blockId,
        content: currentBlockContent,
        status: 'updating'
      });
      newContent += `\n__RESUME_UPDATE_BLOCK_${newUpdateBlocks.length - 1}__\n`;
    }

    setProcessedContent(newContent);
    setUpdateBlocks(newUpdateBlocks);
  }, [content, messageId]);

  // 渲染处理后的内容，替换占位符为实际组件
  const renderContent = () => {
    const parts = processedContent.split(/(__RESUME_UPDATE_BLOCK_\d+__)/);
    
    return parts.map((part, index) => {
      const match = part.match(/__RESUME_UPDATE_BLOCK_(\d+)__/);
      if (match) {
        const blockIndex = parseInt(match[1]);
        const block = updateBlocks[blockIndex];
        
        if (!block) return null;

        return (
          <div 
            key={`block-${index}`}
            className="my-3 px-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {block.status === 'completed' ? (
                    <FiCheckSquare className="w-5 h-5 text-blue-600" />
                  ) : ( <FiFileText 
                    className={`w-5 h-5 text-blue-600 ${
                      block.status === 'updating' ? 'animate-pulse' : ''
                    }`} 
                  />)}
                  {block.status === 'updating' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900">
                    {block.status === 'updating' ? '解析中' : '已应用到编辑区'}
                  </h4>
                </div>
                
              </div>
              <div className="text-xs pt-1">{block.content}</div>
            </div>
          </div>
        );
      }
      
      // 正常的markdown内容
      return part ? (
        <MarkdownRenderer 
          key={`text-${index}`}
          content={part} 
          className={className}
        />
      ) : null;
    });
  };

  return <div className="w-full">{renderContent()}</div>;
}


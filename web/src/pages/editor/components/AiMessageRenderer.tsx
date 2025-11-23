import { useEffect, useRef, useState } from 'react';
import MarkdownRenderer from '@/components/ui/Markdown';
import { FiFileText, FiCheckSquare } from 'react-icons/fi';
import { generateHash } from '@/utils/hash';
import { parseAndFixResumeJson } from '@/utils/helpers';
import { workflowAPI } from '@/api/workflow';
import type { ResumeV2Data } from '@/types/resumeV2';

interface AiMessageRendererProps {
  content: string;
  messageId: string;
  className?: string;
  resumeData: ResumeV2Data;
}

interface ResumeUpdateBlock {
  id: string;
  content: string;
  status: 'parsing' | 'formatting' | 'completed';
}

/**
 * AI消息渲染器
 * 支持特殊的resume-update代码块渲染和事件触发
 */
export default function AiMessageRenderer({ 
  content, 
  messageId,
  className,
  resumeData
}: AiMessageRendererProps) {
  const [processedContent, setProcessedContent] = useState<string>('');
  const [updateBlocks, setUpdateBlocks] = useState<ResumeUpdateBlock[]>([]);
  const lastProcessedRef = useRef<string>('');
  // 用于追踪每个块的状态，key 是 blockId，value 是状态信息
  const blockStatesRef = useRef<Map<string, ResumeUpdateBlock>>(new Map());

  /**
   * 格式化处理：当 JSON 解析失败时，调用格式化 API 进行解析
   * 优化：直接更新 Map 中的状态，避免复杂的 state 更新
   */
  const formatBlock = async (blockId: string, content: string): Promise<void> => {
    try {
      console.log(`[Resume Update] 开始格式化块 ${blockId}...`);

      // 调用格式化 API
      const uploadData = {
        current_resume: JSON.stringify(resumeData),
        resume_edit: content
      };
      
      const structuredResumeResult = await workflowAPI.executeWorkflow("smart-format-2", uploadData, true);
      
      if (structuredResumeResult.code !== 0) {
        console.error('[Resume Update] 格式化失败:', structuredResumeResult.data.message);
        return;
      }

      const structuredResumeData = structuredResumeResult.data.data.outputs?.output;
      console.log('[Resume Update] 格式化成功:', structuredResumeData);

      if (structuredResumeData && typeof structuredResumeData === 'string') {
        // 使用 parseAndFixResumeJson 确保数据安全性和格式正确性
        const finalResumeData = parseAndFixResumeJson(structuredResumeData as string);
        
        // 更新块状态为 completed
        const blockState = blockStatesRef.current.get(blockId);
        if (blockState) {
          blockState.status = 'completed';
          blockStatesRef.current.set(blockId, blockState);
          
          // 触发 state 更新以重新渲染
          setUpdateBlocks(prev => 
            prev.map(block => 
              block.id === blockId 
                ? { ...block, status: 'completed' }
                : block
            )
          );
        }

        // 触发格式化完成事件
        const event = new CustomEvent('resume-update-formatted', {
          detail: {
            blockId,
            data: finalResumeData,
            messageId
          }
        });
        window.dispatchEvent(event);
        
        console.log(`[Resume Update] 格式化块 ${blockId} 完成，已触发事件`);
      }
    } catch (error) {
      console.error('[Resume Update] 格式化过程出错:', error);
      // 格式化失败，标记为 completed 避免卡住
      const blockState = blockStatesRef.current.get(blockId);
      if (blockState) {
        blockState.status = 'completed';
        blockStatesRef.current.set(blockId, blockState);
        setUpdateBlocks(prev => 
          prev.map(block => 
            block.id === blockId 
              ? { ...block, status: 'completed' }
              : block
          )
        );
      }
    }
  };

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
        continue;
      }
      
      if (inResumeUpdateBlock && line.trim() === '```') {
        // 结束resume-update块
        inResumeUpdateBlock = false;
        // 使用位置生成稳定的 blockId
        const blockId = generateHash(`${messageId}-block-${currentBlockStartLine}`);
        
        // 检查该块是否已存在
        const existingBlock = blockStatesRef.current.get(blockId);
        
        // 如果块已存在且状态不是 parsing，说明已经处理过（正在格式化或已完成）
        // 这种情况下保持其当前状态，避免覆盖正在进行的格式化
        if (existingBlock && existingBlock.status !== 'parsing') {
          newUpdateBlocks.push(existingBlock);
        } else {
          // 块不存在，或者存在但还在 parsing 状态（流式传输刚结束，需要处理）
          // 尝试解析 JSON
          let blockStatus: 'parsing' | 'formatting' | 'completed' = 'parsing';
          let needsFormatting = false;
          
          try {
            const resumeUpdateData = parseAndFixResumeJson(currentBlockContent);
            
            if (resumeUpdateData.blocks && resumeUpdateData.blocks.length > 0) {
              // 解析成功
              blockStatus = 'completed';
              
              // 触发标准事件
              const event = new CustomEvent('resume-update-detected', {
                detail: {
                  blockId,
                  content: currentBlockContent,
                  data: resumeUpdateData,
                  messageId
                }
              });
              window.dispatchEvent(event);
              console.log(`[Resume Update] 块 ${blockId} 解析成功，已触发标准事件`);
            } else if (currentBlockContent.trim().length > 0) {
              // 解析失败但内容不为空，需要格式化
              blockStatus = 'formatting';
              needsFormatting = true;
              console.log(`[Resume Update] 块 ${blockId} 解析失败，需要格式化`);
            }
          } catch (error) {
            console.error(`[Resume Update] 块 ${blockId} 解析出错:`, error);
            // 解析出错，需要格式化
            if (currentBlockContent.trim().length > 0) {
              blockStatus = 'formatting';
              needsFormatting = true;
              console.log(`[Resume Update] 块 ${blockId} 出错后需要格式化`);
            }
          }
          
          // 创建或更新块
          const newBlock: ResumeUpdateBlock = {
            id: blockId,
            content: currentBlockContent,
            status: blockStatus
          };
          
          // 保存到 Map 中
          blockStatesRef.current.set(blockId, newBlock);
          newUpdateBlocks.push(newBlock);
          
          // 如果需要格式化，立即触发（非阻塞）
          if (needsFormatting) {
            formatBlock(blockId, currentBlockContent);
          }
        }

        // 添加占位符
        newContent += `\n__RESUME_UPDATE_BLOCK_${newUpdateBlocks.length - 1}__\n`;
        
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

    // 如果还有未结束的块（正在流式传输中）
    if (inResumeUpdateBlock) {
      const blockId = generateHash(`${messageId}-block-${currentBlockStartLine}`);
      
      // 检查是否已存在（可能是上次处理时就在流式传输）
      const existingBlock = blockStatesRef.current.get(blockId);
      
      if (existingBlock) {
        // 更新内容但保持状态
        existingBlock.content = currentBlockContent;
        newUpdateBlocks.push(existingBlock);
      } else {
        // 新的流式块
        const newBlock: ResumeUpdateBlock = {
          id: blockId,
          content: currentBlockContent,
          status: 'parsing'
        };
        blockStatesRef.current.set(blockId, newBlock);
        newUpdateBlocks.push(newBlock);
      }
      
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-1 border-blue-100 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {block.status === 'completed' ? (
                    <FiCheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <FiFileText 
                      className={`w-5 h-5 text-blue-600 ${
                        block.status === 'parsing' || block.status === 'formatting' ? 'animate-pulse' : ''
                      }`} 
                    />
                  )}
                  {(block.status === 'parsing' || block.status === 'formatting') && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900">
                    {block.status === 'parsing' 
                      ? '解析中' 
                      : block.status === 'formatting' 
                        ? '正在应用...' 
                        : '已应用到编辑区'}
                  </h4>
                </div>
              </div>
              {/* 只在 parsing 或 formatting 时显示内容预览，completed 时不显示 */}
              {(block.status === 'parsing' || block.status === 'formatting') && (
                <div className="text-xs pt-2 text-gray-600 font-mono">
                  {block.content.slice(0, 100)}{block.content.length > 100 ? '...' : ''}
                </div>
              )}
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


import { useEffect, useRef, useState } from 'react';
import MarkdownRenderer from '@/components/ui/Markdown';
import { FiFileText, FiCheckSquare, FiPlus, FiEdit, FiStar, FiInfo, FiChevronDown, FiChevronUp, FiCheck, FiX } from 'react-icons/fi';
import { generateHash } from '@/utils/hash';
import { parseAndFixResumeJson } from '@/utils/helpers';
import { workflowAPI } from '@/api/workflow';
import type { ResumeData } from '@/types/resume';

interface AiMessageRendererProps {
  content: string;
  messageId: string;
  className?: string;
  resumeData: ResumeData;
  isHistorical?: boolean; // 是否为历史消息，历史消息不触发事件
  onQuestionClick?: (question: string) => void; // 当用户点击 DISPLAY marker 时触发，将问题传递到输入框
}

interface ResumeUpdateBlock {
  id: string;
  content: string;
  status: 'parsing' | 'formatting' | 'completed';
}

type ActionMarkerType = 'ADD_PART' | 'NEW_SECTION' | 'EDIT' | 'DISPLAY';

interface ActionMarker {
  id: string;
  type: ActionMarkerType;
  section: string;
  title: string | null;
  content?: string;
  regex?: string;
  replacement?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  isExpanded: boolean;
}

/**
 * ActionMarkerDisplay 组件
 * 渲染单个 action marker
 */
function ActionMarkerDisplay({ 
  marker, 
  isHistorical, 
  // messageId,
  onToggleExpand,
  onAccept,
  // onReject,
  onRetrigger,
  onQuestionClick
}: { 
  marker: ActionMarker; 
  isHistorical: boolean;
  messageId: string;
  onToggleExpand: (markerId: string) => void;
  onAccept: (marker: ActionMarker) => void;
  onReject: (marker: ActionMarker) => void;
  onRetrigger: (marker: ActionMarker) => void;
  onQuestionClick?: (question: string) => void;
}) {
  const getIcon = () => {
    switch (marker.type) {
      case 'ADD_PART': return <FiPlus className="w-4 h-4" />;
      case 'NEW_SECTION': return <FiStar className="w-4 h-4" />;
      case 'EDIT': return <FiEdit className="w-4 h-4" />;
      case 'DISPLAY': return <FiInfo className="w-4 h-4" />;
    }
  };

  const getTitle = () => {
    switch (marker.type) {
      case 'ADD_PART': return `添加内容到 ${marker.section}`;
      case 'NEW_SECTION': return `创建新板块：${marker.section}`;
      case 'EDIT': return `编辑 ${marker.section}`;
      case 'DISPLAY': return marker.message || '';
    }
  };

  const getCharCount = () => {
    if (marker.type === 'DISPLAY') return null;
    if (marker.type === 'EDIT') {
      return marker.replacement ? marker.replacement.length : 0;
    }
    return marker.content ? marker.content.length : 0;
  };

  const charCount = getCharCount();

  // DISPLAY markers have different styling
  if (marker.type === 'DISPLAY') {
    return (
      <div 
        className="inline-block ml-1 my-0.5 px-2 py-1 bg-blue-50 border border-blue-300 rounded-sm text-blue-700 text-xs cursor-pointer hover:bg-blue-100 hover:border-blue-400 transition-colors"
        onClick={() => {
          if (onQuestionClick && marker.message) {
            onQuestionClick(marker.message);
          }
        }}
      >
        <span>{marker.message}</span>
      </div>
    );
  }

  // Actionable markers (ADD_PART, NEW_SECTION, EDIT)
  const isActionable = marker.status === 'pending' && !isHistorical;

  return (
    <div className="w-full mb-3 border border-gray-300 rounded-md bg-gray-50 overflow-hidden transition-shadow duration-300">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer group"
        onClick={() => onToggleExpand(marker.id)}
      >
        <div className="flex items-center gap-1 flex-1">
          <div className="p-1 text-gray-600 group-hover:hidden">{getIcon()}</div>
          {/* Expand/Collapse button */}
          <span className="p-1 hidden group-hover:block">
            {marker.isExpanded ? (
              <FiChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <FiChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </span>
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-800">{getTitle()}</div>
            {/* {marker.title && marker.type !== 'NEW_SECTION' && (
              <div className="text-xs text-gray-500 mt-0.5">标题: {marker.title}</div>
            )} */}
          </div>
          {!marker.isExpanded && charCount !== null && (
            <div className="text-xs text-gray-500">
              {marker.type === 'EDIT' ? '' : '+'} {charCount} 字
            </div>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {marker.isExpanded && (
        <div className="p-2 bg-gray-50 border-t border-gray-200">
          {marker.type === 'ADD_PART' && (
            <div className="space-y-1 text-xs text-gray-600">
              <div>
                <span className="font-medium">标题:</span> {marker.title}
              </div>
              <div className="mt-0.5 p-2 bg-white border border-gray-200 rounded text-gray-700 whitespace-pre-wrap">
                {marker.content}
              </div>
            </div>
          )}
          {marker.type === 'NEW_SECTION' && (
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                <span className="font-medium">板块名称:</span> {marker.section}
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium">内容:</span>
                <div className="mt-1 p-2 bg-white border border-gray-200 rounded text-gray-700 whitespace-pre-wrap">
                  {marker.content}
                </div>
              </div>
            </div>
          )}
          {marker.type === 'EDIT' && (
            <div className="space-y-1">
              {/* <div className="text-xs text-gray-600">
                <span className="font-medium">板块:</span> {marker.section}
              </div> */}
              <div className="text-xs text-gray-600">
                {marker.title}
              </div>
              <div className="text-xs text-gray-600">
                {/* <span className="font-medium">匹配模式 (正则):</span> */}
                <div className="mt-1 p-2 bg-white border border-gray-200 rounded text-gray-700 font-mono text-xs">
                  {marker.regex}
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {/* <span className="font-medium">替换为:</span> */}
                <div className="mt-1 p-2 bg-white border border-gray-200 rounded text-gray-700 whitespace-pre-wrap">
                  {marker.replacement}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {marker.isExpanded || isActionable && (
        <div className="p-2 pt-1 flex items-center justify-end gap-2">
          {marker.status === 'accepted' && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <FiCheck className="w-4 h-4" />
              <span>已应用</span>
            </div>
          )}
          {marker.status === 'rejected' && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <FiX className="w-4 h-4" />
              <span>已忽略</span>
            </div>
          )}
          {isActionable && (
            <button
              onClick={() => onAccept(marker)}
              className="px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              更新到简历
            </button>
          )}
          {isHistorical && marker.isExpanded && (
            <button
              onClick={() => onRetrigger(marker)}
              className="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            >
              <span>更新到简历</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * AI消息渲染器
 * 支持特殊的resume-update代码块渲染和事件触发
 */
export default function AiMessageRenderer({ 
  content, 
  messageId,
  className,
  resumeData,
  isHistorical = false, // 默认为非历史消息
  onQuestionClick
}: AiMessageRendererProps) {
  const [processedContent, setProcessedContent] = useState<string>('');
  const [updateBlocks, setUpdateBlocks] = useState<ResumeUpdateBlock[]>([]);
  const [actionMarkers, setActionMarkers] = useState<ActionMarker[]>([]);
  const lastProcessedRef = useRef<string>('');
  // 用于追踪每个块的状态，key 是 blockId，value 是状态信息
  const blockStatesRef = useRef<Map<string, ResumeUpdateBlock>>(new Map());
  const markerStatesRef = useRef<Map<string, ActionMarker>>(new Map());

  /**
   * Toggle expand/collapse state of a marker
   */
  const handleToggleExpand = (markerId: string) => {
    setActionMarkers(prev => 
      prev.map(m => m.id === markerId ? { ...m, isExpanded: !m.isExpanded } : m)
    );
    // Update ref with a NEW object to avoid mutating the shared reference
    const marker = markerStatesRef.current.get(markerId);
    if (marker) {
      markerStatesRef.current.set(markerId, { ...marker, isExpanded: !marker.isExpanded });
    }
  };

  /**
   * Handle accept action
   */
  const handleAccept = (marker: ActionMarker) => {
    // Update marker status
    setActionMarkers(prev => 
      prev.map(m => m.id === marker.id ? { ...m, status: 'accepted' } : m)
    );
    const updatedMarker = markerStatesRef.current.get(marker.id);
    if (updatedMarker) {
      updatedMarker.status = 'accepted';
      markerStatesRef.current.set(marker.id, updatedMarker);
    }

    // Dispatch event
    const event = new CustomEvent('action-marker-accepted', {
      detail: {
        markerId: marker.id,
        type: marker.type,
        section: marker.section,
        title: marker.title,
        content: marker.content,
        regex: marker.regex,
        replacement: marker.replacement,
        messageId,
        isRetrigger: false
      }
    });
    window.dispatchEvent(event);
  };

  /**
   * Handle reject action
   */
  const handleReject = (marker: ActionMarker) => {
    // Update marker status
    setActionMarkers(prev => 
      prev.map(m => m.id === marker.id ? { ...m, status: 'rejected' } : m)
    );
    const updatedMarker = markerStatesRef.current.get(marker.id);
    if (updatedMarker) {
      updatedMarker.status = 'rejected';
      markerStatesRef.current.set(marker.id, updatedMarker);
    }

    // Dispatch event
    const event = new CustomEvent('action-marker-rejected', {
      detail: {
        markerId: marker.id,
        type: marker.type,
        messageId
      }
    });
    window.dispatchEvent(event);
  };

  /**
   * Handle retrigger (for historical markers)
   */
  const handleRetrigger = (marker: ActionMarker) => {
    // Dispatch event with isRetrigger flag
    const event = new CustomEvent('action-marker-accepted', {
      detail: {
        markerId: marker.id,
        type: marker.type,
        section: marker.section,
        title: marker.title,
        content: marker.content,
        regex: marker.regex,
        replacement: marker.replacement,
        messageId,
        isRetrigger: true
      }
    });
    window.dispatchEvent(event);
  };

  /**
   * 解析 action markers: [[ACTION:TYPE|param1|param2|param3|param4]]
   */
  const parseActionMarkers = (text: string): { markers: ActionMarker[], processedText: string } => {
    const markers: ActionMarker[] = [];
    const regex = /\[\[ACTION:(ADD_PART|NEW_SECTION|EDIT|DISPLAY)\|([^\]]+)\]\]/g;
    let processedText = text;
    let match;
    let markerIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      const type = match[1] as ActionMarkerType;
      const paramsString = match[2];
      
      // Split by pipe, but handle the last parameter greedily (it may contain content with special chars)
      const params = paramsString.split('|');
      
      let marker: ActionMarker | null = null;
      const markerId = generateHash(`${messageId}-marker-${match.index}`);

      // Check if marker already exists
      const existingMarker = markerStatesRef.current.get(markerId);
      if (existingMarker) {
        markers.push(existingMarker);
        processedText = processedText.replace(match[0], `__ACTION_MARKER_${markerIndex}__`);
        markerIndex++;
        continue;
      }

      if (type === 'DISPLAY') {
        // DISPLAY only has message parameter
        marker = {
          id: markerId,
          type: 'DISPLAY',
          section: '',
          title: null,
          message: params.join('|'), // Rejoin in case message contains pipes
          status: 'pending',
          isExpanded: false,
        };
      } else if (type === 'ADD_PART' && params.length >= 3) {
        marker = {
          id: markerId,
          type: 'ADD_PART',
          section: params[0],
          title: params[1],
          content: params.slice(2).join('|'), // Rejoin remaining as content
          status: 'pending',
          isExpanded: false,
        };
      } else if (type === 'NEW_SECTION' && params.length >= 3) {
        marker = {
          id: markerId,
          type: 'NEW_SECTION',
          section: params[0],
          title: params[1] === 'null' ? null : params[1],
          content: params.slice(2).join('|'),
          status: 'pending',
          isExpanded: false,
        };
      } else if (type === 'EDIT' && params.length >= 4) {
        marker = {
          id: markerId,
          type: 'EDIT',
          section: params[0],
          title: params[1],
          regex: params[2],
          replacement: params.slice(3).join('|'), // Rejoin remaining as replacement
          status: 'pending',
          isExpanded: false,
        };
      }

      if (marker) {
        markers.push(marker);
        markerStatesRef.current.set(markerId, marker);
        processedText = processedText.replace(match[0], `__ACTION_MARKER_${markerIndex}__`);
        markerIndex++;
      }
    }

    return { markers, processedText };
  };

  /**
   * 格式化处理：当 JSON 解析失败时，调用格式化 API 进行解析
   * 优化：直接更新 Map 中的状态，避免复杂的 state 更新
   */
  const formatBlock = async (blockId: string, content: string): Promise<void> => {
    // 历史消息不触发格式化
    if (isHistorical) {
      console.log(`[Resume Update] 块 ${blockId} 是历史消息，跳过格式化`);
      return;
    }
    
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

    // First, parse action markers from the entire content
    const { markers: parsedMarkers, processedText: textWithoutMarkers } = parseActionMarkers(content);

    const lines = textWithoutMarkers.split('\n');
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
              
              // 只有非历史消息才触发标准事件
              if (!isHistorical) {
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
              } else {
                console.log(`[Resume Update] 块 ${blockId} 是历史消息，跳过事件触发`);
              }
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
    setActionMarkers(parsedMarkers);
  }, [content, messageId]);

  // 渲染处理后的内容，替换占位符为实际组件
  const renderContent = () => {
    // Split by both resume update blocks and action markers
    const parts = processedContent.split(/(__RESUME_UPDATE_BLOCK_\d+__|__ACTION_MARKER_\d+__)/);
    
    return parts.map((part, index) => {
      // Check for resume update block
      const blockMatch = part.match(/__RESUME_UPDATE_BLOCK_(\d+)__/);
      if (blockMatch) {
        const blockIndex = parseInt(blockMatch[1]);
        const block = updateBlocks[blockIndex];
        
        if (!block) return null;

        // 历史消息不显示动画效果，直接显示为已完成
        if (isHistorical) {
          return (
            <div 
              key={`block-${index}`}
              className="my-3 px-4"
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-1 border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-3">
                  <FiCheckSquare className="w-5 h-5 text-gray-500" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-700">历史消息中的简历更新</h4>
                  </div>
                </div>
              </div>
            </div>
          );
        }

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
      
      // Check for action marker
      const markerMatch = part.match(/__ACTION_MARKER_(\d+)__/);
      if (markerMatch) {
        const markerIndex = parseInt(markerMatch[1]);
        const marker = actionMarkers[markerIndex];
        
        if (!marker) return null;

        return (
          <ActionMarkerDisplay
            key={`marker-${index}`}
            marker={marker}
            isHistorical={isHistorical}
            messageId={messageId}
            onToggleExpand={handleToggleExpand}
            onAccept={handleAccept}
            onReject={handleReject}
            onRetrigger={handleRetrigger}
            onQuestionClick={onQuestionClick}
          />
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


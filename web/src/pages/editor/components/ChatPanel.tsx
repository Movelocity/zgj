import { useState, useRef, useCallback, useEffect } from 'react';
import Button from '@/components/ui/Button';
import AiMessageRenderer from './AiMessageRenderer';
import { Send, Bot, Lightbulb, Sparkles } from 'lucide-react';
import { FiMessageSquare, FiFileText } from 'react-icons/fi';
// import type { ResumeData } from '@/types/resume';
import type { ResumeV2Data } from '@/types/resumeV2';
import { workflowAPI } from '@/api/workflow';
import { parseAndFixResumeJson } from '@/utils/helpers';
import { generateAIResponse, generateSuggestions, truncate } from './utils';
import Modal from '@/components/ui/Modal';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatPanelProps {
  resumeData:  ResumeV2Data;
  onResumeDataChange: (data: ResumeV2Data, require_commit: boolean) => void;
  initialMessages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
  isJD: boolean
}

// 导出Message接口供外部使用
export type { Message };

// TOOD: 消息内容 markdown 渲染

export default function ChatPanel({ 
  resumeData, 
  onResumeDataChange,
  initialMessages,
  onMessagesChange,
  isJD
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || [
    {
      id: '1',
      type: 'assistant',
      content: "您好，我是简历专家，您可以随时与我对话，我会根据您的需求进一步优化简历",
      timestamp: new Date(),
    }
  ]);
  const conversationIdRef = useRef('');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollGradientTopRef = useRef<HTMLDivElement>(null);
  const scrollGradientBottomRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  const lastScrollTop = useRef(0);
  const lastAbortScrollMessageId = useRef('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugType, setDebugType] = useState<'current_data' | 'last_msg'>('current_data');
  const [debugData, setDebugData] = useState('');
  
  // 用于去重的哈希表，存储已处理的 blockId
  const processedBlocksRef = useRef<Set<string>>(new Set());
  
  // 监听 messages 变化并通知父组件
  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  // 自动调整 textarea 高度，最大3行
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // 重置高度以获取正确的 scrollHeight
    textarea.style.height = 'auto';
    
    // 计算行高（假设为24px，可以根据实际情况调整）
    const lineHeight = 24;
    const maxRows = 3;
    const maxHeight = lineHeight * maxRows;
    
    // 设置新高度，不超过最大高度
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  // 监听 inputValue 变化，自动调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  // 监听 markdown 按钮点击事件
  useEffect(() => {
    const handleMarkdownButtonClick = (event: CustomEvent<{ text: string }>) => {
      const text = event.detail.text;
      setInputValue(text);
    };

    window.addEventListener('markdown-button-click' as any, handleMarkdownButtonClick);
    return () => {
      window.removeEventListener('markdown-button-click' as any, handleMarkdownButtonClick);
    };
  }, []);

  // 监听 resume-update-detected 事件（直接解析成功的情况）
  useEffect(() => {
    const handleResumeUpdate = (event: CustomEvent<{ blockId: string; content: string; data: ResumeV2Data; messageId: string }>) => {
      const { blockId, data } = event.detail;
      
      // 使用哈希表去重，防止重复处理
      if (processedBlocksRef.current.has(blockId)) {
        console.log(`[ChatPanel] 跳过重复的更新块: ${blockId}`);
        return;
      }
      
      // 标记为已处理
      processedBlocksRef.current.add(blockId);
      console.log(`[ChatPanel] 处理更新块: ${blockId}`, data);
      
      if (data && data.blocks && data.blocks.length > 0) {
        onResumeDataChange(data, true);
        console.log(`[ChatPanel] 简历数据已更新`);
      }
    };

    window.addEventListener('resume-update-detected' as any, handleResumeUpdate);
    return () => {
      window.removeEventListener('resume-update-detected' as any, handleResumeUpdate);
    };
  }, [onResumeDataChange]);

  // 监听 resume-update-formatted 事件（格式化后的情况）
  useEffect(() => {
    const handleResumeFormatted = (event: CustomEvent<{ blockId: string; data: ResumeV2Data; messageId: string }>) => {
      const { blockId, data } = event.detail;
      
      // 使用哈希表去重，防止重复处理
      if (processedBlocksRef.current.has(`formatted-${blockId}`)) {
        console.log(`[ChatPanel] 跳过重复的格式化块: ${blockId}`);
        return;
      }
      
      // 标记为已处理
      processedBlocksRef.current.add(`formatted-${blockId}`);
      console.log(`[ChatPanel] 处理格式化块: ${blockId}`, data);
      
      if (data && data.blocks && data.blocks.length > 0) {
        onResumeDataChange(data, true);
        console.log(`[ChatPanel] 格式化后的简历数据已更新`);
      }
    };

    window.addEventListener('resume-update-formatted' as any, handleResumeFormatted);
    return () => {
      window.removeEventListener('resume-update-formatted' as any, handleResumeFormatted);
    };
  }, [onResumeDataChange]);
  
  useEffect(() => {
    if (scrollRef.current) {
      const currentScrollTop = scrollRef.current.scrollTop;
      if (currentScrollTop < lastScrollTop.current) { 
        // 滚动进度不再单调递增，说明用户手动修改了滚动状态
        lastAbortScrollMessageId.current = messages[messages.length - 1].id;
        return;
      }
      // 继续自动滚动
      lastScrollTop.current = scrollRef.current.scrollTop;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const updateMessages = (message: Message) => {
    const msg = {...message} // 防止对象引用不变，无法更新state
    // console.log(`[${msg.id}] 更新消息: `, msg);
    // 按id过滤匹配，更新对应的消息
    setMessages(prev => {
      const matched = prev.find(m => m.id === msg.id);
      const newMessages = matched 
        ? prev.map(m => m.id === msg.id ? msg : m)
        : [...prev, msg];
      
      return newMessages;
    });
    if (msg.content) {
      setIsTyping(false);
    }
  };

  const handleSlashCommand = (command: string) => {
    command = command.replace("/", "");
    if (command === "print") {
      console.log("resumeData", JSON.stringify(resumeData, null, 2));
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "简历内容已答应到控制台，请查看",
        timestamp: new Date(),
      };
      updateMessages(aiResponse);
      setSuggestions(["什么是控制台？"]);
      return;
    }
    
    if (command === "clear") {
      setMessages([]);
      setIsTyping(false);
      return;
    }

    if (command === "error") {
      const testData = {
        "blocks": [
          {
            "title": "工作经历",
            "type": "list",
            "data": [
              {
                "id": "1",
                "name": 123,
                "description": [123],
                "time": "2021-01-0122",
                "highlight": "nothing"
              }
            ]
          }
        ]
      };
      // 测试错误捕获的流程
      onResumeDataChange(testData as any, true);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "测试错误捕获的流程",
        timestamp: new Date(),
      };
      updateMessages(aiResponse);
      throw new Error("测试错误捕获的流程");
    }
    
    if (command === "test"){
      // 模拟AI回复
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: generateAIResponse(command),
          timestamp: new Date(),
          suggestions: generateSuggestions(command)
        };
        updateMessages(aiResponse);
        setIsTyping(false);
      }, 500);
      return;
    }

    if (command === "last_msg") {
      const aiMessages = messages.filter(m => m.type === 'assistant');
      const lastMsg = aiMessages[aiMessages.length - 1];
      if (lastMsg) {
        setDebugData(lastMsg.content);
        setDebugType('last_msg');
        setDebugModalOpen(true);
      } else {
        console.log("没有找到AI消息");
      }
    }

    if (command === "peek") {
      setDebugType('current_data');
      setDebugData(JSON.stringify(resumeData, null, 2));
      setDebugModalOpen(true);
      return;
    }
  }

  const handleSendMessage = async (forceInput?: string) => {
    const query = forceInput ? forceInput : inputValue.trim();
    if (!query) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSuggestions([])
    
    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    if (isResponding || isFormatting) return;

    if (query.startsWith("/")) { // 处理斜杠命令
      handleSlashCommand(query);
      return;
    }

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: "",
      timestamp: new Date()
    };

    const onMessage = (data: any) => {
      console.debug('Received event:', data);

      // 处理不同类型的事件
      switch (data.event) {
        case 'workflow_started':
          
          console.log(`[${aiResponse.id}] 工作流启动`);
          break;
        
        case 'node_started':
          
          console.log(`[${aiResponse.id}] 节点启动: ${data.data?.id || '未知节点'}`);
          break;
        
        case 'node_finished':
          console.log(`[${aiResponse.id}] 节点完成: ${data.data?.id || '未知节点'}`);
          break;
        
        case 'workflow_finished':
          setIsTyping(false);
          setIsResponding(false);
          console.log(`[${aiResponse.id}] 工作流完成`);
          break;
        
        case 'error':
          console.log(`[${aiResponse.id}] 错误: `+data.data?.message);
          break;
        
        case 'message':  // chat-messages
          if (data.conversation_id) {
            conversationIdRef.current = data.conversation_id;
          }
          aiResponse.content += data.answer || '';
          updateMessages(aiResponse);
          console.debug(`[${aiResponse.id}] `+data.answer);
          break;

        case 'text_chunk':  // /workflows/run
          aiResponse.content += data.data?.text || '';
          updateMessages(aiResponse);
          console.log(data.data?.text);
          break;

        default:
          console.log(`[${aiResponse.id}] 收到事件: ${data.event}`);
          break;
      }
    }

    const onError = (error: any) => {
      console.error('Stream error:', error);
    }

    setIsTyping(true);

    try {
      if (query === "整体优化简历") {  // 整体优化简历应用
        setIsResponding(true);
        // await 是为了在外层捕获错误
        await workflowAPI.executeWorkflowStream({
          id: "",
          name: "common-analysis",
          inputs: {
            origin_resume: JSON.stringify(resumeData),
          },
          onMessage: onMessage,
          onError: onError,
        });

        postProcess(aiResponse.content);
      } else {  // 通用对话应用
        setIsResponding(true);
        const inputs: any = {
          __query: query,
          __conversation_id: conversationIdRef.current,
          resume: JSON.stringify(resumeData),
        }
        if (isJD) {
          inputs.job_detail = localStorage.getItem('job_description');
        }
        await workflowAPI.executeWorkflowStream({
          id: "",
          name: "basic-chat",
          inputs: inputs,
          onMessage: onMessage,
          onError: onError,
        });
        // postProcess(aiResponse.content);
      }
    } catch (error: any) {
      console.error('Execution error:', error);
    } finally {
      setIsTyping(false);
      setIsResponding(false);
      lastAbortScrollMessageId.current = '';
    }
  };

  /** 已得到输出，重新调用阻塞式api，得到结构化的简历内容 */
  const postProcess = async (content: string): Promise<void> => {
    try{
      setIsFormatting(true);
      setTimeout(() => {
        // 滚动到底部
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
      console.log("开始解析格式化简历...")
      // 1. 创建原有简历摘要，自由基本信息和id
      // const lightResume = parseResumeSummary(resumeData as ResumeData);
      // 2. 调用阻塞式api，得到结构化的简历内容
      const uploadData = {
        current_resume: JSON.stringify(resumeData),
        resume_edit: content
      }
      const structuredResumeResult = await workflowAPI.executeWorkflow("smart-format-2", uploadData, true);
      if (structuredResumeResult.code !== 0) {
        console.error('Execution error:', structuredResumeResult.data.message);
        return;
      }
      const structuredResumeData = structuredResumeResult.data.data.outputs?.output;
      console.log('structuredResumeData', structuredResumeData);

      if (structuredResumeData && typeof structuredResumeData === 'string') {
        // 使用 parseAndFixResumeJson 确保数据安全性和格式正确性
        const finalResumeData = parseAndFixResumeJson(structuredResumeData as string);
        onResumeDataChange(finalResumeData, true);
      }
    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      setIsFormatting(false);
    }
  };


  // 滚动特效
  const handleScroll = useCallback(() => {
    if (scrollRef.current && scrollGradientTopRef.current && scrollGradientBottomRef.current) {
      if(scrollRef.current.scrollTop > 100) {
        scrollGradientTopRef.current.style.height = '24px';
      } else {
        scrollGradientTopRef.current.style.height = '0';
      }

      if(scrollRef.current.scrollTop < scrollRef.current.scrollHeight - scrollRef.current.clientHeight - 100) {
        scrollGradientBottomRef.current.style.height = '24px';
      } else {
        scrollGradientBottomRef.current.style.height = '0';
      }
    }
  }, []);

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-1">
        <div className="flex gap-1 items-center text-lg font-medium">
          <Bot className="w-5 h-5 text-blue-600" />
          简历专家
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={scrollGradientBottomRef} className="from-white to-transparent absolute z-10 transition-opacity pointer-events-none opacity-100 bg-linear-to-t bottom-0 left-0 w-full"></div>
        <div ref={scrollGradientTopRef} className="from-white to-transparent absolute z-10 transition-opacity pointer-events-none opacity-100 bg-linear-to-b top-0 left-0 w-full"></div>

        <div 
          className="absolute p-5 space-y-4 top-0 left-0 w-full h-full overflow-y-auto"
          onScroll={handleScroll}
          ref={scrollRef}
        >
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.type === 'user' ? (
                // 用户消息保持气泡样式
                <div className="flex justify-end">
                  <div className="max-w-[90%] rounded-lg px-3 py-1.5 bg-blue-600 text-white">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ) : (
                // Bot消息使用 AiMessageRenderer 处理特殊的 resume-update 块
                <AiMessageRenderer 
                  content={message.content} 
                  messageId={message.id}
                  className="text-sm leading-relaxed text-gray-800"
                  resumeData={resumeData}
                />
              )}
            </div>
          ))}

          {isFormatting && (
            <div className="w-full px-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="relative">
                    <FiFileText className="w-5 h-5 text-blue-600 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">将内容更新到编辑区</h4>
                  </div>
                  <div className="text-xs text-blue-500 font-mono bg-blue-100 px-2 py-1 rounded">
                    AI
                  </div>
                </div>
                
                {/* 进度条动画 */}
                <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                
              </div>
            </div>
          )}

          {/* 打字指示器，在首字响应前显示 */}
          {isTyping && (
            <div className="w-full py-2">
              <div className="flex items-center space-x-2">
                <FiMessageSquare className="w-4 h-4 text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-2 py-1 border-gray-200 w-full">
        {/* 快捷建议 */}
        {suggestions && suggestions.length > 0 && (
          <div className="flex gap-2 max-w-screen overflow-hidden overflow-x-auto p-2">
            {suggestions.map((suggestion, index) => {
              let text = suggestion;
              let highlight = false;
              if (suggestion.includes("[highlight]")) {
                text = suggestion.replace("[highlight]", "");
                highlight = true;
              }
              return (
                <Button
                  key={index}
                  icon={highlight ? <Sparkles className="w-3 h-3 mr-1" /> : <Lightbulb className="w-3 h-3 mr-1" />}
                  variant={highlight ? 'primary' : 'outline'}
                  size="xs"
                  className="px-2"
                  onClick={() => {
                    if (highlight) {
                      handleSendMessage(text);
                    } else {
                      setInputValue(text);
                    }
                  }}
                >
                  <span className="text-nowrap">{truncate(text, 16)}</span>
                </Button>
                )
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-200">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="输入您的问题或需求..."
            className="flex-1 px-3 py-2 bg-gray-50 rounded-lg focus:outline-none focus:bg-gray-100 transition-colors resize-none border border-gray-300 text-sm overflow-y-auto"
            style={{ minHeight: '40px' }}
          />
          <button 
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isTyping || isResponding}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-6" />
          </button>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          <button 
            className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            onClick={() => setInputValue("请帮我整体检查简历")}
          >
            整体检查
          </button>
          <button 
            className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            onClick={() => setInputValue("突出我的核心竞争力")}
          >
            突出优势
          </button>
          <button 
            className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            onClick={() => setInputValue("针对特定岗位优化")}
          >
            岗位匹配
          </button>
        </div>
      </div>

      <Modal 
        open={debugModalOpen} 
        onClose={() => setDebugModalOpen(false)}
        title={debugType === 'current_data' ? '当前简历数据' : '最后一条AI消息'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDebugModalOpen(false)}>关闭</Button>
            { debugType === 'current_data' && (<>
              <Button variant="outline" onClick={() => onResumeDataChange(JSON.parse(debugData), true)}>更新到编辑区</Button>
              <Button variant="outline" onClick={() => onResumeDataChange(JSON.parse(debugData), false)}>覆盖到编辑区</Button>
            </>)}
          </div>
        }
      >
        { debugType === 'current_data' ? (
          <div className="p-2">
            <textarea rows={20} value={debugData} onChange={(e) => setDebugData(e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-md outline-none"></textarea>
          </div>
        ) : (
          <pre className="text-sm text-gray-600 p-4 whitespace-pre-wrap">{debugData}</pre>
        )}
      </Modal>
    </div>
  );
}
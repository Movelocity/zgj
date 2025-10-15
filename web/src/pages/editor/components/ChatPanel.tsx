import { useState, useRef, useCallback, useEffect } from 'react';
import Button from '@/components/ui/Button';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { Send, Bot, Lightbulb, Sparkles } from 'lucide-react';
import { FiMessageSquare, FiFileText } from 'react-icons/fi';
import type { ResumeData } from '@/types/resume';
import type { ResumeV2Data } from '@/types/resumeV2';
import { workflowAPI } from '@/api/workflow';
import { parseResumeSummary, smartJsonParser } from '@/utils/helpers';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatPanelProps {
  resumeData: ResumeData | ResumeV2Data;
  onResumeDataChange: (data: ResumeData | ResumeV2Data) => void;
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
  const [suggestions, setSuggestions] = useState<string[]>([
    // "[highlight]整体优化简历",
    // "突出优势",
    // "岗位匹配",
    // "整体检查"
  ]);
  const [isResponding, setIsResponding] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  const lastScrollTop = useRef(0);
  const lastAbortScrollMessageId = useRef('');
  
  // 监听 messages 变化并通知父组件
  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);
  
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
    if (isResponding || isFormatting) return;

    setIsTyping(true);

    if (query === "/print") {
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
    
    if (query === "/clear") {
      setMessages([]);
      setIsTyping(false);
      return;
    }
    
    if (query === "/test"){
      // 模拟AI回复
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: generateAIResponse(query),
          timestamp: new Date(),
          suggestions: generateSuggestions(query)
        };
        updateMessages(aiResponse);
        setIsTyping(false);
      }, 500);
      return;
    }

    if (query === "/simulate") {
      onResumeDataChange({
        ...resumeData,
        summary: "测试总结",
        workExperience: [
          ...(resumeData as any).workExperience,
          {
            id: (Date.now() + 1).toString(),
            company: "测试公司",
            position: "测试职位",
            duration: "2020-2021",
            description: "测试描述"
          }
        ]
      });
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "简历内容更新已触发",
        timestamp: new Date(),
      };
      updateMessages(aiResponse);
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
          console.log(`[${aiResponse.id}] `+data.answer);
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
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      console.log("开始解析格式化简历...")
      // 1. 创建原有简历摘要，自由基本信息和id
      const lightResume = parseResumeSummary(resumeData as ResumeData);
      // 2. 调用阻塞式api，得到结构化的简历内容
      const uploadData = {
        current_resume: JSON.stringify(lightResume),
        new_resume: content
      }
      const structuredResumeResult = await workflowAPI.executeWorkflow("smart-format", uploadData, true);
      if (structuredResumeResult.code !== 0) {
        console.error('Execution error:', structuredResumeResult.data.message);
        return;
      }
      const structuredResumeData = structuredResumeResult.data.data.outputs?.output;
      console.log('structuredResumeData', structuredResumeData);

      if (structuredResumeData && typeof structuredResumeData === 'string') {
        const finalResumeData = smartJsonParser<ResumeData>(structuredResumeData as string);
        onResumeDataChange(finalResumeData);
      }
    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      setIsFormatting(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('个人总结') || input.includes('总结')) {
      return '我建议您的个人总结更加突出核心竞争力。我已经为您重新组织了语言，强调了您的技术专长和项目经验。您觉得这样的表达是否更有吸引力？';
    } else if (input.includes('工作经历') || input.includes('工作')) {
      return '我注意到您的工作经历可以更好地展示成果。我建议用具体的数据和成就来替换部分描述，这样会更有说服力。左侧已经更新了相关内容。';
    } else if (input.includes('技能') || input.includes('关键词')) {
      return '我为您优化了技能关键词的排列，将最相关的技能放在前面，并添加了一些行业热门关键词。这样更容易被ATS系统识别。';
    } else if (input.includes('项目') || input.includes('项目经验')) {
      return '项目经验是简历的亮点！我建议突出您在项目中的具体贡献和使用的技术栈。我已经调整了项目描述的结构，您可以查看左侧的修改。';
    } else {
      return '我理解您的需求。基于您的简历内容，我建议从以下几个方面进行优化。请查看左侧的修改建议，有任何问题随时告诉我。';
    }
  };

  const generateSuggestions = (userInput: string): string[] => {
    const input = userInput.toLowerCase();
    
    if (input.includes('个人总结')) {
      return ['增加量化成果', '突出核心技能', '调整语言风格'];
    } else if (input.includes('工作经历')) {
      return ['添加具体数据', '优化行动词汇', '突出核心成就'];
    } else if (input.includes('技能')) {
      return ['调整技能顺序', '添加热门关键词', '分类技能展示'];
    } else {
      return ['整体润色xxxx', '格式调整yyyyy', '内容扩充', '重点突出'];
    }
  };

  const truncate = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
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
                // Bot消息改为全宽无边框渲染
                <div className="w-full">
                  <MarkdownRenderer 
                    content={message.content} 
                    className="text-sm leading-relaxed text-gray-800"
                  />
                </div>
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
                
                {/* 处理步骤指示器 */}
                {/* <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs text-blue-600 ml-2">解析中</span>
                  </div>
                  <div className="text-xs text-blue-400">
                    <Sparkles className="w-3 h-3 inline animate-spin" />
                  </div>
                </div> */}
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
        <div className="flex gap-1 items-end">
          <textarea
            // type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入您的问题或需求..."
            // onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isTyping || isResponding}
            className="m-0.5 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer max-h-10"
          >
            <Send className="w-4 h-4" />
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
    </div>
  );
}
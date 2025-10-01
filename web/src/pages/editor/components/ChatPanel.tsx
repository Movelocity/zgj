
import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Send, Bot, Lightbulb, Sparkles } from 'lucide-react';
import { FiMessageSquare } from 'react-icons/fi';
import { type ResumeData } from '@/types/resume';
import { workflowAPI } from '@/api/workflow';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatPanelProps {
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
}

export default function ChatPanel({ resumeData, onResumeDataChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      // content: '您好！我是您的简历专家助手。我已经为您优化了简历内容，左侧黄色标记的部分是我建议的改进。您可以随时与我对话，我会根据您的需求进一步优化简历。',
      content: "您好，我是简历专家，您可以随时与我对话，我会根据您的需求进一步优化简历",
      timestamp: new Date(),
      // suggestions: [
      //   '帮我优化个人总结',
      //   '改进工作经历描述',
      //   '调整技能关键词',
      //   '优化项目经验'
      // ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    "[highlight]整体优化简历",
    "突出优势",
    "岗位匹配",
    "整体检查"
  ]);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const updateMessages = (message: Message) => {
    const msg = {...message} // 防止对象引用不变，无法更新state
    // console.log(`[${msg.id}] 更新消息: `, msg);
    // 按id过滤匹配，更新对应的消息
    setMessages(prev => {
      const matched = prev.find(m => m.id === msg.id);
      if (matched) {
        return prev.map(m => m.id === msg.id ? msg : m);
      }
      return [...prev, msg];
    });
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    const query = inputValue.trim();
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
    if (isResponding) return;

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
    }

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: "测试中...",
      timestamp: new Date()
    };

    // actual chat
    try {
      setIsResponding(true);
      // await 是为了捕获错误
      await workflowAPI.executeWorkflowStream({
        id: "",
        name: "basic-chat",
        inputs: {
          __query: query
        },
        onMessage: (data) => {
          console.log('Received event:', data);

          // 处理不同类型的事件
          switch (data.event) {
            case 'workflow_started':
              console.log(`[${aiResponse.id}] 工作流启动`);
              aiResponse.content = ""
              updateMessages(aiResponse);
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
            
            case 'message':
              aiResponse.content += data.answer || '';
              updateMessages(aiResponse);
              console.log(`[${aiResponse.id}] `+data.answer);
              break;

            default:
              console.log(`[${aiResponse.id}] 收到事件: ${data.event}`);
              break;
          }
        },
        onError: (error) => {
          console.error('Stream error:', error);
        },
    });
    } catch (error: any) {
      console.error('Execution error:', error);
    } finally {
      setIsResponding(false);
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

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const truncate = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-1">
        <div className="flex gap-1 items-center text-lg font-medium">
          <Bot className="w-5 h-5 text-blue-600" />
          简历专家
        </div>
        {/* <p className="text-sm text-gray-600 mt-1">
          与AI专家对话，实时优化您的简历
        </p> */}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 pb-48" ref={scrollRef}>
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[90%] rounded-lg px-3 py-1.5 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            </div>

          </div>
        ))}

        {/* 打字指示器，在首字响应前显示 */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
              <div className="flex items-center space-x-2">
                <FiMessageSquare className="w-4 h-4 text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-2 py-1 border-gray-200 w-full">
        {/* 快捷建议 */}
        {suggestions && suggestions.length > 0 && (
          <div className="flex gap-2 max-w-screen overflow-hidden overflow-x-auto pb-2">
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
                  onClick={() => handleSuggestionClick(text)}
                >
                  <span className="text-nowrap">{truncate(text, 16)}</span>
                </Button>
                )
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-200">
        <div className="flex gap-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入您的问题或需求..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping || isResponding}
            className="m-0.5 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          <button 
            className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            onClick={() => handleSuggestionClick('请帮我整体检查简历')}
          >
            整体检查
          </button>
          <button 
            className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            onClick={() => handleSuggestionClick('突出我的核心竞争力')}
          >
            突出优势
          </button>
          <button 
            className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            onClick={() => handleSuggestionClick('针对特定岗位优化')}
          >
            岗位匹配
          </button>
        </div>
      </div>
    </div>
  );
}
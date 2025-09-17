
import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Send, Bot, User, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}


export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: '您好！我是您的简历专家助手。我已经为您优化了简历内容，左侧黄色标记的部分是我建议的改进。您可以随时与我对话，我会根据您的需求进一步优化简历。',
      timestamp: new Date(),
      suggestions: [
        '帮我优化个人总结',
        '改进工作经历描述',
        '调整技能关键词',
        '优化项目经验'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // 模拟AI回复
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAIResponse(inputValue),
        timestamp: new Date(),
        suggestions: generateSuggestions(inputValue)
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
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
      return ['整体润色', '格式调整', '内容扩充', '重点突出'];
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  // const handleQuickSuggestion = (suggestion: string) => {
  //   onSuggestionApply?.(suggestion, 'general');
  // };

  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center text-lg font-medium">
          <Bot className="w-5 h-5 mr-2 text-blue-600" />
          简历专家
        </div>
        <p className="text-sm text-muted-foreground">
          与AI专家对话，实时优化您的简历
        </p>
      </div>

      <div className="flex-1 flex flex-col p-4 pt-0 space-y-4">
        {/* 消息区域 */}
        <div className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={`flex ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'assistant' && (
                        <Bot className="w-4 h-4 mt-0.5 text-blue-600" />
                      )}
                      {message.type === 'user' && (
                        <User className="w-4 h-4 mt-0.5" />
                      )}
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                </div>

                {/* 快捷建议 */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-6">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Lightbulb className="w-3 h-3 mr-1" />
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 打字指示器 */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-blue-600" />
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
        </div>

        {/* 输入区域 */}
        <div className="border-t pt-4">
          <div className="flex space-x-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入您的问题或需求..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* 常用快捷操作 */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleSuggestionClick('请帮我整体检查简历')}
            >
              整体检查
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleSuggestionClick('突出我的核心竞争力')}
            >
              突出优势
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleSuggestionClick('针对特定岗位优化')}
            >
              岗位匹配
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
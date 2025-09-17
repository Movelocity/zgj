import { FiMessageSquare } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import Button from "@/components/ui/Button"

export default function ChatPanel2() {

  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center text-lg font-medium">
          <FiMessageSquare className="w-5 h-5 mr-2 text-blue-600" />
          简历专家
        </div>
        <p className="text-sm text-gray-600 mt-1">
          与AI专家对话，实时优化您的简历
        </p>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
          <div className="flex items-start space-x-2">
            <FiMessageSquare className="w-4 h-4 mt-0.5 text-blue-600" />
            <p className="text-sm leading-relaxed">
              您好！我是您的简历专家助手。我已经为您优化了简历内容，左侧黄色标记的部分是我建议的改进。您可以随时与我对话，我会根据您的需求进一步优化简历。
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 ml-6">
          <Button 
            icon={<Sparkles className="w-3 h-3 mr-1" />}
            variant="outline"
            size="xs"
          >
            帮我优化个人总结
          </Button>
          <Button
            icon={<Sparkles className="w-3 h-3 mr-1" />}
            variant="outline"
            size="xs"
          >
            改进工作经历描述
          </Button>
          <Button
            icon={<Sparkles className="w-3 h-3 mr-1" />}
            variant="outline"
            size="xs"
          >
            调整技能关键词
          </Button>
          <Button
            icon={<Sparkles className="w-3 h-3 mr-1" />}
            variant="outline"
            size="xs"
          >
            优化项目经验
          </Button>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="输入您的问题或需求..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <FiMessageSquare className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
            整体检查
          </button>
          <button className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
            突出优势
          </button>
          <button className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
            岗位匹配
          </button>
        </div>
      </div>
    </div>
  );
};
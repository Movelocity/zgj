import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiMessageSquare } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import Button from "@/components/ui/Button"
import { useGlobalStore } from '@/store';
import ChatPanel from './components/ChatPanel';
import ResumeEditor from './components/ResumeEditor';
import { ResumeExample, type ResumeData } from './types';

interface ResumeEditorProps {
  onExit: () => void;
}

export const ResumeDetails: React.FC<ResumeEditorProps> = ({ onExit }) => {
  // const [isEditing, setIsEditing] = useState(false);
  const { setShowBanner } = useGlobalStore();

  useEffect(() => {
    setShowBanner(false);
    return () => {
      setShowBanner(true);
    };
  }, []);

  // 简历数据状态 - AI优化后的内容
  const [resumeData, setResumeData] = useState<ResumeData>(ResumeExample);
  

  return (
    <div className="h-screen flex flex-col">
      {/* 头部导航 */}
      <div className="bg-white border-b border-gray-200 px-4 shadow-sm fixed top-0 w-full z-[1000]">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center">
            <Button 
              onClick={onExit}
              variant="outline"
              className="mr-4 p-2"
              icon={<FiArrowLeft className="w-4 h-4 mr-2" />}
            >
              返回
            </Button>
            <div className="flex items-center">
              <Sparkles className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-xl">简历编辑</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center mr-4 bg-blue-50 px-3 py-1 rounded-lg">
              <FiMessageSquare className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-700">AI 优化简历</span>
            </div>
            {/* {isEditing && (
              <div className="flex items-center mr-4 bg-green-50 px-3 py-1 rounded-lg">
                <FiEdit className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-green-700">编辑中</span>
              </div>
            )} */}
            <Button variant="outline">
              导出PDF
            </Button>
            <Button variant="primary">
              保存简历
            </Button>
          </div>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="flex-1 flex">
        {/* 左侧优化后简历 (7/10) */}
        <div className="w-[70%] border-r border-gray-200 bg-white h-screen overflow-auto py-16">
          <ResumeEditor 
            resumeData={resumeData}
            onResumeDataChange={setResumeData}
          />
        </div>

        {/* 右侧AI对话界面 (3/10) */}
        <div className="w-[30%] p-2 bg-gray-50 h-screen overflow-auto pt-14">
          <ChatPanel />
        </div>
      </div>
    </div>
  )
}
import { useEffect, useState, useCallback } from 'react';
import { FiMessageSquare, FiSave, FiDownload } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, ArrowLeftIcon } from 'lucide-react';
import Button from "@/components/ui/Button";
import { useGlobalStore } from '@/store';
import ChatPanel, { type Message } from './components/ChatPanel';
import ResumeEditorV2 from './components/ResumeEditorV2';
import type { ResumeV2Data } from '@/types/resumeV2';
import { defaultResumeV2Data } from '@/types/resumeV2';
import { resumeAPI } from '@/api/resume';
import { showError, showSuccess } from '@/utils/toast';
// import { workflowAPI } from '@/api/workflow';

export default function ResumeDetailsV2() {
  const { setShowBanner } = useGlobalStore();
  useEffect(() => {
    setShowBanner(false);
    return () => {
      setShowBanner(true);
    };
  }, []);

  // Resume data state
  const [resumeData, setResumeData] = useState<ResumeV2Data>(defaultResumeV2Data);
  const [resumeName, setResumeName] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "您好，我是简历专家V2，我可以帮助您优化简历的各个板块。",
      timestamp: new Date(),
    }
  ]);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);

  // Add chat message
  const addChatMessage = useCallback((content: string, type: 'user' | 'assistant' = 'assistant') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newMessage]);
  }, []);

  // Load resume detail
  const loadResumeDetail = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await resumeAPI.getResume(id);
      if (response.code !== 0 || !response.data) {
        throw new Error('获取简历详情失败');
      }

      const { name, structured_data, text_content } = response.data;
      setResumeName(name);
      
      // Check if structured_data is V2 format
      if (structured_data && structured_data.version === 2) {
        setResumeData(structured_data as ResumeV2Data);
      } else if (text_content) {
        // Need to convert from V1 or text to V2
        const hash = window.location.hash;
        if (hash === '#jd') {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          // Job description workflow - will be handled separately
          addChatMessage('正在根据职位描述优化简历...');
        }
        // For now, use default template
        setResumeData(defaultResumeV2Data);
      } else {
        setResumeData(defaultResumeV2Data);
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError(error instanceof Error ? error.message : '获取简历详情失败');
    }
  }, [id, addChatMessage]);

  useEffect(() => {
    loadResumeDetail();
  }, [loadResumeDetail]);

  // Save resume
  const handleSaveResume = async () => {
    if (!id) return;
    try {
      setSaving(true);
      await resumeAPI.updateResume(id, {
        name: resumeName,
        structured_data: resumeData,
      });
      showSuccess('保存成功');
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    // TODO: Implement V2 PDF export
    showError('PDF导出功能开发中');
  };

  // Go back
  const handleGoBack = () => {
    navigate('/resumes');
  };

  // Handle resume data change
  const handleResumeDataChange = (newData: ResumeV2Data) => {
    setResumeData(newData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className=" px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleGoBack}
              variant="ghost"
              className="py-2 px-0 hover:bg-gray-100 rounded-lg transition-colors"
              title="返回"
              icon={<ArrowLeftIcon className="w-5 h-5" />}
            >
            </Button>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-semibold">简历编辑器 V2</h1>
            </div>
            <input
              type="text"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="简历名称"
            />
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setIsChatOpen(!isChatOpen)}
              variant="outline"
              icon={<FiMessageSquare className="w-4 h-4 mr-2" />}
            >
              {isChatOpen ? '关闭对话' : 'AI对话'}
            </Button>
            
            <Button
              onClick={handleExportPDF}
              variant="outline"
              icon={<FiDownload className="w-4 h-4 mr-2" />}
            >
              导出PDF
            </Button>

            <Button
              onClick={handleSaveResume}
              disabled={isSaving}
              icon={<FiSave className="w-4 h-4 mr-2" />}
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16">
        <div className={`flex ${isChatOpen ? 'max-w-[1800px]' : 'max-w-7xl'} mx-auto`}>
          {/* Editor Panel */}
          <div className={`flex-1 ${isChatOpen ? 'pr-6' : ''} py-6 px-4`}>
            <ResumeEditorV2
              resumeData={resumeData}
              onResumeDataChange={handleResumeDataChange}
            />
          </div>

          {/* Chat Panel */}
          {isChatOpen && (
            <div className="w-[500px] border-l border-gray-200 bg-white">
              <ChatPanel
                initialMessages={chatMessages}
                onMessagesChange={setChatMessages}
                resumeData={resumeData}
                onResumeDataChange={(data) => handleResumeDataChange(data as ResumeV2Data)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


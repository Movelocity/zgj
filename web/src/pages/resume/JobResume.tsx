import React, { useState } from 'react';
import { FiUpload, FiFileText, FiStar, FiX, FiFolder, FiBriefcase } from 'react-icons/fi';
import { Button, Modal } from "@/components/ui";
import type { ResumeUploadData, ResumeInfo } from '@/types/resume';
import { resumeAPI } from '@/api/resume';
import { useNavigate } from 'react-router-dom';
import { showError } from '@/utils/toast';

const HistoryResumeSelector: React.FC<{
  onSelect: (resume: ResumeInfo) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  const [historicalResumes, setHistoricalResumes] = useState<ResumeInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's resume list
  const loadResumes = async () => {
    try {
      setLoading(true);
      const response = await resumeAPI.getResumes({ page: 1, page_size: 20 });
      if (response.code === 0 && response.data) {
        setHistoricalResumes(response.data.list || []);
      }
    } catch (error) {
      console.error('获取简历列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadResumes();
  }, []);

  const handleSelectResume = (resume: ResumeInfo) => {
    onSelect(resume);
  };
  
  return (
    <Modal
      open={true}
      onClose={onClose}
      title="选择已有简历"
      size="sm"
      showFooter={true}
      footer={
        <Button 
          onClick={() => onClose()}
          className="w-full"
          variant="outline"
        >
          关闭
        </Button>
      }
      zIndex={1000}
    >
      <div className="p-6">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <FiFolder className="w-5 h-5 mr-2 text-blue-600" />
            <h3 className="text-lg font-medium">选择已有简历</h3>
          </div>
        </div>
        
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">加载中...</p>
            </div>
          ) : historicalResumes.map((resume, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleSelectResume(resume)}
            >
              <div className="flex items-center space-x-3">
                <FiFileText className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium">{resume.name}</div>
                  <div className="text-xs text-gray-600">
                    {resume.file_id ? 'PDF/Word文件' : '纯文本简历'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {resume.resume_number}
                  </div>
                </div>
              </div>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                选择
              </button>
            </div>
          ))}
          
          {!loading && historicalResumes.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              <FiFileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无历史简历</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const ResumeSelector: React.FC<{
  selectedFile: File | ResumeInfo | null;
  onSelect: (file: File | ResumeInfo | null) => void;
}> = ({ selectedFile, onSelect }) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  return (
    <>
      {/* File upload area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center relative h-full flex items-center justify-center">
        <input
          type="file"
          id="resume-upload-jd"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={(event) => {
            if (event.target.files?.[0]) {
              onSelect(event.target.files?.[0]);
            }
          }}
        />
        
        {selectedFile ? (
          // Selected file or resume display
          <div className="flex items-center justify-center space-x-3">
            <FiFileText className="w-8 h-8 text-blue-600" />
            <span className="text-lg">
              {selectedFile instanceof File ? selectedFile.name : (selectedFile as ResumeInfo).name}
            </span>
            <button
              onClick={() => onSelect(null)}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // Upload prompt
          <div className="flex flex-col items-center space-y-2">
            <Button 
              variant="outline"
              title="支持拖拽上传, 支持PDF、Word等格式, 10MB以内"
              onClick={() => document.getElementById('resume-upload-jd')?.click()}
            >
              <FiUpload className="w-4 h-4 mr-2" />
              点击上传简历
            </Button>

            <Button
              onClick={() => setShowHistoryModal(true)}
              variant="ghost"
            >
              <FiFolder className="w-4 h-4 mr-2" />
              历史上传
            </Button>
          </div>
        )}
      </div>

      {/* History resume selector modal */}
      {showHistoryModal && (
        <HistoryResumeSelector
          onSelect={(resume) => {
            onSelect(resume);
            setShowHistoryModal(false);
          }}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </>
  );
};

const JobResume: React.FC = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | ResumeInfo | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');

  const handleStartOptimization = async () => {
    if (!selectedFile || !jobDescription.trim()) {
      showError('请上传简历并填写职位描述');
      return;
    }

    localStorage.setItem('job_description', jobDescription.trim());

    try {
      let resumeId: string;

      if (selectedFile instanceof File) {
        // If it's a new uploaded file, upload first to get resume ID
        setIsProcessing(true);
        const uploadData: ResumeUploadData = { file: selectedFile };
        const uploadResponse = await resumeAPI.uploadResume(uploadData);
        
        if (uploadResponse.code !== 0) {
          throw new Error('简历上传失败');
        }
        
        resumeId = uploadResponse.data?.id || '';
      } else {
        // If it's an existing resume, use its ID directly
        resumeId = selectedFile.id;
      }

      if (resumeId) {
        // TODO: Call workflow with resume_text and job_description
        // For now, just navigate to V2 editor with JD hash
        navigate(`/editor/v2/${resumeId}#jd-new`);
      } else {
        throw new Error('获取简历ID失败');
      }
    } catch (error) {
      setIsProcessing(false);
      showError(error instanceof Error ? error.message : '操作失败');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto pt-20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-3xl">职位简历优化</h1>
          </div>
          <p className="text-gray-600">
            输入职位描述，让AI帮您定制匹配的简历
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Left: Job Description */}
            <div className="flex flex-col h-96">
              <div className="flex items-center mb-3">
                <FiBriefcase className="w-5 h-5 mr-2" />
                <h2 className="text-lg font-medium">职位描述</h2>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="粘贴完整的职位描述，包括岗位职责和任职要求...&#10;&#10;例如：&#10;岗位职责：&#10;1. 负责前端开发工作...&#10;2. 参与产品需求评审...&#10;&#10;任职要求：&#10;1. 3年以上前端开发经验...&#10;2. 熟悉React、Vue等框架..."
                className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={isProcessing}
              />
            </div>

            {/* Right: Resume Upload */}
            <div className="flex flex-col">
              <div className="flex items-center mb-3">
                <FiFileText className="w-5 h-5 mr-2" />
                <h2 className="text-lg font-medium">上传简历</h2>
              </div>
              <div className="flex-1">
                {!isProcessing && (
                  <ResumeSelector
                    selectedFile={selectedFile}
                    onSelect={setSelectedFile}
                  />
                )}

                {/* Processing state */}
                {isProcessing && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 h-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <h3 className="mb-2">正在上传并准备优化...</h3>
                      <p className="text-sm text-gray-600">
                        {selectedFile instanceof File ? '正在上传并准备优化...' : '正在准备优化...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Start Optimization Button */}
          {!isProcessing && (
            <div className="p-6 pt-0">
              <Button
                onClick={handleStartOptimization}
                disabled={!selectedFile || !jobDescription.trim() || isProcessing}
                className="w-full h-12"
              >
                <FiStar className="w-4 h-4 mr-2" />
                {isProcessing ? '处理中...' : '开始优化简历'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobResume;

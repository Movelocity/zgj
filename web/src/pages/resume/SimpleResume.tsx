import React, { useState } from 'react';
import { FiUpload, FiFileText, FiStar, FiX, FiFolder } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import Button from "@/components/ui/Button"
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

  // 加载用户的简历列表
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

  // 选择已有简历，直接传递简历信息
  const handleSelectResume = (resume: ResumeInfo) => {
    // 直接传递简历信息而不是文件对象
    onSelect(resume as any);
  };
  
  return (
    <div className="h-screen fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <FiFolder className="w-5 h-5 mr-2 text-blue-600" />
            <h3 className="text-lg font-medium">选择已有简历</h3>
          </div>
          <p className="text-gray-600">从历史上传的简历中选择一份进行优化</p>
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
        
        <button 
          onClick={() => onClose()}
          className="w-full mt-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  )
}

const ResumeSelector: React.FC<{
  selectedFile: File | ResumeInfo | null;
  onSelect: (file: File | ResumeInfo | null) => void;
}> = ({ selectedFile, onSelect }) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  return (
    <>
      {/* 文件上传区域 */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center relative">
        {/* 选择已有简历按钮 */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="absolute top-3 right-3 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center text-sm"
        >
          <FiFolder className="w-4 h-4 mr-2" />
          选择已有简历
        </button>

        <input
          type="file"
          id="resume-upload"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={(event) => {
            if (event.target.files?.[0]) {
              onSelect(event.target.files?.[0]);
            }
          }}
        />
        
        {selectedFile ? (
          // 已选择文件或简历显示
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
          // 上传提示
          <label
            htmlFor="resume-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <FiUpload className="w-12 h-12 text-gray-400 mb-4" />
            <span className="text-lg mb-2">点击上传简历</span>
            <span className="text-sm text-gray-500">
              或拖拽文件到此处
            </span>
          </label>
        )}
      </div>

      

      {/* 历史简历选择弹窗 */}
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

  )
}


const SimpleResume: React.FC = () => {
  const navigate = useNavigate();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | ResumeInfo | null>(null);

  const handleStartOptimization = async () => {
    if (!selectedFile) return;

    try {
      let resumeId: string;

      if (selectedFile instanceof File) {
        // 如果是新上传的文件，先上传获取简历ID
        setIsOptimizing(true);
        const uploadData: ResumeUploadData = { file: selectedFile };
        const uploadResponse = await resumeAPI.uploadResume(uploadData);
        
        if (uploadResponse.code !== 0) {
          throw new Error('简历上传失败');
        }
        
        resumeId = uploadResponse.data?.id || '';
      } else {
        // 如果是已有简历，直接使用其ID
        resumeId = selectedFile.id;
      }

      if (resumeId) {
        // 直接跳转到编辑页面
        navigate(`/editor/${resumeId}`);
      } else {
        throw new Error('获取简历ID失败');
      }
    } catch (error) {
      setIsOptimizing(false);
      showError(error instanceof Error ? error.message : '操作失败');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-3xl">AI简历优化</h1>
          </div>
          <p className="text-gray-600">
            上传您的简历，让AI为您智能优化内容和格式
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center mb-2">
              <FiFileText className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-medium">简历优化</h2>
            </div>
            <p className="text-gray-600 text-sm">
              支持PDF、Word等格式，文件大小不超过10MB
            </p>
          </div>
          <div className="p-6 space-y-6">
            {!isOptimizing && (
              <>
                <ResumeSelector
                  selectedFile={selectedFile}
                  onSelect={setSelectedFile}
                />
                {/* 开始优化按钮 */}
                <Button
                  onClick={handleStartOptimization}
                  disabled={!selectedFile || isOptimizing}
                  className="w-full h-12"
                  icon={<FiStar className="w-4 h-4 mr-2" />}
                >
                  {isOptimizing ? '处理中...' : '开始编辑简历'}
                </Button>
              </>
            )}

            {/* 处理中状态 */}
            {isOptimizing && (
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <h3 className="mb-2">正在上传并准备解析...</h3>
                <p className="text-sm text-gray-600">
                  {selectedFile instanceof File ? '正在上传并准备编辑...' : '正在准备编辑...'}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SimpleResume;
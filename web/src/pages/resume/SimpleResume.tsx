import React, { useState, useEffect } from 'react';
import { FiUpload, FiFileText, FiX, FiFolder } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import { Button, Modal } from "@/components/ui"
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
  )
}

const ResumeSelector: React.FC<{
  selectedFile: File | ResumeInfo | null;
  onSelect: (file: File | ResumeInfo | null) => void;
}> = ({ selectedFile, onSelect }) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // 滚动到顶部
    window.scrollTo(0, 0);
  }, []);

  // 验证文件类型和大小
  const validateFile = (file: File): boolean => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      showError('不支持的文件格式，请上传 PDF 或 Word 文件');
      return false;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showError('文件大小不能超过 10MB');
      return false;
    }
    
    return true;
  };

  // 处理文件选择（用于点击上传和拖拽上传）
  const handleFileSelect = (file: File | null) => {
    if (file && validateFile(file)) {
      onSelect(file);
    }
  };

  // 拖拽事件处理
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedFile) {
      setIsDragging(true);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedFile) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当离开整个拖拽区域时才清除状态
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (selectedFile) {
      return; // 如果已有文件，不处理拖拽
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <>
      {/* 文件上传区域 */}
      <div 
        title="支持PDF、Word等格式，文件大小不超过10MB"
        className={`border-2 border-dashed rounded-lg p-8 text-center relative py-24 transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 选择已有简历按钮 */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="absolute top-3 right-3 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center text-sm z-10"
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
              handleFileSelect(event.target.files[0]);
            }
          }}
        />
        
        {selectedFile ? (
          // 已选择文件或简历显示
          <div className="flex flex-col items-center gap-2 w-fit mx-auto">
            <FaBook className="w-20 h-20 text-blue-600" />
            <div className="flex items-center justify-between">
              <span className="text-lg text-gray-600">
                {selectedFile instanceof File ? selectedFile.name : (selectedFile as ResumeInfo).name}
              </span>
              <button
                onClick={() => onSelect(null)}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            
          </div>
        ) : (
          // 上传提示
          <label
            htmlFor="resume-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <FiUpload className={`w-12 h-12 mb-4 transition-colors ${
              isDragging ? 'text-blue-500' : 'text-gray-400'
            }`} />
            <span className={`text-lg mb-2 transition-colors ${
              isDragging ? 'text-blue-600' : ''
            }`}>
              {isDragging ? '松开鼠标上传文件' : '点击上传'}
            </span>
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
        
        // 标记为新简历，需要初始化分析
        if (resumeId) {
          await resumeAPI.updateResume(resumeId, {
            metadata: { isNewResume: true }
          });
        }
      } else {
        // 如果是已有简历，直接使用其ID
        resumeId = selectedFile.id;
      }

      if (resumeId) {
        // 直接跳转到编辑页面
        navigate(`/editor/v2/${resumeId}`);
      } else {
        throw new Error('获取简历ID失败');
      }
    } catch (error) {
      setIsOptimizing(false);
      showError(error instanceof Error ? error.message : '操作失败');
    }
  };

  return (
    <div className="">
      {/* 背景图片 */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-left md:bg-center h-screen"
        style={{ 
          backgroundImage: 'url(/images/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
        }}
      />
      <div className="mx-auto mt-24 py-8 px-4 min-h-[70vh] bg-white/80 rounded-lg w-[calc(100%-2rem)] lg:w-[calc(100%-8rem)]" >
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <h1 className="text-3xl font-semibold bg-gradient-to-r from-blue-800 to-sky-600 bg-clip-text text-transparent">
              AI简历优化
            </h1>
          </div>
          <p className="text-gray-500">
            上传您的简历，让AI为您智能优化内容和格式
          </p>
        </div>

        <div className="p-4 lg:p-6 max-w-3xl mx-auto">

          <div className="flex items-center mb-2">
            <h2 className="text-lg font-medium">上传简历</h2>
          </div>

          <div className="space-y-6">
            {!isOptimizing && (
              <>
                <ResumeSelector
                  selectedFile={selectedFile}
                  onSelect={setSelectedFile}
                />
                {/* 开始优化按钮 */}
                <Button
                  variant="primary"
                  onClick={handleStartOptimization}
                  disabled={!selectedFile || isOptimizing}
                  className="w-full h-12"
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
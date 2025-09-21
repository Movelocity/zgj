import React, { useState, useEffect } from 'react';
import { FiUpload, FiFileText, FiStar, FiCheckCircle, FiX, FiFolder } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import Button from "@/components/ui/Button"
import type { ResumeUploadData, ResumeInfo, OptimizationResult } from '@/types/resume';
import { resumeAPI } from '@/api/resume';
import { useNavigate } from 'react-router-dom';
import { TimeBasedProgressUpdater, AI_OPTIMIZATION_STEPS } from '@/utils/progress';
import { showError, showSuccess } from '@/utils/toast';

const HistoryResumeSelector: React.FC<{
  onSelect: (file: File) => void;
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

  // 模拟选择简历文件（实际应用中可能需要下载文件）
  const handleSelectResume = (resume: ResumeInfo) => {
    // 创建一个模拟的文件对象
    const mockFile = new File([''], resume.original_filename || resume.name, { 
      type: resume.file_id ? 'application/pdf' : 'text/plain' 
    });
    onSelect(mockFile);
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
  selectedFile: File | null;
  onSelect: (file: File | null) => void;
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
          // 已上传文件显示
          <div className="flex items-center justify-center space-x-3">
            <FiFileText className="w-8 h-8 text-blue-600" />
            <span className="text-lg">{selectedFile.name}</span>
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
          onSelect={(file) => {
            onSelect(file);
            setShowHistoryModal(false);
          }}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </>

  )
}

const OptimizedResultsModal: React.FC<{
  optimizationResults: OptimizationResult;
  onConfirm: () => void;
}> = ({ optimizationResults, onConfirm }) => {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl text-green-600">
              {optimizationResults.totalChanges}
            </div>
            <div className="text-sm text-gray-600">
              处优化点
            </div>
          </div>
          <div>
            <div className="text-2xl text-blue-600">
              {optimizationResults.improvementPercentage}%
            </div>
            <div className="text-sm text-gray-600">
              整体提升
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-2">优化的部分：</h4>
        <div className="space-y-2">
          {optimizationResults.sectionsImproved.map((section, index) => (
            <div key={index} className="flex items-center text-sm">
              <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
              {section}
            </div>
          ))}
        </div>
      </div>

      <Button 
        variant="primary"
        onClick={onConfirm}
        className='w-full'
      >
        查看优化结果
      </Button>
    </div>
  )
}

const SimpleResume: React.FC = () => {
  const navigate = useNavigate();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [showResults, setShowResults] = useState(false);  // 是否显示优化结果弹窗
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult | null>(null);
  const [progressUpdater, setProgressUpdater] = useState<TimeBasedProgressUpdater | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // 初始化进度更新器
  const initProgressUpdater = () => {
    const updater = new TimeBasedProgressUpdater(AI_OPTIMIZATION_STEPS, {
      onProgressUpdate: (progress: number, text: string) => {
        setProgress(progress);
        setProgressText(text);
      },
      onStepComplete: (stepIndex: number, stepName: string) => {
        console.log(`Step ${stepIndex + 1} completed: ${stepName}`);
        setCurrentStep(stepIndex + 1);
      },
      onAllComplete: () => {
        // 生成模拟结果
        const mockResults: OptimizationResult = {
          totalChanges: Math.floor(Math.random() * 15) + 8,
          sectionsImproved: ['工作经历', '技能描述', '项目经验', '个人总结'],
          improvementPercentage: Math.floor(Math.random() * 30) + 40
        };
        
        setOptimizationResults(mockResults);
        setIsOptimizing(false);
        setShowResults(true);
        showSuccess('简历优化完成！');
      }
    });
    setProgressUpdater(updater);
    return updater;
  };

  const startOptimization = async (file: File) => {
    if (!file) return;

    setIsOptimizing(true);
    setProgress(0);
    setCurrentStep(0);

    try {
      const updater = initProgressUpdater();
      
      // 第一步：上传简历文件
      updater.startStep(0);
      
      const uploadData: ResumeUploadData = { file };
      const uploadResponse = await resumeAPI.uploadResume(uploadData);
      
      if (uploadResponse.code !== 0) {
        throw new Error('简历上传失败');
      }
      
      // 完成上传步骤
      updater.completeCurrentStep();
      
      // 第二步：解析简历内容
      setTimeout(() => {
        updater.startStep(1);
        setTimeout(() => {
          updater.completeCurrentStep();
          
          // 第三步：分析个人优势
          setTimeout(() => {
            updater.startStep(2);
            setTimeout(() => {
              updater.completeCurrentStep();
              
              // 第四步：生成优化建议
              setTimeout(() => {
                updater.startStep(3);
                setTimeout(() => {
                  updater.completeCurrentStep();
                  
                  // 第五步：应用优化方案
                  setTimeout(() => {
                    updater.startStep(4);
                    setTimeout(() => {
                      updater.completeCurrentStep();
                    }, AI_OPTIMIZATION_STEPS[4].expectedDuration * 1000);
                  }, 500);
                }, AI_OPTIMIZATION_STEPS[3].expectedDuration * 1000);
              }, 500);
            }, AI_OPTIMIZATION_STEPS[2].expectedDuration * 1000);
          }, 500);
        }, AI_OPTIMIZATION_STEPS[1].expectedDuration * 1000);
      }, 500);
      
      // 设置结果中的简历ID
      if (optimizationResults) {
        setOptimizationResults({
          ...optimizationResults,
          resumeId: uploadResponse.data?.id || ''
        });
      }
      
    } catch (error) {
      if (progressUpdater) {
        progressUpdater.stop();
      }
      setIsOptimizing(false);
      setProgress(0);
      setProgressText('');
      setCurrentStep(0);
      
      showError(error instanceof Error ? error.message : '优化过程出错');
      
      // 回退到模拟模式
      const mockResults: OptimizationResult = {
        totalChanges: Math.floor(Math.random() * 15) + 8,
        sectionsImproved: ['工作经历', '技能描述', '项目经验', '个人总结'],
        improvementPercentage: Math.floor(Math.random() * 30) + 40
      };

      setOptimizationResults(mockResults);
      setShowResults(true);
    }
  };

  const handleStartOptimization = () => {
    if (selectedFile) {
      startOptimization(selectedFile);
    }
  };

  const resetProcess = () => {
    if (progressUpdater) {
      progressUpdater.stop();
    }
    setSelectedFile(null);
    setIsOptimizing(false);
    setProgress(0);
    setProgressText('');
    setShowResults(false);
    setOptimizationResults(null);
    setProgressUpdater(null);
    setCurrentStep(0);
  };

  // 清理进度更新器
  useEffect(() => {
    return () => {
      if (progressUpdater) {
        progressUpdater.stop();
      }
    };
  }, [progressUpdater]);

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
            {!isOptimizing && !showResults && (
              <>
                <ResumeSelector
                  selectedFile={selectedFile}
                  onSelect={setSelectedFile}
                />
                {/* 开始优化按钮 */}
                <Button
                  onClick={handleStartOptimization}
                  disabled={!selectedFile}
                  className="w-full h-12"
                  icon={<FiStar className="w-4 h-4 mr-2" />}
                >
                  开始AI优化
                </Button>
              </>
            )}

            {/* 优化进度 */}
            {isOptimizing && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="mb-2">正在优化您的简历...</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    AI正在分析和优化您的简历内容
                  </p>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="text-sm text-blue-600 font-medium">
                    {progressText}
                  </div>
                  <div className="text-sm text-gray-600">
                    {progress}% 完成
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    步骤 {currentStep + 1} / {AI_OPTIMIZATION_STEPS.length}
                  </div>
                </div>
              </div>
            )}

            {/* 完成状态 */}
            {!isOptimizing && showResults && (
              <div className="text-center space-y-4">
                <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3>优化完成！</h3>
                <p className="text-gray-600">
                  您的简历已成功优化
                </p>
                <Button 
                  icon={<FiCheckCircle className="w-4 h-4 mr-2" />}
                  variant="primary"
                  onClick={resetProcess} 
                  className="w-full"
                >
                  优化新简历
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 优化结果弹窗 */}
        {showResults && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center mb-2">
                  <FiStar className="w-5 h-5 mr-2 text-blue-600" />
                  <h3 className="text-lg font-medium">优化完成</h3>
                </div>
                <p className="text-gray-600">AI已成功优化您的简历</p>
              </div>
              
              {optimizationResults && (
                <OptimizedResultsModal
                  optimizationResults={optimizationResults}
                  onConfirm={() => {
                    setShowResults(false)
                    navigate('/resumes')
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleResume;
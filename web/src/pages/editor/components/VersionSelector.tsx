import { useState, useEffect } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import { resumeAPI } from '@/api/resume';
import type { ResumeInfo } from '@/types/resume';
import { showError } from '@/utils/toast';

interface VersionSelectorProps {
  currentResumeId: string;
  currentVersion: number;
  resumeNumber: string;
  onVersionChange: (resumeId: string, version: number) => void;
}

export default function VersionSelector({
  currentResumeId,
  currentVersion,
  resumeNumber,
  onVersionChange
}: VersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<ResumeInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载所有版本
  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await resumeAPI.getResumes({ page: 1, page_size: 100 });
      if (response.code === 0 && response.data) {
        // 筛选相同resume_number的简历，按版本号降序排列
        const sameResumes = response.data.list
          .filter(r => r.resume_number === resumeNumber)
          .sort((a, b) => b.version - a.version);
        setVersions(sameResumes);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '获取版本列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && versions.length === 0) {
      loadVersions();
    }
  }, [isOpen]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleVersionSelect = (resume: ResumeInfo) => {
    if (resume.id !== currentResumeId) {
      onVersionChange(resume.id, resume.version);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
        title="切换版本"
      >
        <Clock className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-700">v{currentVersion}</span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* 点击外部关闭下拉框 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="py-2 px-3 border-b border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">共 {versions.length} 个版本</p>
            </div>

            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">加载中...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                暂无版本记录
              </div>
            ) : (
              <div className="py-1">
                {versions.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => handleVersionSelect(resume)}
                    className={`w-full py-1 text-left hover:bg-gray-50 transition-colors border-l-4 cursor-pointer ${
                      resume.id === currentResumeId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between border-b border-gray-100 mx-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {/* <span className={`text-sm font-medium ${
                            resume.id === currentResumeId ? 'text-blue-600' : 'text-gray-900'
                          }`}>
                            版本 {resume.version}
                          </span> */}
                          {/* {resume.id === currentResumeId && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )} */}
                          {/* {resume.version === versions[0].version && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                              最新
                            </span>
                          )} */}
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {resume.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDate(resume.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

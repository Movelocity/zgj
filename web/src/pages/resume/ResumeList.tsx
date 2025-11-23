import React, { useState, useEffect, useMemo } from 'react';
import { FiUpload, FiFileText, FiDownload, FiTrash2, FiCalendar, FiEdit, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button, Modal } from '@/components/ui';
import { resumeAPI } from '@/api/resume';
import { fileAPI } from '@/api/file';
import type { ResumeInfo, CreateTextResumeData } from '@/types/resume';
import { showSuccess, showError, showWarning } from '@/utils/toast';

// 分组后的简历数据结构
interface GroupedResume {
  resumeNumber: string;
  latest: ResumeInfo;  // 最新版本
  history: ResumeInfo[]; // 历史版本（按版本号降序）
  hasHistory: boolean; // 是否有历史版本
}

const ResumeList: React.FC = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<ResumeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showCreateTextModal, setShowCreateTextModal] = useState(false);
  const [textResumeForm, setTextResumeForm] = useState<CreateTextResumeData>({
    name: '',
    text_content: ''
  });
  // 管理展开的简历组
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  // const isAdmin = useAuthStore((state) => state.user?.role === ADMIN_ROLE);

  // 使用 useMemo 对简历进行分组整合
  const groupedResumes = useMemo(() => {
    const groups = new Map<string, GroupedResume>();

    // 按 resume_number 分组
    resumes.forEach((resume) => {
      const resumeNumber = resume.resume_number;
      
      if (!groups.has(resumeNumber)) {
        groups.set(resumeNumber, {
          resumeNumber,
          latest: resume,
          history: [],
          hasHistory: false,
        });
      } else {
        const group = groups.get(resumeNumber)!;
        // 比较版本号，确保 latest 是最新的
        if (resume.version > group.latest.version) {
          group.history.push(group.latest);
          group.latest = resume;
        } else {
          group.history.push(resume);
        }
      }
    });

    // 对每个组的历史版本按版本号降序排序
    groups.forEach((group) => {
      group.history.sort((a, b) => b.version - a.version);
      group.hasHistory = group.history.length > 0;
    });

    return Array.from(groups.values());
  }, [resumes]);

  // 切换展开/收起状态
  const toggleExpand = (resumeNumber: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resumeNumber)) {
        newSet.delete(resumeNumber);
      } else {
        newSet.add(resumeNumber);
      }
      return newSet;
    });
  };

  // 加载简历列表
  const loadResumes = async (page = 1) => {
    try {
      setLoading(true);
      const response = await resumeAPI.getResumes({ 
        page, 
        page_size: pageSize 
      });
      
      if (response.code === 0 && response.data) {
        setResumes(response.data.list || []);
        setTotal(response.data.total || 0);
        setCurrentPage(response.data.page || 1);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '获取简历列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 上传简历
  // const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = event.target.files;
  //   if (!files || files.length === 0) return;

  //   const file = files[0];
    
  //   // 检查文件类型
  //   const allowedTypes = ['.pdf', '.doc', '.docx'];
  //   const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  //   if (!allowedTypes.includes(fileExtension)) {
  //     showWarning('请上传 PDF、DOC 或 DOCX 格式的简历文件');
  //     return;
  //   }

  //   // 检查文件大小 (10MB)
  //   if (file.size > 10 * 1024 * 1024) {
  //     showWarning('文件大小不能超过 10MB');
  //     return;
  //   }

  //   try {
  //     setUploading(true);
  //     const uploadData: ResumeUploadData = { file };
  //     const response = await resumeAPI.uploadResume(uploadData);
      
  //     if (response.code === 0) {
  //       showSuccess('简历上传成功');
  //       loadResumes(currentPage);
  //     }
  //   } catch (error) {
  //     showError(error instanceof Error ? error.message : '简历上传失败');
  //   } finally {
  //     setUploading(false);
  //     // 清空文件输入
  //     if (event.target) {
  //       event.target.value = '';
  //     }
  //   }
  // };

  // 删除简历
  const handleDelete = async (resumeId: string, resumeName: string) => {
    if (!confirm(`确定要删除简历"${resumeName}"吗？此操作无法撤销。`)) {
      return;
    }

    try {
      const response = await resumeAPI.deleteResume(resumeId);
      if (response.code === 0) {
        showSuccess('简历删除成功');
        loadResumes(currentPage);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '删除简历失败');
    }
  };

  // 创建纯文本简历
  const handleCreateTextResume = async () => {
    if (!textResumeForm.name.trim()) {
      showWarning('请输入简历名称');
      return;
    }
    if (!textResumeForm.text_content.trim()) {
      showWarning('请输入简历内容');
      return;
    }

    try {
      setUploading(true);
      const response = await resumeAPI.createTextResume(textResumeForm);
      if (response.code === 0) {
        showSuccess('纯文本简历创建成功');
        setShowCreateTextModal(false);
        setTextResumeForm({ name: '', text_content: '' });
        loadResumes(currentPage);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '创建简历失败');
    } finally {
      setUploading(false);
    }
  };

  // 下载简历
  const handleDownload = (resume: ResumeInfo) => {
    if (resume.file_id) {
      // 使用文件预览API下载
      const downloadUrl = fileAPI.previewFile(resume.file_id, true);
      window.open(downloadUrl, '_blank');
    } else {
      showWarning('文件不存在或无法下载');
    }
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    loadResumes();
  }, []);

  return (
    <div className="min-h-screen">
      {/* 背景图片 */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-left md:bg-center h-screen"
        style={{ 
          backgroundImage: 'url(/images/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
        }}
      />
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* 页面标题和操作按钮 */}
        {/* <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <input
              type="file"
              id="resume-upload"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleUpload}
              disabled={uploading}
            />
            {resumes.length > 0 && (
              <Button
                onClick={() => document.getElementById('resume-upload')?.click()}
                disabled={uploading}
                className="flex items-center space-x-2"
                variant="primary"
              >
                <FiUpload className="w-4 h-4" />
                <span>{uploading ? '上传中...' : '上传简历'}</span>
              </Button>
          )}
          </div>
        </div> */}

        {/* 简历列表 */}
        <div className="rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="p-8 text-center">
              <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">还没有上传任何简历</p>
              <div className="flex justify-center space-x-3">
                {/* <Button
                  onClick={() => setShowCreateTextModal(true)}
                  variant="outline"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  创建简历
                </Button> */}
                <Button
                  onClick={() => {
                    // document.getElementById('resume-upload')?.click();
                    navigate('/simple-resume');
                  }}
                  variant="outline"
                >
                  <FiUpload className="w-4 h-4 mr-2" />
                  上传简历
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="w-8 px-2 py-3"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      简历信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      编号/版本
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      上传时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedResumes.map((group) => {
                    const isExpanded = expandedGroups.has(group.resumeNumber);
                    const resume = group.latest;
                    
                    return (
                      <React.Fragment key={group.resumeNumber}>
                        {/* 最新版本行 */}
                        <tr className="hover:bg-gray-50">
                          <td className="w-8 px-2 py-4">
                            {group.hasHistory && (
                              <button
                                onClick={() => toggleExpand(group.resumeNumber)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer transition-transform duration-200"
                                title={isExpanded ? '收起历史版本' : '展开历史版本'}
                              >
                                {isExpanded ? (
                                  <FiChevronDown className="w-4 h-4" />
                                ) : (
                                  <FiChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiFileText className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                              <div 
                                className="text-sm font-medium text-gray-900 hover:underline cursor-pointer" 
                                onClick={() => {navigate(`/editor/v2/${resume.id}`)}}
                              >
                                {resume.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{resume.resume_number}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-500">
                              <FiCalendar className="w-4 h-4 mr-1" />
                              {formatDate(resume.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {/* {isAdmin && (  // 管理员可以看到历史版本
                                <button
                                  onClick={() => {navigate(`/editor/${resume.id}`);}}
                                  className="text-green-600 hover:text-green-900 p-1 rounded cursor-pointer"
                                  title="编辑"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </button>
                              )} */}
                              <button
                                onClick={() => {navigate(`/editor/v2/${resume.id}`)}}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded cursor-pointer"
                                title="编辑"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              
                              {resume.file_id && (
                                <button
                                  onClick={() => handleDownload(resume)}
                                  className="text-purple-600 hover:text-purple-900 p-1 rounded cursor-pointer"
                                  title="下载"
                                >
                                  <FiDownload className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(resume.id, resume.name)}
                                className="text-red-600 hover:text-red-900 p-1 rounded cursor-pointer"
                                title="删除"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* 历史版本行 */}
                        {isExpanded && group.history.map((historyResume) => (
                          <tr key={historyResume.id} className="bg-gray-50 hover:bg-gray-100">
                            <td className="w-8 px-2 py-4"></td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center pl-4">
                                {/* <FiFileText className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" /> */}
                                <div 
                                  className="text-sm font-medium text-gray-600 hover:underline cursor-pointer" 
                                  onClick={() => {navigate(`/editor/v2/${historyResume.id}`)}}
                                >
                                  {historyResume.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">v{historyResume.version}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-500">
                                <FiCalendar className="w-4 h-4 mr-1" />
                                {formatDate(historyResume.created_at)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                {/* {isAdmin && ( // 管理员可以看到历史版本
                                  <button
                                    onClick={() => {navigate(`/editor/${historyResume.id}`);}}
                                    className="text-green-600 hover:text-green-900 p-1 rounded cursor-pointer"
                                    title="编辑"
                                  >
                                    <FiEdit className="w-4 h-4" />
                                  </button>
                                )} */}
                              
                                <button
                                  onClick={() => {navigate(`/editor/v2/${resume.id}`);}}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded cursor-pointer"
                                  title="编辑"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </button>
                                
                                {historyResume.file_id && (
                                  <button
                                    onClick={() => handleDownload(historyResume)}
                                    className="text-purple-600 hover:text-purple-900 p-1 rounded cursor-pointer"
                                    title="下载"
                                  >
                                    <FiDownload className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(historyResume.id, historyResume.name)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded cursor-pointer"
                                  title="删除"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {total > pageSize && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  共 {total} 条记录，第 {currentPage} 页，每页 {pageSize} 条
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadResumes(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadResumes(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(total / pageSize)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 创建纯文本简历弹窗 */}
        <Modal
          open={showCreateTextModal}
          onClose={() => {
            setShowCreateTextModal(false);
            setTextResumeForm({ name: '', text_content: '' });
          }}
          title="创建纯文本简历"
          size="lg"
          showFooter={true}
          confirmText={uploading ? '创建中...' : '创建简历'}
          cancelText="取消"
          onConfirm={handleCreateTextResume}
          onCancel={() => {
            setShowCreateTextModal(false);
            setTextResumeForm({ name: '', text_content: '' });
          }}
          confirmLoading={uploading}
          confirmDisabled={uploading || !textResumeForm.name.trim() || !textResumeForm.text_content.trim()}
          contentClassName="max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                简历名称 *
              </label>
              <input
                type="text"
                value={textResumeForm.name}
                onChange={(e) => setTextResumeForm({ ...textResumeForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-600 focus:outline-none"
                placeholder="请输入简历名称"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                简历内容 *
              </label>
              <textarea
                value={textResumeForm.text_content}
                onChange={(e) => setTextResumeForm({ ...textResumeForm, text_content: e.target.value })}
                rows={12}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-600 focus:outline-none resize-vertical"
                placeholder="请输入简历内容，包括个人信息、工作经历、教育背景、技能等..."
              />
              <p className="text-sm text-gray-500 mt-1">
                支持纯文本格式，建议包含：个人信息、工作经历、教育背景、专业技能、项目经验等
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ResumeList;

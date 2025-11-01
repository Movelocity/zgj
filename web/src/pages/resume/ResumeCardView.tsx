import React, { useState, useEffect } from 'react';
import { FiUpload, FiCalendar, FiPlus, FiList } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Modal } from '@/components/ui';
import { resumeAPI } from '@/api/resume';
import type { ResumeInfo, ResumeUploadData, CreateTextResumeData } from '@/types/resume';
import { showSuccess, showError, showWarning } from '@/utils/toast';

const ResumeCardView: React.FC = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<ResumeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12); // 卡片视图显示更多
  const [showCreateTextModal, setShowCreateTextModal] = useState(false);
  const [textResumeForm, setTextResumeForm] = useState<CreateTextResumeData>({
    name: '',
    text_content: ''
  });

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
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // 检查文件类型
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      showWarning('请上传 PDF、DOC 或 DOCX 格式的简历文件');
      return;
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showWarning('文件大小不能超过 10MB');
      return;
    }

    try {
      setUploading(true);
      const uploadData: ResumeUploadData = { file };
      const response = await resumeAPI.uploadResume(uploadData);
      
      if (response.code === 0) {
        showSuccess('简历上传成功');
        loadResumes(currentPage);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '简历上传失败');
    } finally {
      setUploading(false);
      // 清空文件输入
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // 删除简历
  // const handleDelete = async (resumeId: string, resumeName: string, event: React.MouseEvent) => {
  //   event.stopPropagation(); // 防止触发卡片点击事件
    
  //   if (!confirm(`确定要删除简历"${resumeName}"吗？此操作无法撤销。`)) {
  //     return;
  //   }

  //   try {
  //     const response = await resumeAPI.deleteResume(resumeId);
  //     if (response.code === 0) {
  //       showSuccess('简历删除成功');
  //       loadResumes(currentPage);
  //     }
  //   } catch (error) {
  //     showError(error instanceof Error ? error.message : '删除简历失败');
  //   }
  // };

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

  // 查看简历详情
  const handleViewResume = (resumeId: string) => {
    navigate(`/resume/${resumeId}`);
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  useEffect(() => {
    loadResumes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">我的简历</h1>
            <Link to="/resumes">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <FiList className="w-4 h-4" />
                <span>列表视图</span>
              </Button>
            </Link>
          </div>
          {/* <p className="mt-2 text-gray-600">点击卡片进入编辑模式</p> */}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">加载中...</p>
          </div>
        ) : (
          <>
            {/* 卡片网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {/* 上传简历卡片 */}
              <div className="group">
                <input
                  type="file"
                  id="resume-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                <div
                  onClick={() => !uploading && document.getElementById('resume-upload')?.click()}
                  className="relative bg-blue-50 rounded-xl p-6 h-48 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:bg-blue-100 border-2 border-dashed border-blue-300 hover:border-blue-400"
                >
                  <FiPlus className="w-12 h-12 text-blue-500 mb-3" />
                  <p className="text-gray-600 font-medium text-center">
                    {uploading ? '上传中...' : '上传简历'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX</p>
                </div>
              </div>

              {/* 创建纯文本简历卡片，当前版本先隐藏 */}
              {/* <div className="group">
                <div
                  onClick={() => setShowCreateTextModal(true)}
                  className="relative bg-blue-50 rounded-xl p-6 h-48 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:bg-blue-100 hover:shadow-lg border-2 border-dashed border-blue-300 hover:border-blue-400"
                >
                  <FiPlus className="w-12 h-12 text-blue-500 mb-3" />
                  <p className="text-blue-600 font-medium text-center">创建简历</p>
                  <p className="text-sm text-blue-500 mt-1">纯文本简历</p>
                </div>
              </div> */}

              {/* 简历卡片 */}
              {resumes.map((resume) => (
                <div key={resume.id} className="group">
                  <div
                    onClick={() => handleViewResume(resume.id)}
                    className="relative bg-white rounded-xl shadow-md p-6 h-48 cursor-pointer transition-all duration-200 hover:shadow-lg border border-gray-200 hover:border-blue-300"
                  >
                    {/* 删除按钮 */}
                    {/* <button
                      onClick={(e) => handleDelete(resume.id, resume.name, e)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                      title="删除简历"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button> */}

                    {/* 卡片内容 */}
                    <div className="flex flex-col h-full">
                      {/* 简历名称 - 大字显示 */}
                      <div className="flex-1 mb-4">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                          {resume.name}
                        </h3>
                      </div>

                      {/* 底部信息 */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          {/* <span>v{resume.version}</span> */}
                          <span>#{resume.resume_number}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <FiCalendar className="w-3 h-3 mr-1" />
                          {formatDate(resume.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {total > pageSize && (
              <div className="mt-12 flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => loadResumes(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center space-x-2"
                >
                  <span>上一页</span>
                </Button>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>第 {currentPage} 页</span>
                  <span>·</span>
                  <span>共 {Math.ceil(total / pageSize)} 页</span>
                  <span>·</span>
                  <span>{total} 个简历</span>
                </div>

                <Button
                  variant="outline"
                  onClick={() => loadResumes(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(total / pageSize)}
                  className="flex items-center space-x-2"
                >
                  <span>下一页</span>
                </Button>
              </div>
            )}

            {/* 空状态 */}
            {resumes.length === 0 && (
              <div className="text-center py-20">
                <div className="text-gray-400 mb-4">
                  <FiUpload className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">还没有简历</p>
                  <p className="text-sm">点击上方卡片开始上传或创建简历</p>
                </div>
              </div>
            )}
          </>
        )}

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

export default ResumeCardView;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiDownload, FiTrash2, FiFileText, FiCalendar, FiUser } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { resumeAPI } from '@/api/resume';
import { fileAPI } from '@/api/file';
import type { ResumeDetail as ResumeDetailType, ResumeUpdateRequest } from '@/types/resume';
import { showSuccess, showError } from '@/utils/toast';

const ResumeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<ResumeUpdateRequest>({});

  // 加载简历详情
  const loadResumeDetail = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await resumeAPI.getResume(id);
      if (response.code === 0 && response.data) {
        setResume(response.data);
        setEditForm({
          name: response.data.name,
          text_content: response.data.text_content,
          structured_data: response.data.structured_data,
        });
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '获取简历详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新简历信息
  const handleUpdate = async () => {
    if (!id) return;

    try {
      const response = await resumeAPI.updateResume(id, editForm);
      if (response.code === 0) {
        showSuccess('简历更新成功');
        setEditing(false);
        loadResumeDetail();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '更新简历失败');
    }
  };

  // 删除简历
  const handleDelete = async () => {
    if (!id || !resume) return;

    if (!confirm(`确定要删除简历"${resume.name}"吗？此操作无法撤销。`)) {
      return;
    }

    try {
      const response = await resumeAPI.deleteResume(id);
      if (response.code === 0) {
        showSuccess('简历删除成功');
        navigate('/resumes');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '删除简历失败');
    }
  };

  // 下载简历
  const handleDownload = () => {
    if (resume?.file_id) {
      const downloadUrl = fileAPI.previewFile(resume.file_id, true);
      window.open(downloadUrl, '_blank');
    } else {
      showError('文件不存在或无法下载');
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

  // 渲染结构化数据
  const renderStructuredData = (data: any) => {
    if (!data || typeof data !== 'object') return null;

    return (
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="border-l-4 border-blue-200 pl-4">
            <h4 className="font-medium text-gray-900 capitalize mb-2">
              {key.replace(/_/g, ' ')}
            </h4>
            {typeof value === 'object' ? (
              <pre className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md overflow-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-600">{String(value)}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    loadResumeDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">简历不存在</h2>
            <p className="text-gray-600 mb-8">您要查看的简历可能已被删除或不存在</p>
            <Button onClick={() => navigate('/resumes')} variant="primary">
              返回简历列表
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              onClick={() => navigate('/resumes')}
              variant="outline"
              className="mr-4"
              icon={<FiArrowLeft className="w-4 h-4" />}
            >
              返回列表
            </Button>
            <div className="flex items-center">
              <Sparkles className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">简历详情</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setEditing(!editing)}
              variant="outline"
              icon={<FiEdit className="w-4 h-4" />}
            >
              {editing ? '取消编辑' : '编辑'}
            </Button>
            {resume.file_id && (
              <Button
                onClick={handleDownload}
                variant="outline"
                icon={<FiDownload className="w-4 h-4" />}
              >
                下载
              </Button>
            )}
            <Button
              onClick={handleDelete}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              icon={<FiTrash2 className="w-4 h-4" />}
            >
              删除
            </Button>
          </div>
        </div>

        {/* 简历信息卡片 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <FiFileText className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-600 focus:outline-none bg-transparent"
                      placeholder="简历名称"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-gray-900">{resume.name}</h2>
                  )}
                  <p className="text-sm text-gray-600 mt-1">{resume.original_filename}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">编号: {resume.resume_number}</div>
                <div className="text-sm text-gray-600">版本: v{resume.version}</div>
              </div>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">创建时间: {formatDate(resume.created_at)}</span>
              </div>
              <div className="flex items-center">
                <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">更新时间: {formatDate(resume.updated_at)}</span>
              </div>
              <div className="flex items-center">
                <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">
                  类型: {resume.file_id ? '文件简历' : '纯文本简历'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 简历内容 */}
        <div className="space-y-6">
          {/* 文本内容 */}
          {resume.text_content && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">文本内容</h3>
              {editing ? (
                <textarea
                  value={editForm.text_content || ''}
                  onChange={(e) => setEditForm({ ...editForm, text_content: e.target.value })}
                  rows={12}
                  className="w-full border border-gray-300 rounded-md p-3 focus:border-blue-600 focus:outline-none resize-vertical"
                  placeholder="简历文本内容..."
                />
              ) : (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                    {resume.text_content}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* 结构化数据 */}
          {resume.structured_data && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">结构化数据</h3>
              {editing ? (
                <div>
                  <textarea
                    value={JSON.stringify(editForm.structured_data || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setEditForm({ ...editForm, structured_data: parsed });
                      } catch {
                        // 忽略JSON解析错误，继续编辑
                      }
                    }}
                    rows={10}
                    className="w-full border border-gray-300 rounded-md p-3 focus:border-blue-600 focus:outline-none resize-vertical font-mono text-sm"
                    placeholder="JSON格式的结构化数据..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    请输入有效的JSON格式数据
                  </p>
                </div>
              ) : (
                renderStructuredData(resume.structured_data)
              )}
            </div>
          )}

          {/* 文件预览 */}
          {resume.file_id && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">文件预览</h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiFileText className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <div className="font-medium">{resume.original_filename}</div>
                      <div className="text-sm text-gray-600">文件ID: {resume.file_id}</div>
                    </div>
                  </div>
                  <Button
                    onClick={() => window.open(fileAPI.previewFile(resume.file_id), '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    在线预览
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 编辑操作按钮 */}
          {editing && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    setEditing(false);
                    setEditForm({
                      name: resume.name,
                      text_content: resume.text_content,
                      structured_data: resume.structured_data,
                    });
                  }}
                  variant="outline"
                >
                  取消
                </Button>
                <Button
                  onClick={handleUpdate}
                  variant="primary"
                >
                  保存更改
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeDetail;

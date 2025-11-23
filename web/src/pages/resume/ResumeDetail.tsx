import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit, FiShare2, FiTrash2, FiFileText, FiCalendar, FiUser } from 'react-icons/fi';
// import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { resumeAPI } from '@/api/resume';
import { fileAPI } from '@/api/file';
import type { ResumeDetail as ResumeDetailType } from '@/types/resume';
import { showSuccess, showError } from '@/utils/toast';

const ResumeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  // const [editing, setEditing] = useState(false);
  // const [editForm, setEditForm] = useState<ResumeUpdateRequest>({});
  const [processingText, setProcessingText] = useState(false);

  // 加载简历详情
  const loadResumeDetail = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await resumeAPI.getResume(id);
      if (response.code === 0 && response.data) {
        setResume(response.data);
        // setEditForm({
        //   name: response.data.name,
        //   text_content: response.data.text_content,
        //   structured_data: response.data.structured_data,
        // });
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '获取简历详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新简历信息
  // const handleUpdate = async () => {
  //   if (!id) return;

  //   try {
  //     const response = await resumeAPI.updateResume(id, editForm);
  //     if (response.code === 0) {
  //       showSuccess('简历更新成功');
  //       // setEditing(false);
  //       loadResumeDetail();
  //     }
  //   } catch (error) {
  //     showError(error instanceof Error ? error.message : '更新简历失败');
  //   }
  // };

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
  // const handleDownload = () => {
  //   if (resume?.file_id) {
  //     const downloadUrl = fileAPI.previewFile(resume.file_id, true);
  //     window.open(downloadUrl, '_blank');
  //   } else {
  //     showError('文件不存在或无法下载');
  //   }
  // };

  // 处理文件转文本
  const handleProcessText = async () => {
    if (!id || !resume?.file_id) return;

    try {
      setProcessingText(true);
      const response = await resumeAPI.resumeFileToText(id);
      if (response.code === 0) {
        showSuccess('文本提取成功');
        // 刷新简历详情
        await loadResumeDetail();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '文本提取失败');
    } finally {
      setProcessingText(false);
    }
  };

  const handleProcessTextToJSON = async () => {
    if (!id || !resume?.text_content) return;
    try {
      setProcessingText(true);
      const response = await resumeAPI.structureTextToJSON(id);
      if (response.code === 0) {
        showSuccess('文本结构化成功');
        // 刷新简历详情
        await loadResumeDetail();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '文本结构化失败');
    } finally {
      setProcessingText(false);
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
          <div key={key} className="px-4">
            <h4 className="font-medium text-gray-900 capitalize mb-2">
              {key.replace(/_/g, ' ')}
            </h4>
            {typeof value === 'object' ? (
              <pre className="text-sm text-gray-600 bg-gray-100 p-3 rounded-md overflow-auto whitespace-pre-wrap">
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
            <Button onClick={() => navigate('/resumes')} variant="default">
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
            <FiFileText className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900 max-w-[400px] truncate">{resume.name}</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => navigate(`/editor/${id}`)}
              variant="outline"
            >
              <FiEdit className="w-4 h-4" />
              编辑
            </Button>
            {resume.file_id && (
              <Button
                onClick={() => window.open(fileAPI.previewFile(resume.file_id), '_blank')}
                variant="outline"
              >
                <FiShare2 className="w-4 h-4" />
                预览源文件
              </Button>
            )}
            <Button
              onClick={handleDelete}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <FiTrash2 className="w-4 h-4" />
              删除
            </Button>
          </div>
        </div>

        {/* 简历内容 */}
        <div className="space-y-6">
          {/* 文本内容 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">文本内容</h3>
              {/* 如果没有文本内容且有文件，显示处理按钮 */}
              {!resume.text_content && resume.file_id && (
                <Button
                  onClick={handleProcessText}
                  variant="default"
                  size="sm"
                  disabled={processingText}
                >
                  <FiFileText className="w-4 h-4" />
                  {processingText ? '处理中...' : '提取文本'}
                </Button>
              )}
              {resume.text_content && !resume.structured_data && (
                <Button
                  onClick={handleProcessTextToJSON}
                  variant="default"
                  disabled={processingText}
                  size="sm"
                >
                  <FiFileText className="w-4 h-4" />
                  文本结构化
                </Button>
              )}
            </div>
            
            {resume.text_content ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {resume.text_content}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {resume.file_id ? (
                  <div>
                    <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">文本内容尚未提取</p>
                    <p className="text-xs text-gray-400 mt-1">点击上方"提取文本"按钮来解析文件内容</p>
                  </div>
                ) : (
                  <div>
                    <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">此简历没有关联的文件</p>
                    <p className="text-xs text-gray-400 mt-1">纯文本简历或文件已丢失</p>
                  </div>
                )}
              </div>
            )}

            {/* 编辑操作按钮 */}
            {/* {editing && (
              <div className="flex justify-end space-x-3 mt-4">
                <Button onClick={() => setEditing(false)} variant="outline">取消</Button>
                <Button onClick={handleUpdate} variant="primary">保存更改</Button>
              </div>
            )} */}
          </div>

          {/* 结构化数据 */}
          {resume.structured_data && (
            <div className="bg-white rounded-lg shadow-md py-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 ml-4">结构化数据</h3>
              {renderStructuredData(resume.structured_data)}
            </div>
          )}

        </div>
      </div>

      {/* 基本信息 */}
      <div className="bg-gray-50 max-w-[900px] mx-auto">
        <div className="flex w-full justify-between gap-4 text-sm px-16 py-8">
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
  );
};

export default ResumeDetail;

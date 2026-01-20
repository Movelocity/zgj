import apiClient from './client';
import type { ResumeData } from '@/types/resume';

/**
 * 创建PDF导出任务
 * @param resumeId 简历ID
 * @param resumeData 可选：当前简历数据快照（用于确保导出内容与当前编辑内容一致）
 */
export const createExportTask = (resumeId: string, resumeData?: ResumeData) => {
  return apiClient.post('/api/resume/export/create', { 
    resume_id: resumeId,
    resume_data: resumeData // 传递简历数据快照
  });
};

/**
 * 查询导出任务状态
 */
export const getExportTaskStatus = (taskId: string) => {
  return apiClient.get(`/api/resume/export/status/${taskId}`);
};

/**
 * 下载PDF文件（触发浏览器下载）
 * 通过apiClient请求，自动携带认证信息
 */
export const downloadExportPdf = async (taskId: string, filename: string = 'resume.pdf') => {
  try {
    // 使用apiClient请求文件，设置responseType为blob
    const response = await apiClient.get(`/api/resume/export/download/${taskId}`, {
      responseType: 'blob', // 关键：告诉axios返回blob数据
    });

    // 创建blob对象URL
    const blob = new Blob([response as any], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    // 创建临时<a>标签触发下载
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下载PDF失败:', error);
    throw error;
  }
};


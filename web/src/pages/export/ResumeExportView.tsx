import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import apiClient from '@/api/client';
import type { ResumeV2Data } from '@/types/resumeV2';
import ResumeEditorV2 from '../editor/components/ResumeEditor';

/**
 * 简历导出渲染页面
 * 专门用于PDF导出，通过token验证访问
 */
export default function ResumeExportView() {
  const { taskId } = useParams<{ taskId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [resumeData, setResumeData] = useState<ResumeV2Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResumeData = async () => {
      if (!taskId || !token) {
        setError('缺少必要参数');
        setLoading(false);
        return;
      }

      try {
        // 调用验证API获取简历数据
        const response: any = await apiClient.get(
          `/api/resume/export/verify/${taskId}?token=${token}`
        );

        if (response.code === 0 && response.data) {
          setResumeData(response.data);
        } else {
          setError(response.msg || '获取简历数据失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '页面已失效');
      } finally {
        setLoading(false);
      }
    };

    fetchResumeData();
  }, [taskId, token]);

  // 在组件挂载后标记渲染完成
  useEffect(() => {
    if (resumeData && !loading && !error) {
      // 延迟一点时间确保所有样式和图片都加载完成
      const timer = setTimeout(() => {
        document.body.setAttribute('data-pdf-ready', 'true');
        console.log('[PDF Export] 页面渲染完成');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resumeData, loading, error]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !resumeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <p className="text-gray-800 font-medium">{error || '页面已失效'}</p>
        </div>
      </div>
    );
  }

  // 渲染简历内容（使用与编辑器相同的组件，但只读模式）
  return (
    <div className="min-h-screen bg-white">
      <style>{`
        /* 确保打印样式正确 */
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
        
        /* 隐藏所有交互元素 */
        button, .toolbar, .controls {
          display: none !important;
        }
      `}</style>
      
      <div className="mx-auto">
        <ResumeEditorV2
          resumeData={resumeData}
          newResumeData={resumeData}
          onResumeDataChange={() => {}} // 只读，不处理变更
          onNewResumeDataChange={() => {}} // 只读，不处理变更
          fontSettings={{
            titleSize: 'medium',
            labelSize: 'medium',
            contentSize: 'medium',
          }}
          tightLayout={true}
        />
      </div>
    </div>
  );
}


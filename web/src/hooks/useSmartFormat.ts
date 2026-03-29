import { useRef, useState, useCallback } from 'react';
import { workflowAPI } from '@/api/workflow';
import { parseAndFixResumeJson } from '@/utils/helpers';
import type { ResumeData } from '@/types/resume';

/**
 * 异步调用 smart-format-2 工作流，将 AI 建议合并到简历结构中。
 * 特性：
 * - 新任务自动取消正在进行的旧任务
 * - 异步执行，不阻塞 UI 交互
 */
export function useSmartFormat(onResult: (data: ResumeData) => void) {
  const [isFormatting, setIsFormatting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // 用 ref 持有回调，避免 format 函数因 onResult 变化而重新创建
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const format = useCallback(async (currentResume: ResumeData, editContent: string) => {
    // 取消上一个正在进行的任务
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsFormatting(true);

    try {
      const result = await workflowAPI.executeWorkflow_v2({
        id: 'smart-format-2',
        inputs: {
          current_resume: JSON.stringify(currentResume),
          resume_edit: editContent,
        },
        idAsName: true,
        signal: controller.signal,
      });

      // 被取消时直接返回，不处理结果
      if (controller.signal.aborted) return;

      if (result.code === 0) {
        const output = result.data.data.outputs?.output;
        if (output && typeof output === 'string') {
          onResultRef.current(parseAndFixResumeJson(output));
        }
      } else {
        console.error('[useSmartFormat] 工作流返回错误:', result.msg);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error('[useSmartFormat] 格式化失败:', err);
    } finally {
      // 只有当前任务未被取消时才清理状态
      if (!controller.signal.aborted) {
        setIsFormatting(false);
        abortRef.current = null;
      }
    }
  }, []);

  return { isFormatting, format };
}

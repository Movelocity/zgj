import React, { useState, useCallback } from 'react';
import { workflowAPI } from '@/api/workflow';
import { showSuccess, showError, showInfo } from '@/utils/toast';

interface StreamWorkflowExecutorProps {
  workflowId: string;
  inputs: Record<string, any>;
  onComplete?: (outputs: any) => void;
  onProgress?: (event: any) => void;
}

export const StreamWorkflowExecutor: React.FC<StreamWorkflowExecutorProps> = ({
  workflowId,
  inputs,
  onComplete,
  onProgress
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);

  const executeWorkflow = useCallback(async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    setProgress('开始执行工作流...');
    setEvents([]);

    try {
      await workflowAPI.executeWorkflowStream({
        id: workflowId,
        inputs,
        onMessage: (data) => {
          console.log('Received event:', data);
          setEvents(prev => [...prev, data]);
          onProgress?.(data);

          // 处理不同类型的事件
          switch (data.event) {
            case 'workflow_started':
              setProgress('工作流已启动');
              showInfo('工作流开始执行');
              break;
            
            case 'node_started':
              setProgress(`节点开始执行: ${data.data?.node_name || '未知节点'}`);
              break;
            
            case 'node_finished':
              setProgress(`节点执行完成: ${data.data?.node_name || '未知节点'}`);
              break;
            
            case 'workflow_finished':
              setProgress('工作流执行完成');
              showSuccess('工作流执行成功');
              onComplete?.(data.data?.outputs);
              break;
            
            case 'error':
              setProgress(`执行错误: ${data.data?.message || '未知错误'}`);
              showError(data.data?.message || '工作流执行失败');
              break;
            
            default:
              setProgress(`收到事件: ${data.event}`);
              break;
          }
        },
        // onError callback
        onError: (error) => {
          console.error('Stream error:', error);
          setProgress(`执行失败: ${error.message}`);
          showError(`工作流执行失败: ${error.message}`);
        }
      });
    } catch (error: any) {
      console.error('Execution error:', error);
      setProgress(`执行失败: ${error.message}`);
      showError(`工作流执行失败: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [workflowId, inputs, isExecuting, onComplete, onProgress]);

  return (
    <div className="stream-workflow-executor">
      <div className="mb-4">
        <button
          onClick={executeWorkflow}
          disabled={isExecuting}
          className={`px-4 py-2 rounded ${
            isExecuting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isExecuting ? '执行中...' : '执行工作流'}
        </button>
      </div>

      {progress && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <div className="text-sm text-gray-600">状态</div>
          <div className="font-medium">{progress}</div>
        </div>
      )}

      {events.length > 0 && (
        <div className="border rounded">
          <div className="p-3 bg-gray-50 border-b">
            <h3 className="font-medium">执行日志</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {events.map((event, index) => (
              <div key={index} className="p-3 border-b last:border-b-0">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm text-blue-600">
                    {event.event}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                {event.data && (
                  <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamWorkflowExecutor;

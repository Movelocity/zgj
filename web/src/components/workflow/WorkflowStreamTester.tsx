import React, { useState, useCallback, useEffect } from 'react';
import { workflowAPI } from '@/api/workflow';
import { showSuccess, showError, showInfo } from '@/utils/toast';
import { Button } from '@/components/ui';

interface WorkflowStreamTesterProps {
  workflowId: string;
  inputsTemplate: string; // JSON字符串格式的inputs模板
}

export const WorkflowStreamTester: React.FC<WorkflowStreamTesterProps> = ({
  workflowId,
  inputsTemplate,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  const [inputsJson, setInputsJson] = useState('{}');
  const [parsedInputs, setParsedInputs] = useState<Record<string, any>>({});
  const [jsonError, setJsonError] = useState('');

  // 初始化时解析输入模板
  useEffect(() => {
    try {
      const template = JSON.parse(inputsTemplate || '{}');
      // 从模板生成测试用的输入数据
      const testInputs = generateTestInputs(template);
      const testInputsJson = JSON.stringify(testInputs, null, 2);
      setInputsJson(testInputsJson);
      setParsedInputs(testInputs);
      setJsonError('');
    } catch (error) {
      console.warn('Failed to parse inputs template:', error);
      setInputsJson('{}');
      setParsedInputs({});
    }
  }, [inputsTemplate]);

  // 根据输入模板生成测试数据
  const generateTestInputs = (template: Record<string, any>): Record<string, any> => {
    const testInputs: Record<string, any> = {};
    
    Object.entries(template).forEach(([key, config]) => {
      if (typeof config === 'object' && config !== null) {
        const fieldType = config.field_type || 'string';
        
        switch (fieldType) {
          case 'string':
            testInputs[key] = `测试${key}`;
            break;
          case 'number':
            testInputs[key] = 123;
            break;
          case 'boolean':
            testInputs[key] = true;
            break;
          case 'array':
            testInputs[key] = [`测试${key}项目1`, `测试${key}项目2`];
            break;
          case 'object':
            testInputs[key] = { example: `测试${key}对象` };
            break;
          default:
            testInputs[key] = `测试${key}`;
        }
      } else {
        // 如果不是配置对象，直接使用值
        testInputs[key] = config;
      }
    });

    return testInputs;
  };

  // 处理输入JSON变化
  const handleInputsChange = (value: string) => {
    setInputsJson(value);
    
    try {
      const parsed = JSON.parse(value || '{}');
      setParsedInputs(parsed);
      setJsonError('');
    } catch (error) {
      setJsonError('JSON格式错误');
      setParsedInputs({});
    }
  };

  const executeWorkflow = useCallback(async () => {
    if (isExecuting || jsonError || !workflowId) return;

    setIsExecuting(true);
    setProgress('开始执行工作流...');
    setEvents([]);

    try {
      await workflowAPI.executeWorkflowStream({
        id: workflowId,
        inputs: parsedInputs,
        onMessage: (data) => {
          console.log('Received event:', data);
          setEvents(prev => [...prev, { ...data, timestamp: new Date().toISOString() }]);

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

            case 'text_chunk':
              setProgress('正在生成内容...');
              break;
            
            case 'workflow_finished':
              setProgress('工作流执行完成');
              showSuccess('工作流执行成功');
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
  }, [workflowId, parsedInputs, isExecuting, jsonError]);

  const clearLogs = () => {
    setEvents([]);
    setProgress('');
  };

  return (
    <div className="workflow-stream-tester grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-4">
        {/* 工作流信息 */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h5 className="text-sm font-medium text-gray-700 mb-2">工作流信息</h5>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <span className="text-gray-500">工作流ID:</span>
              <span className="ml-2 font-mono text-xs">{workflowId || '未指定'}</span>
            </div>
          </div>
        </div>

        {/* 输入参数配置 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输入参数 (JSON格式)
          </label>
          <textarea
            value={inputsJson}
            onChange={(e) => handleInputsChange(e.target.value)}
            rows={8}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
              jsonError ? 'border-red-500' : ''
            }`}
            placeholder='{"query": "测试查询", "content": "测试内容"}'
          />
          {jsonError && (
            <p className="mt-1 text-sm text-red-600">{jsonError}</p>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="flex gap-3">
          <Button
            onClick={executeWorkflow}
            disabled={isExecuting || !!jsonError || !workflowId}
            variant={isExecuting ? 'secondary' : 'default'}
            className="flex-1"
          >
            {isExecuting ? '执行中...' : '开始执行'}
          </Button>
          
        </div>
      </div>

      {/* 执行日志 */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <div className="py-1 px-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <span className="flex gap-2"> 
            <span className="font-medium">执行日志</span>
            <div className="font-medium text-blue-800">{progress}</div>
          </span>
          <span className="flex gap-2 items-center">
            <span className="text-sm text-gray-500">{events.length} 条事件</span>
            <Button
              onClick={clearLogs}
              size="sm"
              variant="outline"
              disabled={isExecuting}
            >
              清空日志
            </Button>
          </span>
          
        </div>
        <div className="max-h-[56vh] overflow-y-auto">
          {events.map((event, index) => (
            <div key={index} className="p-3 border-b last:border-b-0 border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm text-blue-600">
                  {event.event}
                </span>
                <span className="text-xs text-gray-500">
                  {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>
              
              {/* 特殊处理文本块事件 */}
              {event.event === 'text_chunk' && event.data?.text && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <div className="text-sm text-green-800 whitespace-pre-wrap">
                    {event.data.text}
                  </div>
                </div>
              )}
              
              {/* 工作流完成事件的特殊显示 */}
              {event.event === 'workflow_finished' && event.data?.outputs && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <div className="text-xs text-green-600 mb-1">输出结果:</div>
                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.data.outputs, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* 错误事件的特殊显示 */}
              {event.event === 'error' && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="text-xs text-red-600 mb-1">错误信息:</div>
                  <div className="text-sm text-red-800">
                    {event.data?.message || '未知错误'}
                  </div>
                </div>
              )}
              
              {/* 通用数据显示 */}
              {event.data && event.event !== 'text_chunk' && event.event !== 'workflow_finished' && event.event !== 'error' && (
                <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div> 
    </div>
  );
};

export default WorkflowStreamTester;

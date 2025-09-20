import React, { useState, useEffect } from 'react';
import { FiPlay, FiLoader, FiCopy, FiCheck } from 'react-icons/fi';
import { workflowAPI } from '@/api/workflow';
import { showSuccess, showError } from '@/utils/toast';
import type { Workflow } from '@/types/workflow';
import { Button, Modal } from '@/components/ui';

interface WorkflowDebugModalProps {
  workflow: Workflow;
  onClose: () => void;
}

interface ExecutionResult {
  success: boolean;
  data: any;
  message: string;
  executionTime?: number;
}

const WorkflowDebugModal: React.FC<WorkflowDebugModalProps> = ({ workflow, onClose }) => {
  const [inputJson, setInputJson] = useState('{\n  \n}');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);

  // 格式化JSON
  const formatJson = () => {
    try {
      const parsed = JSON.parse(inputJson);
      setInputJson(JSON.stringify(parsed, null, 2));
      showSuccess('JSON格式化成功');
    } catch (error) {
      showError('JSON格式错误，无法格式化');
    }
  };

  // 执行工作流
  const executeWorkflow = async () => {
    try {
      // 验证JSON格式
      let inputs;
      try {
        inputs = JSON.parse(inputJson);
      } catch (error) {
        showError('输入的JSON格式不正确');
        return;
      }

      setIsExecuting(true);
      setResult(null);

      const startTime = Date.now();
      const response = await workflowAPI.executeWorkflow(workflow.id, inputs);
      const executionTime = Date.now() - startTime;

      if (response.code === 0) {
        setResult({
          ...response.data,
          executionTime
        });
        showSuccess('工作流执行完成');
      } else {
        setResult({
          success: false,
          data: {},
          message: response.msg || '执行失败',
          executionTime
        });
        showError(response.msg || '工作流执行失败');
      }
    } catch (error: any) {
      const executionTime = Date.now();
      setResult({
        success: false,
        data: {},
        message: error.message || '网络请求失败',
        executionTime
      });
      showError('工作流执行失败');
      console.error('工作流执行失败:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  // 复制结果到剪贴板
  const copyResult = async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      showSuccess('结果已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showError('复制失败');
    }
  };

  // 设置示例输入
  const setExampleInput = () => {
    setInputJson(JSON.stringify(workflow.inputs || '{\n  \n}', null, 2));
  };

  useEffect(() => {
    setExampleInput();
  }, [workflow]);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="工作流调试"
      size="full"
      showFooter={true}
      cancelText="关闭"
    >
      <div className="p-6">
        {/* 工作流信息 */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <p className="text-sm text-gray-500">
            {workflow.name} - {workflow.description || '无描述'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：输入配置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">输入参数</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setExampleInput}
                >
                  示例
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={formatJson}
                >
                  格式化
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                JSON输入 (inputs参数)
              </label>
              <textarea
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入JSON格式的参数"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">API信息</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>URL:</strong> {workflow.api_url}</div>
                <div><strong>Method:</strong> POST</div>
                <div><strong>Auth:</strong> Bearer Token</div>
              </div>
            </div>

            <Button
              onClick={executeWorkflow}
              disabled={isExecuting}
              className="w-full flex items-center justify-center"
            >
              {isExecuting ? (
                <>
                  <FiLoader className="mr-2 animate-spin" />
                  执行中...
                </>
              ) : (
                <>
                  <FiPlay className="mr-2" />
                  执行工作流
                </>
              )}
            </Button>
          </div>

          {/* 右侧：执行结果 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">执行结果</h3>
              {result && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyResult}
                  className="flex items-center"
                >
                  {copied ? <FiCheck className="mr-1" /> : <FiCopy className="mr-1" />}
                  {copied ? '已复制' : '复制'}
                </Button>
              )}
            </div>

            {result ? (
              <div className="space-y-4">
                {/* 执行状态 */}
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    result.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? '成功' : '失败'}
                  </span>
                  {result.executionTime && (
                    <span className="text-sm text-gray-500">
                      耗时: {result.executionTime}ms
                    </span>
                  )}
                </div>

                {/* 消息 */}
                {result.message && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-700">{result.message}</p>
                  </div>
                )}

                {/* 详细结果 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    详细结果
                  </label>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* 输出数据 */}
                {result.success && result.data && Object.keys(result.data).length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      输出数据
                    </label>
                    <div className="bg-blue-50 p-4 rounded-md overflow-auto">
                      <pre className="text-xs text-blue-900 whitespace-pre-wrap">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md">
                <p className="text-gray-500">点击"执行工作流"查看结果</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WorkflowDebugModal;

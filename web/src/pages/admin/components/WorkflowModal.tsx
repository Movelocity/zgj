import React, { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import { adminAPI } from '@/api/admin';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui';
import type { Workflow, CreateWorkflowRequest, UpdateWorkflowRequest } from '@/types/workflow';

interface WorkflowModalProps {
  mode: 'create' | 'edit' | 'view';
  workflow: Workflow | null;
  onClose: (refresh?: boolean) => void;
}

const WorkflowModal: React.FC<WorkflowModalProps> = ({ mode, workflow, onClose }) => {
  const [formData, setFormData] = useState<CreateWorkflowRequest>({
    api_url: '',
    api_key: '',
    name: '',
    description: '',
    inputs: {},
    outputs: {},
    is_public: false,
    enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [inputsJson, setInputsJson] = useState('{}');
  const [outputsJson, setOutputsJson] = useState('{}');
  const [jsonErrors, setJsonErrors] = useState({ inputs: '', outputs: '' });

  const isReadonly = mode === 'view';
  const title = mode === 'create' ? '创建工作流' : mode === 'edit' ? '编辑工作流' : '工作流详情';

  useEffect(() => {
    if (workflow && (mode === 'edit' || mode === 'view')) {
      setFormData({
        api_url: workflow.api_url,
        api_key: workflow.api_key,
        name: workflow.name,
        description: workflow.description,
        inputs: workflow.inputs,
        outputs: workflow.outputs,
        is_public: workflow.is_public,
        enabled: workflow.enabled,
      });
      setInputsJson(JSON.stringify(workflow.inputs || {}, null, 2));
      setOutputsJson(JSON.stringify(workflow.outputs || {}, null, 2));
    }
  }, [workflow, mode]);

  // 处理表单字段变化
  const handleFieldChange = (field: keyof CreateWorkflowRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 处理JSON输入变化
  const handleJsonChange = (type: 'inputs' | 'outputs', value: string) => {
    if (type === 'inputs') {
      setInputsJson(value);
    } else {
      setOutputsJson(value);
    }

    // 验证JSON格式
    try {
      const parsed = JSON.parse(value || '{}');
      setFormData(prev => ({ ...prev, [type]: parsed }));
      setJsonErrors(prev => ({ ...prev, [type]: '' }));
    } catch (error) {
      setJsonErrors(prev => ({ ...prev, [type]: 'JSON格式错误' }));
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isReadonly) return;

    // 检查JSON格式错误
    if (jsonErrors.inputs || jsonErrors.outputs) {
      showError('请修正JSON格式错误');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (mode === 'create') {
        response = await adminAPI.createWorkflow(formData);
      } else {
        const updateData: UpdateWorkflowRequest = { ...formData };
        response = await adminAPI.updateWorkflowAsAdmin(workflow!.id, updateData);
      }

      if (response.code === 0) {
        showSuccess(mode === 'create' ? '创建工作流成功' : '更新工作流成功');
        onClose(true);
      } else {
        showError(response.msg || `${mode === 'create' ? '创建' : '更新'}工作流失败`);
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.msg || error?.message || `${mode === 'create' ? '创建' : '更新'}工作流失败`;
      showError(errorMsg);
      console.error('工作流操作失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <Button
            variant="ghost"
            onClick={() => onClose()}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-6 h-6" />
          </Button>
        </div>

        {/* 模态框内容 */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">基本信息</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工作流名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    readOnly={isReadonly}
                    required
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isReadonly ? 'bg-gray-50' : ''
                    }`}
                    placeholder="请输入工作流名称"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    工作流描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    readOnly={isReadonly}
                    rows={3}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isReadonly ? 'bg-gray-50' : ''
                    }`}
                    placeholder="请输入工作流描述"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API地址 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.api_url}
                    onChange={(e) => handleFieldChange('api_url', e.target.value)}
                    readOnly={isReadonly}
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isReadonly ? 'bg-gray-50' : ''
                    }`}
                    placeholder="http://112.74.74.13:30090/v1/chat-messages"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API密钥 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.api_key}
                    onChange={(e) => handleFieldChange('api_key', e.target.value)}
                    readOnly={isReadonly}
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isReadonly ? 'bg-gray-50' : ''
                    }`}
                    placeholder="请输入API密钥"
                  />
                </div>
              </div>

              {/* 配置选项 */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">配置选项</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => handleFieldChange('enabled', e.target.checked)}
                      disabled={isReadonly}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-700">启用工作流</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => handleFieldChange('is_public', e.target.checked)}
                      disabled={isReadonly}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-700">公开工作流</span>
                  </label>
                </div>

                {/* 工作流统计信息（仅查看和编辑模式显示） */}
                {workflow && (mode === 'view' || mode === 'edit') && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">统计信息</h5>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">使用次数:</span>
                        <span className="ml-2 font-medium">{workflow.used}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">创建时间:</span>
                        <span className="ml-2 font-medium">
                          {new Date(workflow.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">更新时间:</span>
                        <span className="ml-2 font-medium">
                          {new Date(workflow.updated_at).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">创建者ID:</span>
                        <span className="ml-2 font-medium">{workflow.creator_id || '系统'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* JSON配置 */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">参数配置</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    输入参数 (JSON格式)
                  </label>
                  <textarea
                    value={inputsJson}
                    onChange={(e) => handleJsonChange('inputs', e.target.value)}
                    readOnly={isReadonly}
                    rows={8}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                      isReadonly ? 'bg-gray-50' : ''
                    } ${jsonErrors.inputs ? 'border-red-500' : ''}`}
                    placeholder='{"field_name": {"field_type": "string", "required": true}}'
                  />
                  {jsonErrors.inputs && (
                    <p className="mt-1 text-sm text-red-600">{jsonErrors.inputs}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    输出参数 (JSON格式)
                  </label>
                  <textarea
                    value={outputsJson}
                    onChange={(e) => handleJsonChange('outputs', e.target.value)}
                    readOnly={isReadonly}
                    rows={8}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                      isReadonly ? 'bg-gray-50' : ''
                    } ${jsonErrors.outputs ? 'border-red-500' : ''}`}
                    placeholder='{"field_name": {"field_type": "string", "required": true}}'
                  />
                  {jsonErrors.outputs && (
                    <p className="mt-1 text-sm text-red-600">{jsonErrors.outputs}</p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* 模态框底部 */}
        <div className="flex items-center justify-end space-x-3 p-3 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={() => onClose()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {isReadonly ? '关闭' : '取消'}
          </Button>
          {!isReadonly && (
            <Button
              variant="primary"
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !!jsonErrors.inputs || !!jsonErrors.outputs}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              <FiSave className="mr-2" />
              {mode === 'create' ? '创建' : '保存'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowModal;

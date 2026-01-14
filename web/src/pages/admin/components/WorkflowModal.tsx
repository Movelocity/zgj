import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/api/admin';
import { showSuccess, showError } from '@/utils/toast';
import { Modal, Button } from '@/components/ui';
import { WorkflowStreamTester } from '@/components/workflow/WorkflowStreamTester';
import type { Workflow, CreateWorkflowRequest, UpdateWorkflowRequest } from '@/types/workflow';

interface WorkflowModalProps {
  mode: 'create' | 'edit';
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

  const title = mode === 'create' ? '创建工作流' : mode === 'edit' ? '编辑工作流' : '工作流详情';

  useEffect(() => {
    if (workflow && (mode === 'edit')) {
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


  const handleConfirm = async () => {

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

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  return (
    <Modal
      open={true}
      onClose={() => onClose()}
      title={title}
      size="xl"
      showFooter={true}
      confirmText={mode === 'create' ? '创建' : '保存'}
      cancelText={'取消'}
      onConfirm={handleConfirm}
      confirmLoading={loading}
      confirmDisabled={!!jsonErrors.inputs || !!jsonErrors.outputs}
    >
      <div className="p-6 space-y-6">
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
                required
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                rows={3}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="http://dify.hollway.fun/v1/workflows/run"
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
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="请输入API密钥"
              />
            </div>
          </div>

          {/* 配置选项 */}
          <div className="space-y-4">

            {/* 输入参数 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                输入参数示例 (JSON格式)
              </label>
              <textarea
                value={inputsJson}
                onChange={(e) => handleJsonChange('inputs', e.target.value)}
                rows={8}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${jsonErrors.inputs ? 'border-red-500' : ''}`}
                placeholder='{"field_name": {"field_type": "string", "required": true}}'
              />
              {jsonErrors.inputs && (
                <p className="mt-1 text-sm text-red-600">{jsonErrors.inputs}</p>
              )}
            </div>

            {/* 输出参数 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                输出参数示例 (JSON格式)
              </label>
              <textarea
                value={outputsJson}
                onChange={(e) => handleJsonChange('outputs', e.target.value)}
                rows={8}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${jsonErrors.outputs ? 'border-red-500' : ''}`}
                placeholder='{"field_name": {"field_type": "string", "required": true}}'
              />
              {jsonErrors.outputs && (
                <p className="mt-1 text-sm text-red-600">{jsonErrors.outputs}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => handleFieldChange('enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700">启用工作流</span>
              </label>
              

              {mode === 'edit' && (
                <div className="flex items-center">
                  <Button 
                    variant="outline"
                    className="ml-2 text-sm " 
                    onClick={() => setIsTestModalOpen(true)}
                    disabled={!formData.api_url || !formData.api_key || !!jsonErrors.inputs}
                  >
                    流式调用
                  </Button>
                  {isTestModalOpen && (
                    <Modal
                      open={isTestModalOpen}
                      onClose={() => setIsTestModalOpen(false)}
                      title="流式工作流测试"
                      size="full"
                      showFooter={false}
                    >
                      <div className="p-6">
                        <WorkflowStreamTester
                          workflowId={workflow?.id || 'test-workflow'}
                          inputsTemplate={inputsJson}
                        />
                      </div>
                    </Modal>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* 工作流统计信息（仅编辑模式显示） */}
        {workflow && (mode === 'edit') && (
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
    </Modal>
  );
};

export default WorkflowModal;

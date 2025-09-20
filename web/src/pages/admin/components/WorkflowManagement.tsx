import React, { useState, useEffect } from 'react';
import { FiPlus, FiPlay } from 'react-icons/fi';
import { adminAPI } from '@/api/admin';
import { showSuccess, showError } from '@/utils/toast';
import type { Workflow } from '@/types/workflow';
import { Button } from '@/components/ui';
import WorkflowModal from './WorkflowModal';
import WorkflowDebugModal from '@/components/modals/WorkflowDebugModal';

const WorkflowManagement: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugWorkflow, setDebugWorkflow] = useState<Workflow | null>(null);

  // 获取工作流列表
  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllWorkflows();
      if (response.code === 0) {
        setWorkflows(response.data);
      } else {
        showError(response.msg || '获取工作流列表失败');
      }
    } catch (error) {
      showError('获取工作流列表失败');
      console.error('获取工作流列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // 创建工作流
  const handleCreate = () => {
    setModalMode('create');
    setSelectedWorkflow(null);
    setModalOpen(true);
  };

  // 编辑工作流
  const handleEdit = (workflow: Workflow) => {
    setModalMode('edit');
    setSelectedWorkflow(workflow);
    setModalOpen(true);
  };

  // // 查看工作流
  // const handleView = (workflow: Workflow) => {
  //   setModalMode('view');
  //   setSelectedWorkflow(workflow);
  //   setModalOpen(true);
  // };

  // 删除工作流
  const handleDelete = async (workflow: Workflow) => {
    if (!confirm(`确定要删除工作流 "${workflow.name}" 吗？`)) {
      return;
    }

    try {
      const response = await adminAPI.deleteWorkflow(workflow.id);
      if (response.code === 0) {
        showSuccess('删除工作流成功');
        fetchWorkflows();
      } else {
        showError(response.msg || '删除工作流失败');
      }
    } catch (error) {
      showError('删除工作流失败');
      console.error('删除工作流失败:', error);
    }
  };

  // 切换工作流启用状态
  const handleToggleEnabled = async (workflow: Workflow) => {
    try {
      const response = await adminAPI.updateWorkflowAsAdmin(workflow.id, {
        enabled: !workflow.enabled
      });
      if (response.code === 0) {
        showSuccess(`工作流已${workflow.enabled ? '禁用' : '启用'}`);
        fetchWorkflows();
      } else {
        showError(response.msg || '更新工作流状态失败');
      }
    } catch (error) {
      showError('更新工作流状态失败');
      console.error('更新工作流状态失败:', error);
    }
  };

  // 调试工作流
  const handleDebug = (workflow: Workflow) => {
    setDebugWorkflow(workflow);
    setDebugModalOpen(true);
  };

  // 模态框关闭回调
  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedWorkflow(null);
    if (refresh) {
      fetchWorkflows();
    }
  };

  // 调试模态框关闭回调
  const handleDebugModalClose = () => {
    setDebugModalOpen(false);
    setDebugWorkflow(null);
  };

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">工作流API配置</h2>
        </div>
        <Button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          创建工作流
        </Button>
      </div>

      {/* 工作流列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">加载中...</p>
          </div>
        ) : workflows?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            暂无工作流
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    工作流信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    使用次数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workflows?.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {workflow.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {workflow.description || '无描述'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          API: {workflow.api_url}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          workflow.enabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {workflow.enabled ? '启用' : '禁用'}
                        </span>
                        {/* <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          workflow.is_public 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {workflow.is_public ? '公开' : '私有'}
                        </span> */}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {workflow.used}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex">
                        <Button
                          variant="text"
                          onClick={() => handleEdit(workflow)}
                          title="编辑"
                        >
                          编辑
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => handleDebug(workflow)}
                          className="text-green-600 hover:text-green-900"
                          title="调试工作流"
                        >
                          <FiPlay className="mr-1" size={14} />
                          调试
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => handleToggleEnabled(workflow)}
                          title={workflow.enabled ? '禁用' : '启用'}
                        >
                          {workflow.enabled ? (
                            '启用'
                          ) : (
                            '禁用'
                          )}
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => handleDelete(workflow)}
                          className="text-red-600 hover:text-red-900"
                          title="删除"
                        >
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 工作流模态框 */}
      {modalOpen && (
        <WorkflowModal
          mode={modalMode}
          workflow={selectedWorkflow}
          onClose={handleModalClose}
        />
      )}

      {/* 调试模态框 */}
      {debugModalOpen && debugWorkflow && (
        <WorkflowDebugModal
          workflow={debugWorkflow}
          onClose={handleDebugModalClose}
        />
      )}
    </div>
  );
};

export default WorkflowManagement;

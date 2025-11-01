import React, { useState, useRef } from 'react';
import { FiDownload, FiUpload } from 'react-icons/fi';
import { Button, Modal } from '@/components/ui';
import { showSuccess, showError } from '@/utils/toast';
import { WorkflowBackupUtils } from '@/utils/workflowBackup';
import { adminAPI } from '@/api/admin';
import WorkflowConflictModal from './WorkflowConflictModal';
import type { 
  Workflow, 
  WorkflowBackupFile, 
  WorkflowConflict,
  WorkflowImportResult,
  CreateWorkflowRequest 
} from '@/types/workflow';

interface WorkflowBackupModalProps {
  workflows: Workflow[];
  onClose: () => void;
  onRefresh?: () => void;
}

const WorkflowBackupModal: React.FC<WorkflowBackupModalProps> = ({
  workflows,
  onClose,
  onRefresh,
}) => {
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [conflicts, setConflicts] = useState<WorkflowConflict[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [importData, setImportData] = useState<WorkflowBackupFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 选择/取消选择工作流
  const handleWorkflowSelect = (workflowId: string, selected: boolean) => {
    setSelectedWorkflows(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(workflowId);
      } else {
        newSet.delete(workflowId);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedWorkflows.size === workflows.length) {
      setSelectedWorkflows(new Set());
    } else {
      setSelectedWorkflows(new Set(workflows.map(w => w.id)));
    }
  };

  // 导出工作流
  const handleExport = () => {
    try {
      const selectedWorkflowList = workflows.filter(w => selectedWorkflows.has(w.id));
      if (selectedWorkflowList.length === 0) {
        showError('请至少选择一个工作流进行导出');
        return;
      }

      WorkflowBackupUtils.exportWorkflows(selectedWorkflowList);
      showSuccess(`成功导出 ${selectedWorkflowList.length} 个工作流`);
    } catch (error) {
      showError('导出失败: ' + (error as Error).message);
    }
  };

  // 选择导入文件
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const backupData = await WorkflowBackupUtils.readJsonFile(file);
      
      // 检测冲突
      const detectedConflicts = WorkflowBackupUtils.detectConflicts(backupData.workflows, workflows);
      
      if (detectedConflicts.length > 0) {
        setImportData(backupData);
        setConflicts(detectedConflicts);
        setShowConflictModal(true);
      } else {
        // 没有冲突，直接导入
        await performImport(backupData.workflows.map(w => ({
          api_url: w.api_url,
          api_key: w.api_key,
          name: w.name,
          description: w.description,
          inputs: w.inputs,
          outputs: w.outputs,
          is_public: w.is_public,
          enabled: w.enabled,
        })));
      }
    } catch (error) {
      showError('导入失败: ' + (error as Error).message);
    } finally {
      setImporting(false);
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 执行导入
  const performImport = async (workflowsToImport: CreateWorkflowRequest[]) => {
    const result: WorkflowImportResult = {
      total: workflowsToImport.length,
      successful: 0,
      failed: 0,
      conflicts: [],
      errors: [],
    };

    for (const workflowData of workflowsToImport) {
      try {
        const response = await adminAPI.createWorkflow(workflowData);
        if (response.code === 0) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push(`${workflowData.name}: ${response.msg}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`${workflowData.name}: ${(error as Error).message}`);
      }
    }

    // 显示导入结果
    if (result.successful > 0) {
      showSuccess(`成功导入 ${result.successful} 个工作流`);
      onRefresh?.();
    }
    if (result.failed > 0) {
      showError(`${result.failed} 个工作流导入失败`);
      console.error('导入错误:', result.errors);
    }

    onClose();
  };

  // 解决冲突
  const handleConflictResolve = async (resolvedConflicts: WorkflowConflict[]) => {
    if (!importData) return;

    try {
      setImporting(true);
      
      // 处理覆盖操作：先删除需要覆盖的工作流
      const overwriteConflicts = resolvedConflicts.filter(c => c.action === 'overwrite');
      for (const conflict of overwriteConflicts) {
        try {
          await adminAPI.deleteWorkflow(conflict.existing.id);
        } catch (error) {
          console.error('删除工作流失败:', error);
        }
      }

      // 生成最终导入列表
      const workflowsToImport = WorkflowBackupUtils.resolveConflicts(
        importData.workflows,
        resolvedConflicts
      );

      await performImport(workflowsToImport);
    } catch (error) {
      showError('导入失败: ' + (error as Error).message);
    } finally {
      setImporting(false);
      setShowConflictModal(false);
      setImportData(null);
      setConflicts([]);
    }
  };

  // 取消冲突解决
  const handleConflictCancel = () => {
    setShowConflictModal(false);
    setImportData(null);
    setConflicts([]);
    setImporting(false);
  };

  return (
    <>
      <Modal
        open={true}
        onClose={onClose}
        title="工作流备份管理"
        size="xl"
        showHeader={true}
        showFooter={true}
        footer={
          <Button variant="text" onClick={onClose}>
            关闭
          </Button>
        }
        contentClassName="max-h-[90vh] overflow-hidden"
      >
        {/* 操作区域 */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleSelectAll}
                variant="text"
                className="text-sm"
              >
                {selectedWorkflows.size === workflows.length ? '取消全选' : '全选'}
              </Button>
              <span className="text-sm text-gray-500">
                已选择 {selectedWorkflows.size} / {workflows.length} 个工作流
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleExport}
                disabled={selectedWorkflows.size === 0}
                className="inline-flex items-center"
              >
                <FiDownload className="mr-2" size={16} />
                导出选中
              </Button>
              <Button
                onClick={handleImportClick}
                disabled={importing}
                className="inline-flex items-center"
              >
                <FiUpload className="mr-2" size={16} />
                {importing ? '导入中...' : '导入工作流'}
              </Button>
            </div>
          </div>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* 工作流列表 */}
        <div className="max-h-96 overflow-y-auto">
          {workflows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              暂无工作流
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedWorkflows.has(workflow.id)}
                        onChange={(e) => handleWorkflowSelect(workflow.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-900">
                          {workflow.name}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          workflow.enabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {workflow.enabled ? '启用' : '禁用'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {workflow.description || '无描述'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        API: {workflow.api_url}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      使用 {workflow.used} 次
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* 冲突解决模态框 */}
      {showConflictModal && (
        <WorkflowConflictModal
          conflicts={conflicts}
          onResolve={handleConflictResolve}
          onCancel={handleConflictCancel}
        />
      )}
    </>
  );
};

export default WorkflowBackupModal;

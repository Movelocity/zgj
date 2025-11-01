import React, { useState } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { Button, Input, Modal } from '@/components/ui';
import type { WorkflowConflict } from '@/types/workflow';

interface WorkflowConflictModalProps {
  conflicts: WorkflowConflict[];
  onResolve: (resolvedConflicts: WorkflowConflict[]) => void;
  onCancel: () => void;
}

const WorkflowConflictModal: React.FC<WorkflowConflictModalProps> = ({
  conflicts,
  onResolve,
  onCancel,
}) => {
  const [resolvedConflicts, setResolvedConflicts] = useState<WorkflowConflict[]>(
    conflicts.map(conflict => ({ ...conflict, action: 'skip' }))
  );

  // 处理操作选择
  const handleActionChange = (index: number, action: 'skip' | 'overwrite' | 'rename') => {
    setResolvedConflicts(prev => prev.map((conflict, i) => 
      i === index ? { ...conflict, action, newName: action === 'rename' ? conflict.name : undefined } : conflict
    ));
  };

  // 处理重命名
  const handleRenameChange = (index: number, newName: string) => {
    setResolvedConflicts(prev => prev.map((conflict, i) => 
      i === index ? { ...conflict, newName } : conflict
    ));
  };

  // 批量操作
  const handleBatchAction = (action: 'skip' | 'overwrite') => {
    setResolvedConflicts(prev => prev.map(conflict => ({ ...conflict, action })));
  };

  // 确认解决
  const handleConfirm = () => {
    // 验证重命名的工作流名称不为空且不重复
    const renameConflicts = resolvedConflicts.filter(c => c.action === 'rename');
    const existingNames = new Set(conflicts.map(c => c.existing.name));
    const newNames = new Set<string>();
    
    for (const conflict of renameConflicts) {
      if (!conflict.newName?.trim()) {
        alert('请为所有选择重命名的工作流提供新名称');
        return;
      }
      if (existingNames.has(conflict.newName) || newNames.has(conflict.newName)) {
        alert(`工作流名称 "${conflict.newName}" 已存在，请选择其他名称`);
        return;
      }
      newNames.add(conflict.newName);
    }

    onResolve(resolvedConflicts);
  };

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title=""
      size="xl"
      showHeader={false}
      showFooter={true}
      confirmText="确认导入"
      cancelText="取消导入"
      onConfirm={handleConfirm}
      onCancel={onCancel}
      // footer={
      //   <div className="flex items-center justify-end space-x-3">
      //     <Button variant="text" onClick={onCancel}>
      //       取消导入
      //     </Button>
      //     <Button onClick={handleConfirm}>
      //       确认导入
      //     </Button>
      //   </div>
      // }
      contentClassName="max-h-[90vh] overflow-hidden"
    >
      <div>
        {/* 自定义头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FiAlertTriangle className="text-yellow-500" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">工作流名称冲突</h3>
              <p className="text-sm text-gray-500">发现 {conflicts.length} 个工作流名称冲突，请选择处理方式</p>
            </div>
          </div>
        </div>

        {/* 批量操作 */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">批量操作:</span>
            <Button
              variant="text"
              onClick={() => handleBatchAction('skip')}
              className="text-sm"
            >
              全部跳过
            </Button>
            <Button
              variant="text"
              onClick={() => handleBatchAction('overwrite')}
              className="text-sm"
            >
              全部覆盖
            </Button>
          </div>
        </div>

        {/* 冲突列表 */}
        <div className="max-h-96 overflow-y-auto">
          {resolvedConflicts.map((conflict, index) => (
            <div key={index} className="p-6 border-b last:border-b-0">
              <div className="space-y-4">
                {/* 工作流信息对比 */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">现有工作流</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm font-medium text-gray-900">{conflict.existing.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{conflict.existing.description || '无描述'}</div>
                      <div className="text-xs text-gray-400 mt-1">API: {conflict.existing.api_url}</div>
                      <div className="text-xs text-gray-400">创建时间: {new Date(conflict.existing.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">导入工作流</h4>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="text-sm font-medium text-gray-900">{conflict.importing.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{conflict.importing.description || '无描述'}</div>
                      <div className="text-xs text-gray-400 mt-1">API: {conflict.importing.api_url}</div>
                    </div>
                  </div>
                </div>

                {/* 处理选项 */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`conflict-${index}`}
                        checked={conflict.action === 'skip'}
                        onChange={() => handleActionChange(index, 'skip')}
                        className="mr-2"
                      />
                      <span className="text-sm">跳过导入</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`conflict-${index}`}
                        checked={conflict.action === 'overwrite'}
                        onChange={() => handleActionChange(index, 'overwrite')}
                        className="mr-2"
                      />
                      <span className="text-sm text-orange-600">覆盖现有工作流</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`conflict-${index}`}
                        checked={conflict.action === 'rename'}
                        onChange={() => handleActionChange(index, 'rename')}
                        className="mr-2"
                      />
                      <span className="text-sm">重命名导入</span>
                    </label>
                  </div>

                  {/* 重命名输入框 */}
                  {conflict.action === 'rename' && (
                    <div className="ml-6">
                      <Input
                        placeholder="输入新的工作流名称"
                        value={conflict.newName || ''}
                        onChange={(e) => handleRenameChange(index, e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default WorkflowConflictModal;

import type { 
  Workflow, 
  WorkflowBackupData, 
  WorkflowBackupFile, 
  WorkflowConflict,
  CreateWorkflowRequest
} from '@/types/workflow';

// 工作流备份工具类
export class WorkflowBackupUtils {
  // 导出工作流为JSON
  static exportWorkflows(workflows: Workflow[]): void {
    if (!workflows.length) {
      throw new Error('没有选择要导出的工作流');
    }

    // 提取需要备份的字段
    const backupData: WorkflowBackupData[] = workflows.map(workflow => ({
      api_url: workflow.api_url,
      api_key: workflow.api_key,
      name: workflow.name,
      description: workflow.description,
      inputs: workflow.inputs,
      outputs: workflow.outputs,
      is_public: workflow.is_public,
      enabled: workflow.enabled,
    }));

    // 创建备份文件结构
    const backupFile: WorkflowBackupFile = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      workflows: backupData,
    };

    // 下载JSON文件
    const jsonString = JSON.stringify(backupFile, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // 读取JSON文件
  static readJsonFile(file: File): Promise<WorkflowBackupFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content) as WorkflowBackupFile;
          
          // 验证文件格式
          if (!data.version || !data.workflows || !Array.isArray(data.workflows)) {
            throw new Error('无效的备份文件格式');
          }

          // 验证每个工作流的必需字段
          for (const workflow of data.workflows) {
            if (!workflow.name || !workflow.api_url || !workflow.api_key) {
              throw new Error('备份文件中包含无效的工作流数据');
            }
          }

          resolve(data);
        } catch (error) {
          reject(new Error('解析JSON文件失败: ' + (error as Error).message));
        }
      };

      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };

      reader.readAsText(file);
    });
  }

  // 检测工作流名称冲突
  static detectConflicts(
    importingWorkflows: WorkflowBackupData[],
    existingWorkflows: Workflow[]
  ): WorkflowConflict[] {
    const conflicts: WorkflowConflict[] = [];
    // const existingNames = new Set(existingWorkflows.map(w => w.name.toLowerCase()));

    importingWorkflows.forEach((importingWorkflow, index) => {
      const existingWorkflow = existingWorkflows.find(
        w => w.name.toLowerCase() === importingWorkflow.name.toLowerCase()
      );

      if (existingWorkflow) {
        conflicts.push({
          index,
          name: importingWorkflow.name,
          existing: existingWorkflow,
          importing: importingWorkflow,
        });
      }
    });

    return conflicts;
  }

  // 根据冲突解决方案处理导入数据
  static resolveConflicts(
    importingWorkflows: WorkflowBackupData[],
    conflicts: WorkflowConflict[]
  ): CreateWorkflowRequest[] {
    const resolvedWorkflows: CreateWorkflowRequest[] = [];

    importingWorkflows.forEach((workflow, index) => {
      const conflict = conflicts.find(c => c.index === index);

      if (!conflict) {
        // 没有冲突，直接添加
        resolvedWorkflows.push({
          api_url: workflow.api_url,
          api_key: workflow.api_key,
          name: workflow.name,
          description: workflow.description,
          inputs: workflow.inputs,
          outputs: workflow.outputs,
          is_public: workflow.is_public,
          enabled: workflow.enabled,
        });
      } else if (conflict.action === 'rename') {
        // 重命名导入
        resolvedWorkflows.push({
          api_url: workflow.api_url,
          api_key: workflow.api_key,
          name: conflict.newName || workflow.name,
          description: workflow.description,
          inputs: workflow.inputs,
          outputs: workflow.outputs,
          is_public: workflow.is_public,
          enabled: workflow.enabled,
        });
      } else if (conflict.action === 'overwrite') {
        // 覆盖现有工作流（通过先删除再创建实现）
        resolvedWorkflows.push({
          api_url: workflow.api_url,
          api_key: workflow.api_key,
          name: workflow.name,
          description: workflow.description,
          inputs: workflow.inputs,
          outputs: workflow.outputs,
          is_public: workflow.is_public,
          enabled: workflow.enabled,
        });
      }
      // skip 操作不添加到结果中
    });

    return resolvedWorkflows;
  }

  // 验证工作流名称
  static validateWorkflowName(name: string, existingNames: Set<string>): boolean {
    if (!name?.trim()) {
      return false;
    }
    return !existingNames.has(name.toLowerCase());
  }

  // 生成唯一的工作流名称
  static generateUniqueName(baseName: string, existingNames: Set<string>): string {
    let name = baseName;
    let counter = 1;

    while (existingNames.has(name.toLowerCase())) {
      name = `${baseName} (${counter})`;
      counter++;
    }

    return name;
  }
}

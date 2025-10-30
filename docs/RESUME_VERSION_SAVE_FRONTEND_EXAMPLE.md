# 简历版本保存功能 - 前端使用示例

本文档提供了在前端使用简历版本保存功能的详细示例。

## 1. 基础使用

### 1.1 导入 API

```typescript
import { resumeAPI } from '@/api/resume';
import type { ResumeUpdateRequest } from '@/types/resume';
```

### 1.2 更新简历（覆盖模式）

```typescript
// 默认行为：覆盖原简历
const handleSave = async (resumeId: string, updatedData: any) => {
  try {
    const response = await resumeAPI.updateResume(resumeId, {
      structured_data: updatedData,
      // new_version 默认为 false
    });
    
    if (response.code === 0) {
      console.log('简历更新成功');
    }
  } catch (error) {
    console.error('更新失败:', error);
  }
};
```

### 1.3 创建新版本（版本管理模式）

```typescript
// 创建新版本：保留原简历，创建新版本
const handleSaveAsNewVersion = async (resumeId: string, updatedData: any) => {
  try {
    const response = await resumeAPI.updateResume(resumeId, {
      structured_data: updatedData,
      new_version: true, // 启用新版本模式
    });
    
    if (response.code === 0 && response.data) {
      if (response.data.is_new_version) {
        console.log('新版本创建成功');
        console.log('新版本 ID:', response.data.new_resume_id);
        
        // 可以跳转到新版本
        navigate(`/resumes/${response.data.new_resume_id}`);
      }
    }
  } catch (error) {
    console.error('创建新版本失败:', error);
  }
};
```

## 2. React 组件示例

### 2.1 简单的保存按钮组

```tsx
import React, { useState } from 'react';
import { Button, Space, message } from 'antd';
import { resumeAPI } from '@/api/resume';
import { useNavigate } from 'react-router-dom';

interface SaveButtonsProps {
  resumeId: string;
  resumeData: any;
  onSaved?: () => void;
}

export const SaveButtons: React.FC<SaveButtonsProps> = ({
  resumeId,
  resumeData,
  onSaved,
}) => {
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // 保存（覆盖）
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await resumeAPI.updateResume(resumeId, {
        structured_data: resumeData,
        new_version: false,
      });

      if (response.code === 0) {
        message.success('简历保存成功');
        onSaved?.();
      }
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 另存为新版本
  const handleSaveAsNewVersion = async () => {
    setSaving(true);
    try {
      const response = await resumeAPI.updateResume(resumeId, {
        structured_data: resumeData,
        new_version: true,
      });

      if (response.code === 0 && response.data) {
        if (response.data.is_new_version) {
          message.success('新版本创建成功');
          // 跳转到新版本
          navigate(`/resumes/${response.data.new_resume_id}`);
        }
      }
    } catch (error) {
      message.error('创建新版本失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Space>
      <Button type="primary" loading={saving} onClick={handleSave}>
        保存
      </Button>
      <Button loading={saving} onClick={handleSaveAsNewVersion}>
        另存为新版本
      </Button>
    </Space>
  );
};
```

### 2.2 带确认对话框的保存组件

```tsx
import React, { useState } from 'react';
import { Button, Modal, Space, message } from 'antd';
import { SaveOutlined, CopyOutlined } from '@ant-design/icons';
import { resumeAPI } from '@/api/resume';
import { useNavigate } from 'react-router-dom';

interface ResumeSaveControlProps {
  resumeId: string;
  resumeData: any;
  hasUnsavedChanges: boolean;
  onSaved?: () => void;
}

export const ResumeSaveControl: React.FC<ResumeSaveControlProps> = ({
  resumeId,
  resumeData,
  hasUnsavedChanges,
  onSaved,
}) => {
  const [saving, setSaving] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const navigate = useNavigate();

  // 直接保存（覆盖）
  const handleDirectSave = async () => {
    setSaving(true);
    try {
      const response = await resumeAPI.updateResume(resumeId, {
        structured_data: resumeData,
        new_version: false,
      });

      if (response.code === 0) {
        message.success('简历保存成功');
        onSaved?.();
      }
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 创建新版本
  const handleSaveNewVersion = async () => {
    setSaving(true);
    setShowVersionModal(false);
    
    try {
      const response = await resumeAPI.updateResume(resumeId, {
        structured_data: resumeData,
        new_version: true,
      });

      if (response.code === 0 && response.data?.is_new_version) {
        message.success('新版本创建成功！即将跳转...');
        
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          navigate(`/resumes/${response.data.new_resume_id}`);
        }, 1000);
      }
    } catch (error) {
      message.error('创建新版本失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Space>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          disabled={!hasUnsavedChanges}
          onClick={handleDirectSave}
        >
          保存
        </Button>
        <Button
          icon={<CopyOutlined />}
          loading={saving}
          onClick={() => setShowVersionModal(true)}
        >
          另存为新版本
        </Button>
      </Space>

      <Modal
        title="创建新版本"
        open={showVersionModal}
        onOk={handleSaveNewVersion}
        onCancel={() => setShowVersionModal(false)}
        confirmLoading={saving}
        okText="创建"
        cancelText="取消"
      >
        <p>将创建当前简历的新版本，原版本将被保留。</p>
        <p>创建后将自动跳转到新版本。</p>
      </Modal>
    </>
  );
};
```

### 2.3 自动保存功能

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { resumeAPI } from '@/api/resume';

interface AutoSaveProps {
  resumeId: string;
  resumeData: any;
  enabled?: boolean;
  interval?: number; // 自动保存间隔（毫秒）
  onSaved?: () => void;
}

export const AutoSave: React.FC<AutoSaveProps> = ({
  resumeId,
  resumeData,
  enabled = true,
  interval = 30000, // 默认 30 秒
  onSaved,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const dataRef = useRef(resumeData);

  // 更新数据引用
  useEffect(() => {
    dataRef.current = resumeData;
  }, [resumeData]);

  // 自动保存逻辑
  useEffect(() => {
    if (!enabled) return;

    const saveInterval = setInterval(async () => {
      if (isSaving) return;

      setIsSaving(true);
      try {
        await resumeAPI.updateResume(resumeId, {
          structured_data: dataRef.current,
          new_version: false, // 自动保存不创建新版本
        });

        setLastSaved(new Date());
        onSaved?.();
      } catch (error) {
        console.error('自动保存失败:', error);
        // 自动保存失败时不显示错误消息，避免打扰用户
      } finally {
        setIsSaving(false);
      }
    }, interval);

    return () => clearInterval(saveInterval);
  }, [enabled, interval, resumeId, isSaving, onSaved]);

  return (
    <div style={{ fontSize: '12px', color: '#999' }}>
      {isSaving && '正在保存...'}
      {!isSaving && lastSaved && `上次保存: ${lastSaved.toLocaleTimeString()}`}
    </div>
  );
};
```

## 3. 完整的简历编辑器示例

```tsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Space, message, Spin } from 'antd';
import { SaveOutlined, CopyOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { resumeAPI } from '@/api/resume';
import type { ResumeData } from '@/types/resume';

export const ResumeEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 加载简历数据
  useEffect(() => {
    if (!id) return;

    const loadResume = async () => {
      setLoading(true);
      try {
        const response = await resumeAPI.getResume(id);
        if (response.code === 0 && response.data) {
          setResumeData(response.data.structured_data);
        }
      } catch (error) {
        message.error('加载简历失败');
      } finally {
        setLoading(false);
      }
    };

    loadResume();
  }, [id]);

  // 保存简历（覆盖）
  const handleSave = async () => {
    if (!id || !resumeData) return;

    setSaving(true);
    try {
      const response = await resumeAPI.updateResume(id, {
        structured_data: resumeData,
        new_version: false,
      });

      if (response.code === 0) {
        message.success('简历保存成功');
        setHasChanges(false);
      }
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 另存为新版本
  const handleSaveAsNewVersion = async () => {
    if (!id || !resumeData) return;

    setSaving(true);
    try {
      const response = await resumeAPI.updateResume(id, {
        structured_data: resumeData,
        new_version: true,
      });

      if (response.code === 0 && response.data?.is_new_version) {
        message.success({
          content: '新版本创建成功！正在跳转...',
          duration: 2,
        });

        // 跳转到新版本
        setTimeout(() => {
          navigate(`/resumes/${response.data.new_resume_id}`);
        }, 1000);
      }
    } catch (error) {
      message.error('创建新版本失败');
    } finally {
      setSaving(false);
    }
  };

  // 查看版本历史
  const handleViewHistory = () => {
    navigate(`/resumes/${id}/versions`);
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (!resumeData) {
    return <div>简历数据不存在</div>;
  }

  return (
    <div>
      <Card
        title="编辑简历"
        extra={
          <Space>
            <Button
              icon={<HistoryOutlined />}
              onClick={handleViewHistory}
            >
              版本历史
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={!hasChanges}
              onClick={handleSave}
            >
              保存
            </Button>
            <Button
              icon={<CopyOutlined />}
              loading={saving}
              onClick={handleSaveAsNewVersion}
            >
              另存为新版本
            </Button>
          </Space>
        }
      >
        {/* 简历编辑表单 */}
        <div>
          {/* 这里放置简历编辑器组件 */}
          <p>简历内容编辑区域...</p>
        </div>
      </Card>
    </div>
  );
};
```

## 4. 使用建议

### 4.1 何时使用"保存"（覆盖）

- 修正小错误（拼写、格式等）
- 日常编辑和更新
- 不需要保留历史版本的场景

### 4.2 何时使用"另存为新版本"

- 进行重大修改前
- 针对不同岗位定制简历
- 需要对比不同版本的效果
- 作为重要的里程碑保存

### 4.3 最佳实践

1. **自动保存 + 手动版本管理**
   - 启用自动保存（不创建版本）保护数据
   - 在关键节点手动创建版本

2. **命名规范**
   ```typescript
   // 创建新版本时更新名称
   await resumeAPI.updateResume(id, {
     name: `${originalName} - v${version + 1}`,
     structured_data: updatedData,
     new_version: true,
   });
   ```

3. **版本说明**
   ```typescript
   // 可以在 structured_data 中添加版本说明
   const dataWithNote = {
     ...resumeData,
     _versionNote: '针对产品经理岗位优化',
     _createdFrom: originalVersionId,
   };
   ```

4. **错误处理**
   ```typescript
   try {
     const response = await resumeAPI.updateResume(id, data);
     // 处理成功
   } catch (error) {
     // 记录错误
     console.error('Save error:', error);
     // 显示用户友好的错误消息
     message.error('保存失败，请稍后重试');
     // 可选：保存到本地存储作为备份
     localStorage.setItem(`resume_backup_${id}`, JSON.stringify(data));
   }
   ```

## 5. Toast 通知示例

根据项目规范使用 toast 工具：

```typescript
import { showSuccess, showError, showInfo } from '@/utils/toast';

// 保存成功
const handleSave = async () => {
  try {
    const response = await resumeAPI.updateResume(id, {
      structured_data: resumeData,
      new_version: false,
    });

    if (response.code === 0) {
      showSuccess('简历保存成功');
    }
  } catch (error) {
    showError('保存失败，请稍后重试');
  }
};

// 创建新版本
const handleSaveAsNewVersion = async () => {
  try {
    const response = await resumeAPI.updateResume(id, {
      structured_data: resumeData,
      new_version: true,
    });

    if (response.code === 0 && response.data?.is_new_version) {
      showSuccess('新版本创建成功！', 2000);
      // 跳转到新版本
      setTimeout(() => {
        navigate(`/resumes/${response.data.new_resume_id}`);
      }, 1000);
    }
  } catch (error) {
    showError('创建新版本失败');
  }
};
```

## 6. 相关文档

- [简历版本保存功能指南](./RESUME_VERSION_SAVE_GUIDE.md) - 后端 API 文档
- [简历管理 API](./RESUME_MANAGEMENT_API.md) - 完整 API 参考
- [前端项目结构](../web/PROJECT_STRUCTURE.md) - 前端架构说明


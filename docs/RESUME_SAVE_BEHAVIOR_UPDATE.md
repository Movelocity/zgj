# 简历保存行为更新说明

## 更新概述

本次更新修改了简历编辑器的保存行为，以提供更好的版本管理体验。

## 主要变更

### 1. 保存按钮行为调整

**位置：** 简历编辑页面顶部工具栏（导出 PDF 按钮旁边）

**新行为：** 点击"保存"按钮将**默认创建新版本**

- 保存时会创建当前简历的新版本
- 原版本保持不变
- 保存成功后自动跳转到新创建的版本
- 新版本与原版本共享相同的 `resume_number`，但 `version` 递增

**用户体验：**
```
用户点击"保存"按钮
↓
显示提示："新版本创建成功！正在跳转..."
↓
1秒后自动跳转到新版本页面
```

### 2. Ctrl+S 快捷键功能

**新功能：** 添加全局 Ctrl+S（Mac 上为 Cmd+S）快捷键

**行为：** 快捷键执行**覆盖保存**（不创建新版本）

- 直接更新当前简历，不创建新版本
- 保存成功后显示提示："保存成功"
- 页面不跳转，保持在当前简历

**用户体验：**
```
用户按下 Ctrl+S (或 Cmd+S)
↓
阻止浏览器默认保存行为
↓
直接更新当前简历
↓
显示提示："保存成功"
```

## 使用场景对比

### 场景 1：需要保留历史版本

**操作：** 点击"保存"按钮

**适用情况：**
- 完成重要修改，想要保留历史版本作为备份
- 针对不同岗位创建简历变体
- 进行大幅度优化前保存当前版本
- 需要对比不同版本的效果

**结果：**
- ✅ 创建新版本
- ✅ 原版本保留
- ✅ 自动跳转到新版本

### 场景 2：快速保存当前修改

**操作：** 按 Ctrl+S（或 Cmd+S）

**适用情况：**
- 修正小错误（拼写、格式等）
- 日常编辑和更新
- 不需要保留历史版本
- 想要继续在当前版本上编辑

**结果：**
- ✅ 直接更新当前简历
- ✅ 不创建新版本
- ✅ 保持在当前页面

## 技术实现细节

### 前端代码变更

**文件：** `web/src/pages/editor/ResumeDetails.tsx`

#### 1. 保存函数修改

```typescript
// 保存简历 - 默认创建新版本
const handleSaveResume = async (newVersion: boolean = true) => {
  if (!id) return;
  try {
    setSaving(true);
    const response = await resumeAPI.updateResume(id, {
      name: resumeName,
      structured_data: resumeData,
      new_version: newVersion, // 控制是否创建新版本
    });

    if (response.code === 0) {
      if (response.data?.is_new_version && response.data.new_resume_id) {
        showSuccess('新版本创建成功！正在跳转...');
        setTimeout(() => {
          navigate(`/resumes/${response.data.new_resume_id}`);
        }, 1000);
      } else {
        showSuccess('保存成功');
      }
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : '保存失败');
  } finally {
    setSaving(false);
  }
};
```

#### 2. 覆盖保存函数（用于快捷键）

```typescript
// 覆盖保存 - 用于快捷键 Ctrl+S
const handleOverwriteSave = useCallback(async () => {
  if (!id) return;
  try {
    setSaving(true);
    const response = await resumeAPI.updateResume(id, {
      name: resumeName,
      structured_data: resumeData,
      new_version: false, // 覆盖保存
    });

    if (response.code === 0) {
      showSuccess('保存成功');
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : '保存失败');
  } finally {
    setSaving(false);
  }
}, [id, resumeName, resumeData]);
```

#### 3. 快捷键监听

```typescript
// 添加全局 Ctrl+S 快捷键监听（覆盖保存）
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+S 或 Cmd+S（Mac）
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault(); // 阻止浏览器默认保存行为
      handleOverwriteSave();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [handleOverwriteSave]);
```

#### 4. 按钮绑定

```typescript
<Button
  onClick={() => handleSaveResume(true)} // 明确传递 true，创建新版本
  disabled={isSaving}
  icon={<FiSave className="w-4 h-4 mr-2" />}
  title="保存为新版本（或使用 Ctrl+S 覆盖保存）"
>
  保存
</Button>
```

### 后端 API 支持

后端已实现 `new_version` 参数支持，详见：
- [简历版本保存功能指南](./RESUME_VERSION_SAVE_GUIDE.md)

## 用户界面提示

### 按钮提示文本

保存按钮的 `title` 属性：
```
"保存为新版本（或使用 Ctrl+S 覆盖保存）"
```

当用户将鼠标悬停在保存按钮上时，会显示此提示，帮助用户了解两种保存方式。

### Toast 消息

**创建新版本成功：**
```
"新版本创建成功！正在跳转..."
```

**覆盖保存成功：**
```
"保存成功"
```

**保存失败：**
```
"保存失败" 或具体的错误信息
```

## 版本管理逻辑

### 版本号管理

- 同一份简历的所有版本共享相同的 `resume_number`
- 版本号 (`version`) 从 1 开始递增
- 创建新版本时，自动查询当前最大版本号并递增

### 版本跳转

创建新版本后，URL 会从：
```
/resumes/[原简历ID]
```

跳转到：
```
/resumes/[新简历ID]
```

### 版本查看

用户可以通过简历列表查看所有版本：
- 同一 `resume_number` 的简历会显示不同的版本号
- 可以随时查看和编辑任何版本

## 注意事项

### 1. 快捷键覆盖

Ctrl+S 会覆盖浏览器的默认保存行为（保存网页）。这是有意为之，以提供更流畅的编辑体验。

### 2. 版本跳转

点击保存按钮创建新版本后会自动跳转。如果用户不希望跳转，可以使用 Ctrl+S 快捷键。

### 3. 保存状态

保存过程中，按钮会显示 `disabled` 状态，防止重复点击。

### 4. 数据同步

快捷键保存使用 `useCallback` 包装，确保总是使用最新的简历数据。

## 测试建议

### 测试场景 1：创建新版本

1. 打开简历编辑页面
2. 修改简历内容
3. 点击"保存"按钮
4. 验证提示消息："新版本创建成功！正在跳转..."
5. 验证页面跳转到新的简历 ID
6. 返回简历列表，验证原版本和新版本都存在

### 测试场景 2：覆盖保存

1. 打开简历编辑页面
2. 修改简历内容
3. 按 Ctrl+S（Mac 上为 Cmd+S）
4. 验证提示消息："保存成功"
5. 验证页面 URL 没有变化
6. 刷新页面，验证修改已保存

### 测试场景 3：快捷键阻止默认行为

1. 打开简历编辑页面
2. 按 Ctrl+S
3. 验证浏览器的"保存网页"对话框没有弹出
4. 验证简历保存成功

### 测试场景 4：多次保存

1. 打开简历编辑页面（v1）
2. 修改内容，点击保存 → 跳转到 v2
3. 修改内容，点击保存 → 跳转到 v3
4. 返回简历列表，验证 v1、v2、v3 都存在
5. 验证版本号正确递增

## 回退方案

如果需要回退到旧的保存行为：

1. 修改保存按钮点击事件：
```typescript
onClick={() => handleSaveResume(false)} // 改为 false，覆盖保存
```

2. 移除快捷键监听（注释掉相关 useEffect）

3. 或者对调两种保存方式：
   - 按钮 → 覆盖保存
   - Ctrl+S → 创建新版本

## 相关文档

- [简历版本保存功能指南](./RESUME_VERSION_SAVE_GUIDE.md) - 后端 API 完整文档
- [前端使用示例](./RESUME_VERSION_SAVE_FRONTEND_EXAMPLE.md) - 更多前端集成示例
- [简历版本重整理 API](./RESUME_VERSION_REORGANIZE_API.md) - 版本管理相关 API

## 更新日志

- **2025-10-29**: 
  - 保存按钮默认创建新版本
  - 添加 Ctrl+S 快捷键用于覆盖保存
  - 优化保存后的用户反馈和跳转体验


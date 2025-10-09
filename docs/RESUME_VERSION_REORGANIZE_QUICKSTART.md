# 简历版本重整理 - 快速入门指南

> 一键整理简历版本，自动计算文件哈希，统一版本编号

## 🚀 快速开始

### 方式1：通过管理后台（推荐）

1. 登录管理后台
2. 进入 **"文件管理"** 页面
3. 点击右上角的 **"整理版本"** 按钮
4. 确认执行
5. 查看处理结果

![整理版本按钮位置](https://via.placeholder.com/800x200?text=File+Management+>+Reorganize+Versions)

### 方式2：通过API调用

```bash
curl -X POST https://your-domain.com/api/admin/migration/reorganize-versions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## 💡 功能说明

这个功能会：

✅ 按文件哈希识别相同的简历文件  
✅ 按时间重新分配版本号（1, 2, 3...）  
✅ 统一相同文件的简历编号  
✅ **自动计算缺失的文件哈希值**（v2.0新特性）  
✅ 提供详细的处理统计和错误报告

## 📊 返回结果示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "processed_users": 10,      // 处理的用户数
    "processed_resumes": 150,   // 处理的简历总数
    "updated_versions": 25,     // 更新的版本号数量
    "errors": []                // 错误信息列表（如果有）
  }
}
```

## ✨ v2.0 新特性：自动哈希计算

**不再需要预先运行迁移脚本！**

旧版本：
```bash
# ❌ 旧流程：需要先运行迁移脚本
go run scripts/migrate_file_hash.go
curl -X POST .../reorganize-versions
```

新版本：
```bash
# ✅ 新流程：一键完成
curl -X POST .../reorganize-versions
# 系统会自动计算缺失的哈希值！
```

### 工作原理

```
┌─────────────────────────────────────────────────┐
│           发现文件缺少哈希值                      │
├─────────────────────────────────────────────────┤
│  1. 获取文件物理路径                              │
│  2. 检查文件是否存在                              │
│  3. 读取文件内容                                  │
│  4. 计算SHA256哈希                               │
│  5. 更新到数据库                                  │
│  6. 继续处理简历版本                              │
└─────────────────────────────────────────────────┘
```

## 🎯 使用场景

### 场景1：系统刚部署完成

新部署的系统可能存在没有哈希值的旧文件。

```bash
# 直接执行整理即可
curl -X POST .../reorganize-versions
```

系统会自动：
- 为所有缺失哈希的文件计算哈希值
- 整理所有简历的版本号
- 统一简历编号

### 场景2：数据迁移后

从旧系统迁移数据后，文件记录可能缺少哈希值。

```bash
# 方式A：直接整理（推荐，少于1000个文件时）
curl -X POST .../reorganize-versions

# 方式B：先批量计算（推荐，超过1000个文件时）
go run scripts/migrate_file_hash.go
curl -X POST .../reorganize-versions
```

### 场景3：定期维护

定期执行整理，确保版本号的一致性。

```bash
# 可以安全地多次执行
# 已经正确的版本号不会被重复更新
curl -X POST .../reorganize-versions
```

## ⚡ 性能参考

| 文件数量 | 处理时间（估算） | 推荐方式 |
|---------|----------------|---------|
| < 100   | < 1秒          | 直接整理 |
| 100-500 | 1-5秒          | 直接整理 |
| 500-1000| 5-10秒         | 直接整理 |
| > 1000  | 10秒+          | 先批量计算哈希，再整理 |

*注：实际时间取决于文件大小和服务器性能*

## 🔍 常见问题

### Q1: 会不会影响用户使用？

**不会**。整理操作只更新数据库字段（version、resume_number），不涉及：
- ❌ 文件内容修改
- ❌ 文件移动或删除
- ❌ 用户数据丢失

### Q2: 可以多次执行吗？

**可以**。整理操作是幂等的：
- ✅ 已经正确的版本号不会重复更新
- ✅ 可以安全地多次执行
- ✅ 适合定期维护

### Q3: 如果文件不存在怎么办？

系统会：
- 记录错误信息到 `errors` 字段
- 继续处理其他文件
- 不会中断整体流程

### Q4: 需要提前备份吗？

建议备份，但不是必须：
- 整理操作是安全的
- 只修改版本号和编号字段
- 可以从数据库日志回滚

## 📋 验证结果

执行整理后，运行验证脚本：

```bash
psql -U your_user -d your_database -f scripts/test_version_reorganize.sql
```

检查项：
- ✅ 版本号是否按时间连续（1, 2, 3...）
- ✅ 相同哈希的简历是否有相同的resume_number
- ✅ 所有文件是否都有哈希值

## 🛠️ 前端代码示例

```typescript
import { adminAPI } from '@/api/admin';
import { showSuccess, showError, showInfo } from '@/utils/toast';

const handleReorganize = async () => {
  try {
    const { data, code, msg } = await adminAPI.reorganizeResumeVersions();
    
    if (code === 0) {
      const { processed_users, processed_resumes, updated_versions, errors } = data;
      
      if (errors.length > 0) {
        showInfo(
          `处理完成！有 ${errors.length} 个错误。\n` +
          `处理: ${processed_users} 用户，${processed_resumes} 简历\n` +
          `更新: ${updated_versions} 个版本号`,
          6000
        );
        console.error('错误详情:', errors);
      } else {
        showSuccess(
          `成功整理 ${processed_users} 个用户的简历！\n` +
          `处理 ${processed_resumes} 份简历，更新 ${updated_versions} 个版本号`
        );
      }
    } else {
      showError(msg || '整理失败');
    }
  } catch (error) {
    showError('整理失败: ' + error.message);
  }
};
```

## 📚 详细文档

- [完整API文档](./RESUME_VERSION_REORGANIZE_API.md) - API详细说明和参数
- [实现总结](./RESUME_VERSION_REORGANIZE_SUMMARY.md) - 技术实现细节
- [更新日志](./RESUME_VERSION_REORGANIZE_CHANGELOG.md) - 版本更新历史
- [测试脚本](../scripts/test_version_reorganize.sql) - 验证SQL脚本

## 🔗 相关功能

- [文件去重和版本控制](./FILE_DEDUPLICATION_AND_VERSION_CONTROL.md)
- [文件哈希迁移脚本](../scripts/MIGRATION_README.md)
- [简历管理API](./RESUME_MANAGEMENT_API.md)

## ⚠️ 注意事项

1. **管理员权限**：此操作仅限管理员执行
2. **执行时机**：建议在系统低峰时段执行
3. **数据备份**：首次执行前建议备份数据
4. **错误检查**：执行后检查返回的 `errors` 字段

## 🆘 获取帮助

如有问题，请：
1. 查看返回的 `errors` 字段
2. 检查服务器日志
3. 运行验证SQL脚本
4. 查阅完整文档

---

**版本**: v2.0  
**更新日期**: 2025-10-09  
**新特性**: ✨ 自动计算文件哈希值


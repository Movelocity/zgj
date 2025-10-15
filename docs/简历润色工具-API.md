# 职管家 - 简历润色工具 API 资源文档

## 📋 项目基本信息
**技术栈**: React.js + TypeScript + Go + PostgreSQL  
**认证方式**: JWT Token

---

## 🔐 用户认证 API

### 公共接口 (无需认证)
- `POST /api/user/register` - 用户注册
- `POST /api/user/login` - 用户登录
- `POST /api/user/send_sms` - 发送短信验证码
- `POST /api/user/verify_sms` - 验证短信验证码
- `POST /api/user/reset_password` - 重置密码
- `POST /api/user/auth` - 统一认证(自动注册+登录)

### 用户管理 (需要认证)
- `GET /api/user/profile` - 获取用户信息
- `PUT /api/user/profile` - 更新用户信息
- `POST /api/user/logout` - 用户登出
- `POST /api/user/upload_avatar` - 上传头像
- `POST /api/user/upload_resume` - 上传简历

---

## 📄 简历管理 API

### 简历操作
- `GET /api/user/resumes` - 获取用户简历列表(分页)
- `GET /api/user/resumes/:id` - 获取特定简历详情
- `PUT /api/user/resumes/:id` - 更新简历信息
- `DELETE /api/user/resumes/:id` - 删除简历(软删除)
- `POST /api/user/resumes/upload` - 上传新简历

### 工作流历史
- `GET /api/user/workflow_history` - 获取用户工作流使用历史(分页)

---

## 💬 对话管理 API
- `GET /api/conversation` - 获取对话列表
- `GET /api/conversation/:id` - 获取特定对话
- `POST /api/conversation` - 创建对话
- `PUT /api/conversation/:id` - 更新对话
- `DELETE /api/conversation/:id` - 删除对话

---

## 🔄 工作流管理 API

### 工作流操作
- `GET /api/workflow` - 获取工作流列表
- `GET /api/workflow/:id` - 获取特定工作流
- `POST /api/workflow` - 创建工作流
- `PUT /api/workflow/:id` - 更新工作流
- `DELETE /api/workflow/:id` - 删除工作流
- `POST /api/workflow/:id/execute` - 执行工作流

### 执行历史
- `GET /api/workflow/:id/history` - 工作流执行历史(分页)
- `GET /api/workflow/:id/stats` - 工作流统计信息
- `GET /api/execution/:id` - 获取执行详情

---

## 🛡️ 管理员 API

### 用户管理
- `GET /api/admin/user` - 获取所有用户(分页)
- `GET /api/admin/user/:id` - 获取特定用户
- `PUT /api/admin/user/:id` - 更新用户信息
- `DELETE /api/admin/user/:id` - 删除用户
- `POST /api/admin/user/:id/activate` - 激活用户
- `POST /api/admin/user/:id/deactivate` - 停用用户
- `GET /api/admin/user/:id/resumes` - 查看用户简历(分页)

### 系统管理
- `GET /api/admin/system/stats` - 获取系统统计
- `GET /api/admin/system/logs` - 获取系统日志(分页)

### 文件管理
- `GET /api/admin/files/stats` - 文件统计信息
- `GET /api/admin/files` - 文件列表管理(分页，支持类型筛选)
- `DELETE /api/admin/files/:id` - 删除文件
- `POST /api/admin/files/batch_delete` - 批量删除文件

### 工作流管理
- `GET /api/admin/workflow/all` - 获取所有工作流
- `PUT /api/admin/workflow/:id` - 管理员更新工作流

### 数据迁移
- `POST /api/admin/migration/resume` - 迁移旧简历数据

---

## 📊 数据模型

### 简历记录表 (resume_records)
```sql
CREATE TABLE resume_records (
    id VARCHAR(20) PRIMARY KEY,           -- TLID
    user_id VARCHAR(20) NOT NULL,         -- 所属用户
    resume_number VARCHAR(50) NOT NULL,   -- 简历编号 (R + 用户ID后6位 + 序号)
    version INTEGER DEFAULT 1,            -- 版本号
    name VARCHAR(255) NOT NULL,           -- 简历名称
    original_filename VARCHAR(255),       -- 原始文件名
    file_path VARCHAR(500),               -- 文件存储路径
    file_size BIGINT,                     -- 文件大小
    file_type VARCHAR(50),                -- 文件类型
    text_content TEXT,                    -- 纯文本内容
    structured_data JSONB,                -- 结构化数据
    status VARCHAR(20) DEFAULT 'active',  -- 状态（支持软删除）
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,                 -- 软删除时间
    
    INDEX idx_user_id (user_id),
    INDEX idx_resume_number (resume_number),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 工作流执行历史表 (workflow_executions)
```sql
CREATE TABLE workflow_executions (
    id VARCHAR(20) PRIMARY KEY,
    workflow_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    resume_id VARCHAR(20),                -- 关联的简历ID
    inputs JSONB,                         -- 输入参数
    outputs JSONB,                        -- 输出结果
    status VARCHAR(20),                   -- 执行状态
    error_message TEXT,                   -- 错误信息
    execution_time INTEGER,               -- 执行时间(ms)
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_workflow_id (workflow_id),
    INDEX idx_user_id (user_id),
    INDEX idx_resume_id (resume_id),
    INDEX idx_created_at (created_at)
);
```

---

## ✅ 功能状态
**完成度**: 98%  
**API总数**: 47个接口全部实现  
**最后更新**: 2025年10月15日

---

**文档版本**: v2.0  
**状态**: 生产就绪
# Implementation Tasks

> **MVP策略**: 聚焦核心功能，先实现端到端的PDF生成流程，验证和并发优化后续迭代。
> 
> - ✅ **核心任务** - MVP必需，优先实现
> - 🔧 **优化任务** - 性能和安全增强，后期迭代
> - 📝 **文档任务** - 可与开发并行

## 🎯 MVP核心流程

```
1. 创建导出任务 → 2. 调用Node.js生成PDF → 3. 保存文件 → 4. 前端下载
```

**MVP不包含**:
- ❌ 队列系统（直接同步/简单异步处理）
- ❌ Worker并发控制（单线程处理）
- ❌ 复杂的重试机制（简单错误处理）
- ❌ Token验证（直接传递简历数据）
- ❌ 事件日志（简单日志输出）

---

## 1. 数据库层 ✅ 核心 (MVP简化版)
- [x] 1.1 创建 `server/model/pdf_export_task.go` 模型
  - [x] 1.1.1 定义 `PdfExportTask` 结构体（MVP字段）
    ```go
    type PdfExportTask struct {
        ID             string    `gorm:"primaryKey;type:varchar(20)" json:"id"`
        UserID         string    `gorm:"type:varchar(20);not null" json:"user_id"`
        ResumeID       string    `gorm:"type:varchar(20);not null" json:"resume_id"`
        Status         string    `gorm:"size:20;default:'pending'" json:"status"` // pending/processing/completed/failed
        PdfFilePath    string    `gorm:"size:512" json:"pdf_file_path"`
        ErrorMessage   string    `gorm:"type:text" json:"error_message"`
        CreatedAt      time.Time `json:"created_at"`
        CompletedAt    *time.Time `json:"completed_at"`
    }
    ```
  - [x] 1.1.2 定义 TableName() 方法返回 "pdf_export_tasks"
  - [x] 1.1.3 定义状态常量（StatusPending, StatusProcessing, StatusCompleted, StatusFailed）
- [x] 1.2 在 `server/initialize/db.go` 添加自动迁移
- [x] 1.3 在 `server/model/enter.go` 导出新模型（不需要，直接使用）

**🔧 后期优化** (暂不实现):
- ❌ resume_snapshot 字段（MVP直接读取当前简历）
- ❌ token 和 token_used 字段（MVP不使用token验证）
- ❌ retry_count 字段（MVP不实现重试）
- ❌ updated_at 字段（MVP不需要）
- ❌ 复杂索引（MVP只需主键）

## 2. Go后端配置层 ✅ 核心 (MVP简化版)
- [x] 2.1 在 `server/config/config.go` 添加 PdfExport 配置结构
  ```go
  type PdfExportConfig struct {
      NodeServiceURL string `mapstructure:"node_service_url"` // Node.js服务地址
  }
  ```
- [x] 2.2 在 `server/config.example.yaml` 和 `server/config.yaml` 添加配置
  ```yaml
  pdf_export:
    node_service_url: "http://localhost:3001"
  ```

**🔧 后期优化** (暂不实现):
- ❌ render_base_url（MVP直接传递简历JSON数据）
- ❌ queue_size, worker_count（MVP不使用队列）
- ❌ task_timeout, max_retries（MVP简单超时处理）

## 3. Go后端服务层 ✅ 核心 (MVP简化版)
- [x] 3.1 创建 `server/service/pdfexport/pdf_export_service.go`
  - [x] 3.1.1 实现 CreateExportTask(userID, resumeID string) (string, error) 函数
    ```go
    // 1. 查询简历记录
    // 2. 生成任务ID（TLID）
    // 3. 创建任务记录（status=pending）
    // 4. 异步调用Node.js服务（goroutine）
    // 5. 返回任务ID
    ```
  - [x] 3.1.2 实现 GetTaskStatus(taskID string) (*model.PdfExportTask, error) 函数
    ```go
    // 1. 查询任务记录
    // 2. 返回任务状态（不验证权限，MVP简化）
    ```
  - [x] 3.1.3 实现 GeneratePdfAsync(taskID string, resumeData map[string]interface{}) 函数
    ```go
    // 1. 更新任务状态为processing
    // 2. 调用Node.js服务POST /generate
    // 3. 传递简历数据JSON（不使用渲染URL）
    // 4. 等待响应（简单超时120秒）
    // 5. 如果成功：接收回传的PDF，保存文件，更新status=completed
    // 6. 如果失败：更新status=failed，记录错误
    ```
  - [x] 3.1.4 实现 SavePdfFile(taskID string, fileData []byte) error 函数
    ```go
    // 1. 创建目录 server/uploads/pdf/YYYY-MM-DD/
    // 2. 保存PDF文件为 {taskId}.pdf
    // 3. 更新任务记录（pdf_file_path, status, completed_at）
    ```
  - [x] 3.1.5 实现 GetPdfFilePath(taskID string) (string, error) 函数
    ```go
    // 1. 查询任务记录
    // 2. 验证status=completed
    // 3. 返回文件路径（不验证权限，MVP简化）
    ```
- [x] 3.2 创建 `server/service/pdfexport/enter.go` 导出服务
- [x] 3.3 在 `server/service/enter.go` 导入 pdfexport 服务（不需要，直接调用）

**🔧 后期优化** (暂不实现):
- ❌ queue.go（MVP不使用队列，直接异步goroutine处理）
- ❌ worker.go（MVP不使用worker pool）
- ❌ 重试逻辑（MVP简单失败即停止）
- ❌ 权限验证（MVP信任API层已验证）
- ❌ Token验证（MVP直接传递数据）
- ❌ 简历快照（MVP读取当前简历）

## 4. Go后端API层 ✅ 核心 (MVP简化版)
- [x] 4.1 创建 `server/api/resume/pdf_export.go`
  - [x] 4.1.1 实现 CreateExportTask handler
    ```go
    // 1. 解析请求（resume_id）
    // 2. 获取当前用户ID（从JWT，基本验证）
    // 3. 查询简历数据
    // 4. 调用服务层创建任务（异步生成PDF）
    // 5. 返回任务ID
    ```
  - [x] 4.1.2 实现 GetExportTaskStatus handler
    ```go
    // 1. 解析路径参数（taskId）
    // 2. 调用服务层查询状态
    // 3. 返回任务状态（不验证权限，MVP简化）
    ```
  - [x] 4.1.3 实现 DownloadExportPdf handler
    ```go
    // 1. 解析路径参数（taskId）
    // 2. 调用服务层获取文件路径
    // 3. 读取文件
    // 4. 设置响应头（Content-Type: application/pdf, Content-Disposition）
    // 5. 返回文件流
    ```
- [x] 4.2 在 `server/router/resume.go` 注册路由
  - [x] 4.2.1 私有路由：POST /api/resume/export/create（需JWT）
  - [x] 4.2.2 私有路由：GET /api/resume/export/status/:taskId（需JWT）
  - [x] 4.2.3 私有路由：GET /api/resume/export/download/:taskId（需JWT）

**🔧 后期优化** (暂不实现):
- ❌ ExportCallback handler（MVP不使用回调，直接在Go中接收PDF）
- ❌ VerifyTokenAndGetResume handler（MVP不使用渲染页面）
- ❌ 复杂的权限验证（MVP基本JWT检查即可）
- ❌ 事件日志（MVP简单console日志）

## 5. Go后端初始化 ✅ 核心 (MVP简化版)
- [x] 5.1 在 `server/main.go` 添加简单日志（可选，配置已正确加载）
  ```go
  // 启动时检查配置
  log.Println("PDF Export Service URL:", global.Config.PdfExport.NodeServiceURL)
  ```

**🔧 后期优化** (暂不实现):
- ❌ InitPdfExportService()（MVP不使用队列和worker）
- ❌ 复杂的初始化逻辑（MVP按需创建）

## 6. Node.js子项目搭建
- [x] 6.1 创建 `server/pdfexport-service/` 目录
- [x] 6.2 创建 `server/pdfexport-service/package.json`
  ```json
  {
    "name": "resume-pdf-export-service",
    "version": "1.0.0",
    "scripts": {
      "start": "node src/server.js",
      "dev": "nodemon src/server.js"
    },
    "dependencies": {
      "express": "^4.18.2",
      "puppeteer": "^21.0.0",
      "axios": "^1.6.0",
      "form-data": "^4.0.0",
      "dotenv": "^16.0.0"
    },
    "devDependencies": {
      "nodemon": "^3.0.0"
    }
  }
  ```
- [x] 6.3 创建 `server/pdfexport-service/.env.example`（.env.example blocked by gitignore）
  ```
  PORT=3001
  GO_CALLBACK_URL=http://localhost:8888/api/resume/export/callback
  PDF_TIMEOUT=60000
  LOG_LEVEL=info
  ```
- [x] 6.4 创建 `server/pdfexport-service/.gitignore`
  ```
  node_modules/
  .env
  logs/
  temp/
  *.log
  ```

## 7. Node.js服务实现 ✅ 核心 (MVP简化版)
- [x] 7.1 创建 `server/pdfexport-service/src/server.js` (单文件实现)
  ```javascript
  // Express + Puppeteer 单文件服务
  const express = require('express');
  const puppeteer = require('puppeteer');
  const fs = require('fs');
  const path = require('path');
  
  const app = express();
  app.use(express.json({ limit: '10mb' })); // 接收简历数据
  
  // POST /generate - 接收简历数据，生成PDF，返回PDF文件
  app.post('/generate', async (req, res) => {
    const { task_id, resume_data } = req.body;
    
    try {
      // 1. 创建临时HTML文件（使用resume_data渲染）
      const html = generateResumeHtml(resume_data);
      const htmlPath = `/tmp/resume_${task_id}.html`;
      fs.writeFileSync(htmlPath, html);
      
      // 2. Puppeteer生成PDF
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      
      // 3. 清理临时HTML
      fs.unlinkSync(htmlPath);
      
      // 4. 返回PDF文件（二进制）
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${task_id}.pdf"`);
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // 简单的HTML模板生成函数（基于resume_data）
  function generateResumeHtml(data) {
    return `<!DOCTYPE html>
    <html><head><meta charset="UTF-8">
    <style>
      body { font-family: sans-serif; padding: 2rem; }
      /* ... 简历样式 ... */
    </style></head>
    <body>${JSON.stringify(data)}</body></html>`;
  }
  
  app.listen(3001, () => console.log('PDF service listening on 3001'));
  ```
- [x] 7.2 实现 HTML模板渲染逻辑
  - [x] 7.2.1 解析 resume_data JSON结构
  - [x] 7.2.2 生成符合简历格式的HTML
  - [x] 7.2.3 内联CSS样式（确保打印效果）
- [x] 7.3 创建 `server/pdfexport-service/README.md` (简单说明)
  ```markdown
  # PDF Export Service
  
  ## 快速启动
  ```bash
  cd server/pdfexport-service
  npm install
  npm start
  ```
  
  ## API
  POST /generate { task_id, resume_data } → 返回PDF文件
  ```

**🔧 后期优化** (暂不实现):
- ❌ 拆分为多个模块（config.js, logger.js, puppeteer.js等）
- ❌ upload.js（MVP不回传，直接在响应中返回PDF）
- ❌ 复杂的错误处理和重试
- ❌ 健康检查接口
- ❌ 日志文件（MVP使用console.log）
- ❌ 访问渲染URL（MVP直接传递JSON数据）

## 8. 前端API层 ✅ 核心 (MVP简化版)
- [x] 8.1 创建 `web/src/api/pdfExport.ts`
  ```typescript
  import request from './request';
  
  // 创建导出任务
  export const createExportTask = (resumeId: string) => {
    return request.post('/api/resume/export/create', { resume_id: resumeId });
  };
  
  // 查询任务状态
  export const getExportTaskStatus = (taskId: string) => {
    return request.get(`/api/resume/export/status/${taskId}`);
  };
  
  // 下载PDF（触发浏览器下载）
  export const downloadExportPdf = (taskId: string) => {
    window.open(`/api/resume/export/download/${taskId}`, '_blank');
  };
  ```

**🔧 后期优化** (暂不实现):
- ❌ verifyTokenAndGetResume（MVP不使用渲染页面）

## 9. 前端编辑页集成 ✅ 核心 (MVP简化版)
- [x] 9.1 在 `web/src/pages/editor/ResumeDetails.tsx` 添加导出选项
  ```typescript
  import { createExportTask, getExportTaskStatus, downloadExportPdf } from '@/api/pdfExport';
  import { showSuccess, showError, showInfo } from '@/utils/toast';
  
  // 添加按钮：服务端导出
  const handleServerExport = async () => {
    showInfo('正在生成PDF，请稍候...');
    
    try {
      // 1. 创建任务
      const res = await createExportTask(resumeId);
      const taskId = res.data.task_id;
      
      // 2. 轮询状态（简单版本）
      const checkStatus = async () => {
        const statusRes = await getExportTaskStatus(taskId);
        const status = statusRes.data.status;
        
        if (status === 'completed') {
          showSuccess('PDF生成完成！');
          downloadExportPdf(taskId); // 自动下载
        } else if (status === 'failed') {
          showError('PDF生成失败：' + statusRes.data.error_message);
        } else {
          // 继续轮询
          setTimeout(checkStatus, 2000);
        }
      };
      
      checkStatus();
      
    } catch (error) {
      showError('导出失败，请重试');
    }
  };
  ```

**🔧 后期优化** (暂不实现):
- ❌ 复杂的轮询控制（最大次数、取消轮询等）
- ❌ 进度条显示
- ❌ 导出历史列表

## 10. 类型定义 ✅ 核心 (MVP简化版)
- [x] 10.1 在 `web/src/types/api.ts` 添加类型
  ```typescript
  export interface PdfExportTask {
    id: string;
    user_id: string;
    resume_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    pdf_file_path?: string;
    error_message?: string;
    created_at: string;
    completed_at?: string;
  }
  ```

---

## 🔧 后期优化任务 (MVP完成后再考虑)

### 事件日志集成
- [ ] 在任务创建/成功/失败时记录事件日志

### 手动测试
- [ ] 端到端测试：创建任务 → 生成PDF → 下载
- [ ] 测试错误场景：Node.js不可用、PDF生成失败

### 部署配置
- [ ] 14.1 更新 `scripts/deploy.sh` 添加Node.js服务部署
  ```bash
  # 部署Node.js服务
  cd server/pdfexport-service
  npm install --production
  pm2 restart pdf-export-service || pm2 start src/server.js --name pdf-export-service
  ```
- [ ] 14.2 创建PM2配置文件（可选）

### 📝 文档 (可与开发并行)
- [ ] 15.1 更新 `docs/PDF_EXPORT_GUIDE.md` 添加服务端导出说明
- [ ] 15.2 简单的README说明Node.js服务启动方式

---

## 🚀 MVP实施总结

### MVP包含的核心功能
1. ✅ 数据库表和模型（简化字段）
2. ✅ Go配置和服务层（直接异步调用，无队列）
3. ✅ Go API（3个接口：创建/查询/下载）
4. ✅ Node.js单文件服务（接收JSON，返回PDF）
5. ✅ 前端API和集成（简单轮询）

### MVP不包含（后期优化）
- ❌ 队列和Worker系统
- ❌ 复杂的重试机制
- ❌ Token验证和渲染页面
- ❌ 简历快照（读取当前简历）
- ❌ 详细的权限验证
- ❌ 事件日志系统
- ❌ 回调机制（直接返回PDF）
- ❌ 并发控制
- ❌ 自动化测试

### 预计工作量
- **Go后端**: 2-3小时
- **Node.js服务**: 1-2小时
- **前端集成**: 1小时
- **测试调试**: 1-2小时
- **总计**: 5-8小时

### 验证标准
1. ✅ 用户点击"服务端导出"按钮
2. ✅ 系统创建任务并调用Node.js服务
3. ✅ Node.js使用Puppeteer生成PDF
4. ✅ Go接收PDF并保存
5. ✅ 前端轮询获取状态
6. ✅ PDF生成完成后自动下载


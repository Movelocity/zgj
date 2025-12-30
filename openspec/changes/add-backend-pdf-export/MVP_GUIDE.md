# 后端PDF导出 - MVP快速实施指南

> **目标**: 聚焦核心功能，5-8小时内完成可用的服务端PDF导出

## 🎯 MVP核心流程

```
用户点击导出 → 创建任务 → Go异步调用Node.js → Puppeteer生成PDF → 
保存文件 → 前端轮询 → 自动下载
```

## ✅ MVP包含什么

### 1. 最简数据库表
```sql
CREATE TABLE pdf_export_tasks (
    id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    resume_id VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending/processing/completed/failed
    pdf_file_path VARCHAR(512),
    error_message TEXT,
    created_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP
);
```

### 2. Go后端 (3个API)
- `POST /api/resume/export/create` - 创建任务，异步调用Node.js
- `GET /api/resume/export/status/:id` - 查询状态
- `GET /api/resume/export/download/:id` - 下载PDF

### 3. Node.js服务 (单文件)
```javascript
// POST /generate
// 接收：{ task_id, resume_data }
// 返回：PDF文件（二进制）

// 核心逻辑：
// 1. resume_data JSON → HTML
// 2. Puppeteer渲染HTML → PDF
// 3. 返回PDF buffer
```

### 4. 前端集成
```typescript
// 按钮点击
handleServerExport() {
  // 1. 调用创建API
  // 2. 每2秒轮询状态
  // 3. 完成后自动下载
}
```

## ❌ MVP不包含什么

| 功能 | 理由 | 后期计划 |
|------|------|----------|
| 队列系统 | 增加复杂度 | Phase 2优化 |
| Worker并发 | 单实例足够 | 负载高时添加 |
| Token验证 | 直接传数据更简单 | 安全增强时添加 |
| 独立渲染页面 | 不需要 | 可选优化 |
| 简历快照 | 读当前即可 | 历史导出功能时添加 |
| 复杂重试 | 简单错误处理 | 稳定性优化 |
| 事件日志 | console.log | 监控完善时添加 |
| 回调机制 | 直接返回PDF | 分布式部署时考虑 |

## 📋 实施步骤 (按顺序)

### Step 1: 数据库和模型 (30分钟)
```bash
# 1. 创建 server/model/pdf_export_task.go
# 2. 定义PdfExportTask结构体（简化字段）
# 3. 添加到 initialize/db.go 自动迁移
# 4. 启动服务，验证表创建成功
```

### Step 2: Go配置 (15分钟)
```bash
# 1. config/config.go 添加 PdfExportConfig
# 2. config.yaml 添加 pdf_export.node_service_url
```

### Step 3: Go服务层 (60分钟)
```bash
# 1. 创建 service/pdfexport/pdf_export_service.go
# 2. 实现 CreateExportTask() - 创建记录，启动goroutine
# 3. 实现 GeneratePdfAsync() - 调用Node.js，保存文件
# 4. 实现 GetTaskStatus() - 查询状态
# 5. 实现 GetPdfFilePath() - 获取文件路径
```

关键代码框架：
```go
func CreateExportTask(userID, resumeID string) (string, error) {
    // 1. 查询简历
    // 2. 生成任务ID
    // 3. 创建任务记录 (status=pending)
    // 4. 启动异步处理
    go GeneratePdfAsync(taskID, resumeData)
    // 5. 返回任务ID
}

func GeneratePdfAsync(taskID string, data map[string]interface{}) {
    // 1. 更新状态为processing
    // 2. 调用Node.js服务 (POST JSON)
    resp, err := http.Post(nodeURL+"/generate", body)
    // 3. 读取PDF响应
    pdfData, _ := io.ReadAll(resp.Body)
    // 4. 保存文件
    SavePdfFile(taskID, pdfData)
    // 5. 更新状态为completed
}
```

### Step 4: Go API层 (45分钟)
```bash
# 1. 创建 api/resume/pdf_export.go
# 2. 实现3个handler (CreateExportTask, GetStatus, Download)
# 3. 注册路由 router/resume.go
```

### Step 5: Node.js服务 (90分钟)
```bash
# 1. 创建 server/pdfexport-service/
# 2. 创建 package.json
# 3. npm install express puppeteer
# 4. 创建 src/server.js (单文件实现)
# 5. 实现 POST /generate 接口
# 6. 实现 HTML模板生成函数
# 7. 测试运行
```

核心代码：
```javascript
app.post('/generate', async (req, res) => {
  const { task_id, resume_data } = req.body;
  
  // 生成HTML
  const html = `<!DOCTYPE html>...${renderResumeHTML(resume_data)}...`;
  fs.writeFileSync(`/tmp/${task_id}.html`, html);
  
  // Puppeteer生成PDF
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file:///tmp/${task_id}.html`);
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  
  // 返回PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});
```

### Step 6: 前端API (30分钟)
```bash
# 1. 创建 web/src/api/pdfExport.ts
# 2. 实现3个函数 (create, getStatus, download)
```

### Step 7: 前端集成 (45分钟)
```bash
# 1. 编辑 pages/editor/ResumeDetails.tsx
# 2. 添加"服务端导出"按钮
# 3. 实现轮询逻辑
# 4. 添加Toast提示
```

### Step 8: 测试 (60分钟)
```bash
# 1. 启动Node.js服务：cd server/pdfexport-service && npm start
# 2. 启动Go服务
# 3. 启动前端
# 4. 端到端测试
# 5. 错误场景测试（Node.js关闭、超时等）
```

## 🧪 测试检查清单

- [ ] Node.js服务独立运行正常
- [ ] Go能调用Node.js服务
- [ ] 前端能创建导出任务
- [ ] 任务状态正确更新（pending → processing → completed）
- [ ] PDF文件能正常下载并打开
- [ ] 错误处理正常（失败任务标记为failed）
- [ ] 简历内容在PDF中正确渲染

## 📁 文件清单

### 新建文件
```
server/model/pdf_export_task.go              (Go模型)
server/service/pdfexport/
  ├── pdf_export_service.go                  (服务层)
  └── enter.go                               (导出)
server/api/resume/pdf_export.go              (API层)
server/pdfexport-service/
  ├── package.json                           (Node.js依赖)
  └── src/server.js                          (Node.js服务)
web/src/api/pdfExport.ts                     (前端API)
```

### 修改文件
```
server/config/config.go                      (添加配置)
server/config.yaml                           (配置值)
server/initialize/db.go                      (自动迁移)
server/router/resume.go                      (路由注册)
web/src/pages/editor/ResumeDetails.tsx       (添加按钮)
web/src/types/api.ts                         (添加类型)
```

## 🚀 快速启动

### 开发环境
```bash
# Terminal 1: Node.js服务
cd server/pdfexport-service
npm install
npm start

# Terminal 2: Go服务
cd server
go run main.go

# Terminal 3: 前端
cd web
pnpm dev
```

### 配置
```yaml
# server/config.yaml
pdf_export:
  node_service_url: "http://localhost:3001"
```

## 🐛 常见问题

### Q1: Puppeteer安装失败
```bash
# 使用国内镜像
npm config set puppeteer_download_host=https://npm.taobao.org/mirrors
npm install puppeteer
```

### Q2: PDF生成空白
- 检查HTML模板是否正确
- 检查Puppeteer是否等待页面加载
- 检查console日志是否有错误

### Q3: Go无法连接Node.js
- 检查Node.js服务是否启动（curl http://localhost:3001）
- 检查config.yaml中的URL配置
- 检查防火墙设置

### Q4: 任务一直是processing状态
- 检查Go是否正确调用Node.js
- 检查Node.js日志是否有错误
- 检查异步goroutine是否panic

## 📊 性能预期

| 指标 | MVP目标 | 备注 |
|------|---------|------|
| PDF生成时间 | 5-10秒 | 取决于简历复杂度 |
| 并发支持 | 3-5个 | 单实例Puppeteer限制 |
| PDF文件大小 | 100-500KB | 纯文本简历 |
| 存储占用 | 按需清理 | 可手动删除旧文件 |

## 🎉 完成标志

MVP完成当满足以下条件：
1. ✅ 用户能点击按钮触发服务端导出
2. ✅ 系统能生成PDF文件并保存
3. ✅ 前端能轮询状态并自动下载
4. ✅ 错误场景有基本提示
5. ✅ PDF内容正确渲染简历信息

---

**下一步**: 完成MVP后，参考 `tasks.md` 中的"后期优化"部分，逐步添加队列、重试、事件日志等高级功能。


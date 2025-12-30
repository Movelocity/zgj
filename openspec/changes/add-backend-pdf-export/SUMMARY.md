# 后端PDF导出服务 - 提案摘要

## ✅ 提案状态

- **Change ID**: `add-backend-pdf-export`
- **验证状态**: ✅ 通过严格验证 (`openspec validate --strict`)
- **实施策略**: 🎯 **MVP优先** - 聚焦核心功能，验证和并发后期优化
- **MVP工作量**: 预计5-8小时（10个核心任务）
- **完整任务**: 49项（包含所有优化和扩展）
- **影响范围**: 新增能力，无破坏性变更

> 📖 **快速开始**: 参见 `MVP_GUIDE.md` 获取简化的实施指南

## 📋 核心功能

### 1. 服务端PDF生成
使用Puppeteer无头浏览器在服务端生成PDF，确保跨平台一致性

### 2. 异步任务系统
- 内存队列管理（容量100）
- 3个并发消费者（可配置）
- 任务状态追踪（pending → processing → completed/failed）
- 超时控制（120秒）和重试机制（最多3次）

### 3. 多系统协同
```
前端编辑页 → Go后端API → 任务队列 → Go消费者 → Node.js服务 
                ↑                                        ↓
                └────────── HTTP回调（PDF文件） ←─────────┘
```

### 4. 独立渲染页面
- 路由：`/export/:taskId?token=xxx`
- 一次性token验证（10分钟有效期）
- 简历内容快照（不受后续编辑影响）

### 5. 前端轮询下载
- 每2秒轮询任务状态
- 显示进度提示（排队中/生成中/已完成）
- 任务完成后自动下载PDF

## 🏗️ 架构设计

### 数据库层
**新表**: `pdf_export_tasks`
- 字段：任务ID、用户ID、简历ID、简历快照、状态、token、PDF路径、错误信息、时间戳
- 索引：user_id, status, token

### Go后端层
**新增模块**:
- `model/pdf_export_task.go` - 数据模型
- `service/pdfexport/` - 业务逻辑（任务管理、队列、worker）
- `api/resume/pdf_export.go` - API处理器

**新增API**:
- `POST /api/resume/export/create` - 创建任务
- `GET /api/resume/export/status/:taskId` - 查询状态
- `GET /api/resume/export/download/:taskId` - 下载PDF
- `POST /api/resume/export/callback` - 接收Node.js回调（内部）
- `POST /api/resume/export/verify-token` - 验证渲染页面token

### Node.js服务层
**新项目**: `server/pdfexport-service/`
- Express HTTP服务器
- Puppeteer PDF生成
- 文件回传（multipart/form-data）

**目录结构**:
```
server/pdfexport-service/
├── package.json
├── .env.example
├── src/
│   ├── server.js       # 主服务
│   ├── puppeteer.js    # PDF生成
│   ├── upload.js       # 文件上传
│   ├── config.js       # 配置管理
│   └── logger.js       # 日志工具
└── README.md
```

### 前端层
**新增页面**:
- `web/src/pages/export/ResumeExportView.tsx` - 渲染页面

**扩展页面**:
- `web/src/pages/editor/ResumeDetails.tsx` - 添加"服务端导出"选项

**新增API客户端**:
- `web/src/api/pdfExport.ts`

## 🔐 安全设计

1. **一次性Token**: UUID v4，10分钟有效期，使用后立即失效
2. **权限验证**: 所有API验证用户身份和资源所有权
3. **路径安全**: 防止路径遍历攻击，文件路径白名单验证
4. **并发控制**: 队列容量限制，防止资源耗尽

## 📊 性能考量

- **队列容量**: 100个待处理任务
- **并发Worker**: 3个（可配置）
- **任务超时**: 120秒
- **重试策略**: 最多3次，间隔5秒
- **文件清理**: 30天后自动清理（未来功能）

## 🚀 实施计划

### Phase 1: 基础设施 (任务1-5)
- 数据库模型和迁移
- Go配置层
- Go服务层骨架
- Node.js项目搭建

### Phase 2: 核心功能 (任务6-10)
- Node.js PDF生成服务
- Go API和队列系统
- 前端渲染页面
- 前端编辑页集成

### Phase 3: 集成测试 (任务11-13)
- 端到端测试
- 错误场景测试
- 并发测试

### Phase 4: 部署和文档 (任务14-16)
- 部署脚本
- PM2配置
- 文档更新

## 📦 依赖项

### 运行时依赖
- Node.js 18+
- Puppeteer (npm)
- Express (npm)
- Axios (npm)
- Form-data (npm)

### Go包依赖
- 无新增Go依赖（使用标准库）

## 🔧 配置示例

### config.yaml
```yaml
pdf_export:
  node_service_url: "http://localhost:3001"
  render_base_url: "http://localhost:8888"
  queue_size: 100
  worker_count: 3
  task_timeout: 120
  max_retries: 3
```

### .env (Node.js服务)
```env
PORT=3001
GO_CALLBACK_URL=http://localhost:8888/api/resume/export/callback
PDF_TIMEOUT=60000
LOG_LEVEL=info
```

## 📈 监控和日志

### 事件日志
- `pdf_export_create` - 任务创建
- `pdf_export_success` - 生成成功
- `pdf_export_failed` - 生成失败

### 关键指标
- 任务创建速率
- 任务成功率
- 平均处理时间
- 队列长度
- Node.js服务可用性

## ⚠️ 风险和缓解

### 风险1: Node.js服务故障
- **缓解**: 自动重试机制，失败任务清晰标记
- **降级**: 保留客户端导出功能

### 风险2: Puppeteer资源消耗
- **缓解**: 限制并发数量（3个worker）
- **扩展**: 支持多实例Node.js服务

### 风险3: Token安全
- **缓解**: 短有效期（10分钟），一次性使用
- **影响**: 单个任务泄露，不影响其他任务

## 🎯 下一步行动

1. **获取批准**: 请审查本提案，确认技术方案和实施计划
2. **环境准备**: 确认开发环境已安装Node.js 18+
3. **开始实施**: 按照tasks.md顺序执行（建议从Phase 1开始）
4. **定期同步**: 每个Phase完成后进行review

## 📚 相关文档

- `proposal.md` - 详细提案说明
- `design.md` - 架构设计决策
- `specs/pdf-export/spec.md` - 功能规格（14个需求，42个场景）
- `tasks.md` - 实施任务清单（49项）

## ✨ 亮点

1. **完全解耦**: Node.js服务独立部署，可单独扩展
2. **简历快照**: 确保导出内容不受编辑影响
3. **安全可靠**: 一次性token，权限验证，路径保护
4. **易于监控**: 完整的事件日志和状态追踪
5. **用户体验**: 异步处理，进度可见，自动下载

---

**提案创建时间**: 2025-12-30
**验证状态**: ✅ 通过 `openspec validate add-backend-pdf-export --strict`


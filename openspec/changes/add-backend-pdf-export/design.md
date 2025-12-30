# Design: 后端PDF导出服务

## Context

当前系统的PDF导出完全依赖客户端浏览器，无法保证跨浏览器的一致性，也无法追踪导出历史。需要构建一个服务端PDF生成系统，使用统一的渲染引擎（Chromium/Puppeteer）确保输出质量。

该服务涉及多个系统组件的协同：
- **Go后端**：任务管理、队列调度、文件存储
- **Node.js服务**：PDF生成（使用Puppeteer）
- **前端页面**：独立渲染页面、状态轮询
- **数据库**：任务状态持久化

## Goals / Non-Goals

### Goals
1. 实现服务端PDF导出，确保跨平台一致性
2. 提供异步任务系统，支持排队和状态追踪
3. 保存简历快照，确保导出时的内容不受后续编辑影响
4. 支持并发导出请求，使用队列控制资源消耗
5. 提供完整的错误处理和超时机制

### Non-Goals
1. 不支持实时预览（仍使用前端客户端预览）
2. 不支持PDF编辑或合并功能
3. 不实现复杂的权限管理（仅限任务创建者下载）
4. 暂不支持导出模板自定义（使用统一渲染页面）

## Decisions

### 1. 架构选择：Go + Node.js 分离服务

**决策**：使用Go作为主服务处理业务逻辑和任务调度，使用独立的Node.js服务专门处理PDF生成。

**理由**：
- Go没有成熟的无头浏览器库，而Puppeteer是Node.js生态中最成熟的方案
- 分离服务可以独立扩展和部署PDF生成能力
- Node.js服务可以独立重启而不影响主服务

**替代方案**：
- ❌ **Go调用Chrome DevTools Protocol**：实现复杂，生态不成熟
- ❌ **使用第三方PDF服务**：增加外部依赖和成本
- ❌ **纯Go HTML转PDF库**：渲染质量不如真实浏览器

### 2. 通信方式：HTTP + 文件回传

**决策**：
- Go → Node.js：HTTP POST请求，传递渲染URL和任务ID
- Node.js → Go：HTTP POST multipart/form-data，回传PDF文件和结果

**理由**：
- HTTP是最简单可靠的跨语言通信方式
- 文件回传避免了共享文件系统的复杂性
- 支持分布式部署（Node.js服务可部署在不同机器）

**替代方案**：
- ❌ **消息队列（RabbitMQ/Redis）**：增加系统复杂度，小规模应用不需要
- ❌ **gRPC**：过度设计，HTTP足够简单有效
- ❌ **共享文件系统**：不支持分布式部署，增加耦合

### 3. 任务队列：内存队列 + Goroutine消费者

**决策**：使用Go channel实现内存任务队列，启动固定数量的goroutine消费者。

**理由**：
- 简单轻量，无需引入外部依赖
- 支持优雅关闭和错误恢复
- 对于单机部署足够高效

**配置**：
- 队列容量：100
- 消费者数量：3（可配置）
- 任务超时：120秒

**替代方案**：
- ❌ **Redis队列**：增加Redis依赖，小规模应用不需要
- ❌ **数据库轮询**：效率低，增加数据库负担
- ⚠️ **异步任务框架（如Machinery）**：可作为未来扩展方案

### 4. 渲染页面安全：一次性Token

**决策**：创建导出任务时生成一次性token，渲染页面通过URL参数传递token进行验证。

**理由**：
- 渲染页面需要无登录访问（Puppeteer无法处理登录流程）
- 一次性token防止链接被重复使用或泄露
- token有效期10分钟，足够生成PDF但防止长期滥用

**实现**：
- Token格式：UUID v4
- 存储：随任务记录保存在数据库
- 验证：前端页面加载时调用验证API，验证成功后删除token

**替代方案**：
- ❌ **JWT签名**：需要后端验证，增加请求复杂度
- ❌ **无认证**：安全风险高，任何人可访问简历内容
- ❌ **Session认证**：Puppeteer无法处理Cookie

### 5. 简历数据存储：快照模式

**决策**：创建导出任务时，将简历的 `structured_data` 快照保存在任务记录中。

**理由**：
- 确保导出内容不受后续编辑影响
- 支持历史导出重新下载
- 隔离简历编辑和导出逻辑

**字段**：
- `resume_snapshot` (JSONB)：完整的简历结构化数据

**替代方案**：
- ❌ **直接读取当前简历**：用户编辑后导出结果可能不一致
- ❌ **引用简历版本**：增加复杂度，简历版本系统未完善

### 6. 文件存储：本地文件系统

**决策**：生成的PDF文件存储在 `server/uploads/pdf/` 目录，按日期分目录。

**路径格式**：
```
server/uploads/pdf/YYYY-MM-DD/{taskId}.pdf
```

**理由**：
- 与现有文件上传系统保持一致
- 便于清理过期文件（按日期目录）
- 无需引入对象存储服务

**清理策略**（未来实现）：
- 定期清理30天前的PDF文件
- 保留任务记录但删除文件

**替代方案**：
- ⚠️ **对象存储（TOS/S3）**：可作为未来扩展，适合大规模部署
- ❌ **数据库存储BLOB**：文件过大，影响数据库性能

### 7. 错误处理和重试

**决策**：
- Node.js服务失败：Go重试最多3次（间隔5秒）
- 超时：任务总超时120秒
- 失败任务：标记为 `failed` 状态，记录错误信息，不自动重试

**理由**：
- 适度重试应对临时网络故障
- 超时防止资源占用过久
- 不自动重试避免浪费资源（用户可手动重新创建）

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌────────────────┐           ┌─────────────────────┐      │
│  │ ResumeDetails  │           │ ResumeExportView    │      │
│  │  (编辑页)      │           │  (渲染页)           │      │
│  └────────┬───────┘           └──────────▲──────────┘      │
│           │                              │                  │
└───────────┼──────────────────────────────┼──────────────────┘
            │ 1.创建任务                    │ 3.访问渲染页
            │ 2.轮询状态                    │   (带token)
            │ 5.下载PDF                     │
            ▼                              │
┌─────────────────────────────────────────┼──────────────────┐
│                      Go Backend         │                  │
│  ┌──────────────────┐    ┌─────────────┴────────┐         │
│  │ Export API       │    │ Render Page Route    │         │
│  │ - create         │    │ - verify token       │         │
│  │ - status         │    │ - return resume data │         │
│  │ - download       │    └──────────────────────┘         │
│  │ - callback       │                                      │
│  └────┬─────────────┘                                      │
│       │ push                                               │
│       ▼                                                    │
│  ┌──────────────────┐     ┌──────────────┐               │
│  │ Task Queue       │────▶│ Consumer     │               │
│  │ (channel)        │     │ (goroutine)  │               │
│  └──────────────────┘     └──────┬───────┘               │
│                                   │ 4.调用Node.js         │
│                                   │   (HTTP)              │
│  ┌──────────────────┐            │                       │
│  │ Database         │            │                       │
│  │ pdf_export_tasks │            │                       │
│  └──────────────────┘            │                       │
└────────────────────────────────────┼──────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────┐
│                  Node.js PDF Service                     │
│  ┌─────────────────────────────────────────────┐        │
│  │ Express Server                              │        │
│  │  - POST /generate                           │        │
│  │    1. 使用Puppeteer访问渲染URL              │        │
│  │    2. 生成PDF文件                           │        │
│  │    3. POST文件和结果回Go callback API       │        │
│  └─────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

## API Specifications

### 1. POST /api/resume/export/create
创建PDF导出任务

**Request**:
```json
{
  "resume_id": "01HXXX...",
  "options": {
    "format": "a4",
    "margin": "2rem"
  }
}
```

**Response**:
```json
{
  "code": 0,
  "data": {
    "task_id": "01HYYY...",
    "status": "pending"
  },
  "msg": "任务创建成功"
}
```

### 2. GET /api/resume/export/status/:taskId
查询任务状态

**Response**:
```json
{
  "code": 0,
  "data": {
    "task_id": "01HYYY...",
    "status": "completed",  // pending/processing/completed/failed
    "progress": 100,
    "pdf_url": "/api/resume/export/download/01HYYY...",
    "created_at": "2025-12-30T10:00:00Z",
    "completed_at": "2025-12-30T10:01:30Z"
  },
  "msg": "success"
}
```

### 3. GET /api/resume/export/download/:taskId
下载生成的PDF

**Response**: PDF文件流（Content-Type: application/pdf）

### 4. POST /api/resume/export/callback (内部API)
Node.js服务回调（Go接收）

**Request** (multipart/form-data):
- `task_id`: 任务ID
- `status`: success/failed
- `error`: 错误信息（可选）
- `pdf_file`: PDF文件（二进制）

**Response**:
```json
{
  "code": 0,
  "msg": "callback received"
}
```

### 5. GET /export/:taskId (Frontend)
渲染页面路由

**Query Params**:
- `token`: 一次性验证token

**Response**: HTML页面（渲染简历内容）

### 6. POST /generate (Node.js Service)
生成PDF（Go调用Node.js）

**Request**:
```json
{
  "task_id": "01HYYY...",
  "render_url": "https://domain.com/export/01HYYY?token=xxx",
  "callback_url": "https://domain.com/api/resume/export/callback",
  "options": {
    "format": "a4",
    "margin": "2rem",
    "timeout": 60000
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "PDF generated and uploaded"
}
```

## Database Schema

### pdf_export_tasks 表

```sql
CREATE TABLE pdf_export_tasks (
    id VARCHAR(20) PRIMARY KEY,          -- TLID
    user_id VARCHAR(20) NOT NULL,        -- 创建用户
    resume_id VARCHAR(20) NOT NULL,      -- 关联简历
    resume_snapshot JSONB NOT NULL,      -- 简历内容快照
    status VARCHAR(20) NOT NULL,         -- pending/processing/completed/failed
    token VARCHAR(64),                   -- 一次性验证token
    token_used BOOLEAN DEFAULT FALSE,    -- token是否已使用
    pdf_file_path VARCHAR(512),          -- PDF文件路径
    error_message TEXT,                  -- 错误信息
    retry_count INT DEFAULT 0,           -- 重试次数
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (resume_id) REFERENCES resume_records(id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_token (token)
);
```

## Node.js Service Structure

```
server/pdfexport-service/
├── package.json
├── .env.example
├── src/
│   ├── server.js           # Express服务入口
│   ├── puppeteer.js        # Puppeteer PDF生成逻辑
│   ├── upload.js           # 文件上传到Go后端
│   └── config.js           # 配置管理
├── logs/                   # 日志目录
└── README.md              # 服务说明文档
```

## Deployment Considerations

### 开发环境
- Go服务：端口8888
- Node.js服务：端口3001
- 前端开发服务器：端口5173

### 生产环境
- Go和Node.js服务部署在同一服务器
- Node.js服务使用PM2管理
- Nginx反向代理，统一入口

### 配置项 (server/config.yaml)
```yaml
pdf_export:
  node_service_url: "http://localhost:3001"
  render_base_url: "http://localhost:8888"  # Puppeteer访问的URL
  queue_size: 100
  worker_count: 3
  task_timeout: 120  # 秒
  max_retries: 3
```

## Risks / Trade-offs

### 风险1：Node.js服务故障导致导出不可用
- **缓解**：Go后端重试机制，失败任务标记清晰
- **监控**：记录事件日志，跟踪Node.js调用失败率

### 风险2：Puppeteer资源消耗高
- **缓解**：限制并发消费者数量（默认3个）
- **扩展**：未来可增加多实例Node.js服务

### 风险3：一次性token被劫持
- **缓解**：token有效期短（10分钟），使用后立即失效
- **影响**：单个任务泄露，不影响其他任务

### 权衡1：内存队列 vs 持久化队列
- **选择**：内存队列
- **理由**：简单高效，服务重启丢失少量任务可接受
- **未来**：如需高可靠性，可迁移到Redis队列

### 权衡2：同步等待 vs 异步回调
- **选择**：异步回调
- **理由**：PDF生成耗时长（5-30秒），避免阻塞HTTP请求
- **体验**：前端轮询显示进度，用户体验更好

## Migration Plan

### Phase 1: 基础设施搭建
1. 创建数据库表（GORM自动迁移）
2. 搭建Node.js服务骨架
3. 实现基础的队列和消费者

### Phase 2: 核心功能开发
1. 实现Go API和服务层
2. 实现Node.js PDF生成
3. 实现渲染页面

### Phase 3: 集成测试
1. 端到端测试导出流程
2. 测试错误处理和重试
3. 性能测试（并发导出）

### Phase 4: 前端集成
1. 添加导出按钮和状态轮询
2. 显示导出历史（可选）

### Rollback Plan
- 保留客户端导出功能作为备选
- Node.js服务故障时降级到客户端导出
- 数据库表结构向后兼容，可直接删除

## Open Questions

1. **是否需要导出历史页面？**
   - 当前设计：任务记录保存在数据库，可查询历史
   - 可选：添加导出历史管理页面

2. **PDF文件清理策略？**
   - 建议：30天后自动清理
   - 实现：定时任务（未来）

3. **是否支持批量导出？**
   - 当前：不支持
   - 未来：可扩展批量创建任务

4. **是否需要限流？**
   - 当前：依赖队列容量自然限流
   - 未来：可添加用户级限流（如每分钟最多5个任务）


# 职管加

职管加是一个简历上传、解析、结构化编辑、AI 优化和 PDF 导出的工具。本分支使用本机 LangChain 服务替代原 Dify 工作流，并补齐了服务端 PDF 导出链路。

## 本机服务拓扑

| 服务 | 端口 | 作用 | 启动目录 |
| --- | --- | --- | --- |
| Go 后端 | `8888` | API、静态前端、数据库、工作流代理 | `server/` |
| LangChain 工作流服务 | `8890` | `doc_extract`、`smart-format-2`、`common-analysis`、`basic-chat` | `langchain-service/` |
| PDF 导出服务 | `8889` | 接收 Go 后端 `/generate` 请求并生成 PDF | `server/pdfexport-service/` |
| 前端构建产物 | 由 `8888` 提供 | React/Vite SPA，生产构建后由 Go 后端托管 | `web/dist/` |

正常使用时访问：

```bash
http://127.0.0.1:8888
```

不要直接访问 `http://localhost:8889/generate`，它是 PDF 服务的 `POST` 接口，不是浏览器页面。

## 环境要求

- Go 1.21+
- Node.js 18+
- pnpm
- PostgreSQL
- Playwright CLI（PDF 服务使用）

检查 Playwright：

```bash
playwright --help
```

如果没有安装浏览器内核：

```bash
playwright install chromium
```

## 1. 准备配置

### Go 后端

确认 `server/config.yaml` 中的数据库和 PDF 配置可用：

```yaml
server:
  port: 8888

pgsql:
  host: "127.0.0.1"
  port: 5432
  db-name: "zgj"
  username: "frank"
  password: "''"
  sslmode: "disable"

pdf_export:
  node_service_url: "http://localhost:8889"
  render_base_url: "http://localhost:8888"
```

### LangChain 服务

复制环境变量模板：

```bash
cd langchain-service
cp .env.example .env
```

编辑 `langchain-service/.env`：

```bash
PORT=8890
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-chat
LLM_TIMEOUT_MS=180000
UPLOAD_DIR=./data/uploads
```

`.env`、`node_modules/`、`dist/`、`data/` 已被 `langchain-service/.gitignore` 排除，不要提交真实密钥和上传缓存。

## 2. 安装依赖

后端：

```bash
cd server
go mod download
```

前端：

```bash
cd web
pnpm install
```

LangChain 服务：

```bash
cd langchain-service
npm install
```

PDF 导出服务：

```bash
cd server/pdfexport-service
npm install
```

当前 PDF 服务只依赖 Node.js 标准库和本机 `playwright` CLI，`npm install` 主要用于保持服务目录标准化。

## 3. 初始化工作流配置

本分支通过数据库里的工作流配置把原 Dify 调用指向本机 LangChain 服务。

```bash
psql -d zgj -f scripts/seed_langchain_workflows.sql
```

执行后这些工作流会指向 `http://127.0.0.1:8890`：

- `upload_file`
- `doc_extract`
- `resume_structure`
- `basic-chat`
- `common-analysis`
- `smart-format-2`

## 4. 构建前端

Go 后端会托管 `web/dist/`，所以启动后端前先构建前端：

```bash
cd web
pnpm build
```

开发调试前端也可以单独启动 Vite：

```bash
cd web
pnpm dev
```

但完整本机联调推荐访问 `http://127.0.0.1:8888`。

## 5. 启动全部服务

建议开 3 个终端分别运行。

### 终端 A：启动 Go 后端

```bash
cd server
./server
```

如果没有二进制，先构建：

```bash
cd server
go build -o server main.go
./server
```

也可以直接：

```bash
cd server
go run main.go
```

### 终端 B：启动 LangChain 工作流服务

```bash
cd langchain-service
npm start
```

健康检查：

```bash
curl --noproxy 127.0.0.1 -s http://127.0.0.1:8890/health
```

期望返回：

```json
{"ok":true,"service":"zgj-langchain-service","model":"deepseek-chat","hasDeepSeekApiKey":true}
```

### 终端 C：启动 PDF 导出服务

```bash
cd server/pdfexport-service
npm start
```

健康检查：

```bash
curl --noproxy 127.0.0.1 -s http://127.0.0.1:8889/health
```

期望返回：

```json
{"ok":true,"service":"zgj-pdfexport-service"}
```

## 6. 验证运行状态

确认三个端口都在：

```bash
lsof -nP -iTCP:8888 -sTCP:LISTEN
lsof -nP -iTCP:8890 -sTCP:LISTEN
lsof -nP -iTCP:8889 -sTCP:LISTEN
```

确认前端可访问：

```bash
curl --noproxy 127.0.0.1 -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8888/
```

返回 `200` 即正常。

## 7. 常用测试账号

本机调试可使用之前创建的测试账号：

```text
手机号：13800000000
密码：Test123456
```

登录接口示例：

```bash
curl --noproxy 127.0.0.1 -s -X POST http://127.0.0.1:8888/api/user/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000000","password":"Test123456"}'
```

## 8. 冒烟测试

后端：

```bash
cd server
go test ./...
```

前端：

```bash
cd web
pnpm build
```

LangChain 服务：

```bash
cd langchain-service
npm run typecheck
npm run smoke
npm run smoke:doc
```

PDF 导出服务：

```bash
curl --noproxy 127.0.0.1 -s http://127.0.0.1:8889/health
```

完整 PDF 导出需要同时运行 `8888` 和 `8889`。前端点击“导出PDF”时默认走服务端导出。

## 9. 常见问题

### 工作流报错 `connect: connection refused 127.0.0.1:8890`

说明 LangChain 服务没有启动：

```bash
cd langchain-service
npm start
```

### 浏览器打开了 `http://localhost:8889/generate`

这是 PDF 服务接口，不是页面。请访问：

```bash
http://127.0.0.1:8888
```

### PDF 远程导出失败

检查：

```bash
curl --noproxy 127.0.0.1 -s http://127.0.0.1:8889/health
playwright --help
```

同时确认 `server/config.yaml`：

```yaml
pdf_export:
  node_service_url: "http://localhost:8889"
  render_base_url: "http://localhost:8888"
```

### 上传简历后没有立即显示

当前逻辑应为：解析/结构化完成后左侧立即显示，AI 诊断和优化卡片生成进度在右侧聊天框继续显示。若仍卡住，先检查 `8890` 是否在线。

## 更多文档

- [部署指南](./docs/DEPLOYMENT.md)
- [LangChain / Dify 替换说明](./docs/LANGCHAIN_DIFY_REPLACEMENT.md)
- [PDF 导出指南](./docs/PDF_EXPORT_GUIDE.md)

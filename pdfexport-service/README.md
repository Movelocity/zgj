# PDF Export Service

简历PDF导出服务，使用Puppeteer在服务端生成高质量的PDF文件。

## 快速启动

### 安装依赖

```bash
cd server/pdfexport-service
npm install
```

### 启动服务

```bash
# 生产模式
npm start

# 开发模式（带自动重启）
npm run dev
```

服务默认运行在 `http://localhost:3001`

## API接口

### 健康检查

```bash
GET /health
```

返回服务状态。

### 生成PDF

```bash
POST /generate
Content-Type: application/json

{
  "task_id": "01HXXX...",
  "render_url": "http://localhost:5173/export/01HXXX?token=xxx"
}
```

**说明**：
- `task_id`: 导出任务ID
- `render_url`: 前端渲染页面URL（包含token参数）

服务将访问该URL，使用Puppeteer生成PDF，并返回PDF文件（二进制流）。

## 工作原理

1. Go 后端创建PDF导出任务，生成唯一的 token
2. Go 后端构建渲染 URL：`{render_base_url}/export/{taskId}?token={token}`
3. Go 后端调用 Node.js 服务的 `/generate` 接口，传递 render_url
4. Node.js 服务使用 Puppeteer 访问该 URL
5. 前端渲染页面验证 token 并显示简历内容（使用 Tailwind CSS）
6. Puppeteer 等待页面完全加载后生成 PDF
7. PDF 文件返回给 Go 后端保存
8. 用户可以下载生成的 PDF

## 环境变量

```bash
PORT=3001              # 服务端口，默认3001
LOG_LEVEL=info         # 日志级别
```

## 故障排查

### Puppeteer安装失败

如果遇到Puppeteer下载Chromium失败，可以使用国内镜像：

```bash
npm config set puppeteer_download_host=https://npm.taobao.org/mirrors
npm install puppeteer
```

```bash
pnpm exec puppeteer browsers install chrome
```

### PDF生成空白

1. 检查resume_data是否包含有效数据
2. 查看服务日志输出
3. 检查HTML模板生成是否正确

### 内存不足

Puppeteer可能占用较多内存，建议：
- 限制并发处理数量
- 定期重启服务
- 监控内存使用情况

## 生产部署

推荐使用PM2管理Node.js进程：

```bash
npm install -g pm2
pm2 start src/server.js --name pdf-export-service
pm2 save
pm2 startup
```

## 技术栈

- **Express**: Web框架
- **Puppeteer**: 无头浏览器，PDF生成
- **Node.js**: 运行时环境

## 配置说明

确保 Go 后端的 `config.yaml` 正确配置：

```yaml
pdf_export:
  node_service_url: "http://localhost:3001"      # Node.js服务地址
  render_base_url: "http://localhost:5173"       # 前端渲染页面基础URL
```

**注意**：
- 开发环境：`render_base_url` 设置为前端开发服务器地址（http://localhost:5173）
- 生产环境：`render_base_url` 设置为生产服务器地址（http://localhost:8888 或域名）

## 开发说明

### 调整PDF配置

修改 `page.pdf()` 的参数：

```javascript
await page.pdf({
  format: 'A4',           // 页面大小
  printBackground: true,  // 打印背景色
  margin: {               // 页边距
    top: '20mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm',
  },
});
```

## 许可证

MIT


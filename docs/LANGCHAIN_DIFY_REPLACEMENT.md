# LangChain Dify Replacement

这个仓库没有内置 Dify 服务。现在新增了一个本地 `langchain-service`，它提供 Dify 兼容接口，让现有 Go 后端可以继续通过 `workflows` 表调用：

- `POST /v1/files/upload`
- `POST /v1/workflows/run`

内部模型使用 LangChain TS/JS 的 `@langchain/deepseek` 和 DeepSeek API。服务源码位于 `langchain-service/src/*.ts`，运行前会编译到 `langchain-service/dist/`。

## 启动

```bash
cd langchain-service
npm install
cp .env.example .env
```

编辑 `.env`：

```bash
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-chat
```

启动服务：

```bash
npm start
```

默认地址是 `http://127.0.0.1:8890`。

## 写入本地 workflow 配置

在项目根目录执行：

```bash
psql -d zgj -f scripts/seed_langchain_workflows.sql
```

会创建或更新这些 workflow：

- `upload_file`
- `doc_extract`
- `resume_structure`
- `basic-chat`
- `common-analysis`
- `smart-format-2`

## 与原项目的关系

Go 后端仍然走原来的 `/api/workflow/v2/:name/execute`、简历上传和简历解析逻辑。区别只是 workflow 表里的 `api_url` 从远程 Dify 改成了本地 LangChain 兼容服务。

没有设置 `DEEPSEEK_API_KEY` 时，`doc_extract` 仍可做文件文本提取；聊天、分析和结构化会返回明确错误。

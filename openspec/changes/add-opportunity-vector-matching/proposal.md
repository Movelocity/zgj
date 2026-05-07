# Change: Add ChromaDB opportunity vector matching

## Why

岗位机会已经进入数据库和前端列表，但目前只能按关键词筛选，无法根据简历语义推荐匹配岗位。需要将岗位内容向量化，支持简历与岗位库的语义匹配，为后续“根据岗位优化简历”和投递推荐提供基础能力。

## What Changes

- 在本机 LangChain TS 服务中接入 ChromaDB，维护 `job_opportunities` 向量集合。
- 使用适合中文与英文混合场景的本地多语言 embedding 方法：
  - 默认模型：`multilingual-e5-small`
  - 原因：岗位信息以中文为主，简历可能是中文或英文；E5 模型使用 `query:` / `passage:` 检索前缀，更适合“简历查询匹配岗位文档”的语义检索场景，同时不需要额外 API Key。
- 新增岗位向量同步能力：
  - 单条 upsert
  - 批量重建索引
  - 下架/删除时从 ChromaDB 删除对应向量
- 新增简历匹配 API：
  - 输入简历文本或结构化简历 JSON
  - 输出 Top N 岗位、相似度分数、岗位元数据和简短匹配原因
- Go 后端在岗位创建、更新、批量上传、下架后调用 LangChain 服务同步向量。
- README 增加 ChromaDB 启动与环境变量说明。

## Impact

- Affected specs: `opportunity-vector-matching`
- Affected code:
  - `langchain-service/package.json`
  - `langchain-service/src/config.ts`
  - `langchain-service/src/opportunity-vectors.ts` (new)
  - `langchain-service/src/server.ts`
  - `server/config.yaml`, `server/config.example.yaml`
  - `server/service/opportunity/opportunity_service.go`
  - `server/api/opportunity/opportunity.go`
  - `server/router/opportunity.go`
  - `README.md`

## Notes

- ChromaDB will run as a separate local service, default URL `http://127.0.0.1:8000`.
- DeepSeek API Key remains required only when generating natural-language explanations or later resume rewrite suggestions, not for embedding.
- If local embedding model initialization is too heavy on the target machine, the design keeps the embedding provider configurable for a future remote embedding provider.

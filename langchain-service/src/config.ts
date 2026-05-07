import "dotenv/config";
import path from "node:path";

const rootDir = process.cwd();

export const config = {
  port: Number(process.env.PORT || 8890),
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  deepseekModel: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  serviceToken: process.env.LANGCHAIN_SERVICE_TOKEN || "",
  uploadDir: path.resolve(rootDir, process.env.UPLOAD_DIR || "./data/uploads"),
  chromaUrl: process.env.CHROMA_URL || "http://127.0.0.1:8000",
  chromaCollection: process.env.CHROMA_COLLECTION || "job_opportunities",
  embeddingModel: process.env.EMBEDDING_MODEL || "Xenova/multilingual-e5-small",
};

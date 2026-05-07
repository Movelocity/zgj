import "dotenv/config";
import path from "node:path";

const rootDir = process.cwd();

export const config = {
  port: Number(process.env.PORT || 8890),
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  deepseekModel: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  serviceToken: process.env.LANGCHAIN_SERVICE_TOKEN || "",
  uploadDir: path.resolve(rootDir, process.env.UPLOAD_DIR || "./data/uploads"),
};

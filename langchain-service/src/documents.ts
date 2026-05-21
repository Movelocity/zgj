import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import pdf from "pdf-parse";
import { config } from "./config.js";

type UploadedFile = Express.Multer.File;

type StoredFileMeta = {
  id: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: number;
};

export async function ensureUploadDir() {
  await fs.mkdir(config.uploadDir, { recursive: true });
}

export async function saveUploadedFile(file: UploadedFile): Promise<StoredFileMeta> {
  await ensureUploadDir();

  const meta = {
    id: file.filename,
    originalName: file.originalname,
    path: file.path,
    mimeType: file.mimetype,
    size: file.size,
    createdAt: Date.now(),
  };

  await fs.writeFile(
    path.join(config.uploadDir, `${file.filename}.json`),
    JSON.stringify(meta, null, 2),
  );

  return meta;
}

async function findUploadedFile(uploadFileId: string): Promise<StoredFileMeta> {
  const metaPath = path.join(config.uploadDir, `${uploadFileId}.json`);
  const raw = await fs.readFile(metaPath, "utf8");
  return JSON.parse(raw);
}

export async function extractUploadedText(uploadFileId: string): Promise<string> {
  const file = await findUploadedFile(uploadFileId);
  const buffer = await fs.readFile(file.path);
  const extension = path.extname(file.originalName || "").toLowerCase();
  const mimeType = file.mimeType || "";

  if (mimeType === "application/pdf" || extension === ".pdf") {
    const parsed = await pdf(buffer);
    return (parsed.text || "").trim();
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    return (parsed.value || "").trim();
  }

  if (mimeType.startsWith("text/") || extension === ".txt") {
    return buffer.toString("utf8").trim();
  }

  throw new Error(`暂不支持解析该文件类型: ${mimeType || extension || "unknown"}`);
}

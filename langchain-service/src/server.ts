import express from "express";
import type { Request, Response } from "express";
import multer from "multer";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { config } from "./config.js";
import { saveUploadedFile, ensureUploadDir } from "./documents.js";
import {
  streamError,
  streamFinished,
  streamStarted,
  streamEvent,
  workflowResponse,
} from "./dify.js";
import { inferWorkflowName, runWorkflow } from "./workflows.js";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "unknown error");
}

await ensureUploadDir();

const app = express();
app.use(express.json({ limit: "20mb" }));

app.use((req, res, next) => {
  if (!config.serviceToken) {
    next();
    return;
  }

  const expected = `Bearer ${config.serviceToken}`;
  if (req.headers.authorization !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    cb(null, uuidv4());
  },
});
const upload = multer({ storage });

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "zgj-langchain-service",
    model: config.deepseekModel,
    hasDeepSeekApiKey: Boolean(config.deepseekApiKey),
  });
});

app.post("/v1/files/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "file is required" });
      return;
    }

    const meta = await saveUploadedFile(req.file);
    res.json({
      id: meta.id,
      name: meta.originalName,
      size: meta.size,
      extension: path.extname(meta.originalName || "").replace(/^\./, ""),
      mime_type: meta.mimeType,
      created_by: req.body?.user || "local-user",
      created_at: Math.floor(meta.createdAt / 1000),
    });
  } catch (error) {
    res.status(500).json({ error: errorMessage(error) || "upload failed" });
  }
});

app.post("/v1/workflows/run", async (req: Request, res: Response) => {
  const workflowName = inferWorkflowName(req);
  const responseMode = req.body?.response_mode || "blocking";
  const inputs = req.body?.inputs || {};
  const query = req.body?.query || inputs.__query || "";

  if (responseMode === "streaming") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    try {
      streamStarted(res, workflowName);
      streamEvent(res, "node_started", {
        node_id: "langchain-deepseek",
        node_name: "LangChain DeepSeek",
      });
      const outputs = await runWorkflow(workflowName, inputs, query);
      const text = String(outputs.reply || outputs.answer || outputs.output || "");
      if (text) {
        streamEvent(res, "text_chunk", {
          text,
          from_variable_selector: [workflowName, outputs.reply ? "reply" : "output"],
        });
      }
      streamEvent(res, "node_finished", {
        node_id: "langchain-deepseek",
        node_name: "LangChain DeepSeek",
        status: "succeeded",
      });
      streamFinished(res, workflowName, outputs);
    } catch (error) {
      streamError(res, errorMessage(error) || "workflow failed");
    } finally {
      res.end();
    }
    return;
  }

  try {
    const outputs = await runWorkflow(workflowName, inputs, query);
    res.json(workflowResponse(workflowName, outputs));
  } catch (error) {
    res.status(500).json({
      error: errorMessage(error) || "workflow failed",
    });
  }
});

app.listen(config.port, "127.0.0.1", () => {
  console.log(`zgj-langchain-service listening on http://127.0.0.1:${config.port}`);
});

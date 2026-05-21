import express from "express";
import type { Request, Response } from "express";
import multer from "multer";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { config } from "./config.js";
import { saveUploadedFile, ensureUploadDir, extractUploadedText } from "./documents.js";
import {
  streamError,
  streamFinished,
  streamStarted,
  streamEvent,
  workflowResponse,
} from "./dify.js";
import { inferWorkflowName, runWorkflow } from "./workflows.js";
import {
  deleteOpportunityVectors,
  matchResumeToOpportunities,
  opportunityVectorHealth,
  upsertOpportunityVectors,
  type OpportunityVectorInput,
} from "./opportunity-vectors.js";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "unknown error");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitTextChunks(text: string, maxLength = 220): string[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const pieces = normalized
    .split(/(?<=。|！|？|\.|\!|\?)\s+|\n{2,}/)
    .map((piece) => piece.trim())
    .filter(Boolean);
  const chunks: string[] = [];

  for (const piece of pieces.length ? pieces : [normalized]) {
    if (piece.length <= maxLength) {
      chunks.push(piece);
      continue;
    }

    for (let index = 0; index < piece.length; index += maxLength) {
      chunks.push(piece.slice(index, index + maxLength));
    }
  }

  return chunks;
}

async function streamTextChunks(
  res: Response,
  workflowName: string,
  outputs: Record<string, unknown>,
) {
  const outputKey = outputs.reply ? "reply" : outputs.answer ? "answer" : "output";
  const text = String(outputs[outputKey] || "");

  if (!text) return;

  for (const chunk of splitTextChunks(text)) {
    streamEvent(res, "text_chunk", {
      text: `${chunk}\n\n`,
      from_variable_selector: [workflowName, outputKey],
    });
    await sleep(30);
  }
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
    vector: {
      chromaUrl: config.chromaUrl,
      collection: config.chromaCollection,
      embeddingModel: config.embeddingModel,
    },
  });
});

app.get("/health/vector", async (_req, res) => {
  try {
    res.json({
      ok: true,
      service: "zgj-langchain-service",
      vector: await opportunityVectorHealth(),
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: errorMessage(error) || "vector health check failed",
    });
  }
});

app.post("/v1/opportunities/vector/upsert", async (req: Request, res: Response) => {
  try {
    const body = req.body as OpportunityVectorInput | OpportunityVectorInput[] | { items?: OpportunityVectorInput[] };
    const items = Array.isArray(body)
      ? body
      : "items" in body && Array.isArray(body.items)
        ? body.items
        : body;
    const result = await upsertOpportunityVectors(items as OpportunityVectorInput | OpportunityVectorInput[]);
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({ error: errorMessage(error) || "opportunity vector upsert failed" });
  }
});

app.post("/v1/opportunities/vector/delete", async (req: Request, res: Response) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const result = await deleteOpportunityVectors(ids);
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({ error: errorMessage(error) || "opportunity vector delete failed" });
  }
});

app.post("/v1/opportunities/vector/match", async (req: Request, res: Response) => {
  try {
    const result = await matchResumeToOpportunities({
      resume: req.body?.resume,
      top_k: req.body?.top_k,
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ error: errorMessage(error) || "opportunity vector match failed" });
  }
});

app.post("/v1/opportunities/vector/match-file", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "file is required" });
      return;
    }

    const meta = await saveUploadedFile(req.file);
    const resumeText = await extractUploadedText(meta.id);
    const result = await matchResumeToOpportunities({
      resume: resumeText,
      top_k: req.body?.top_k ? Number(req.body.top_k) : undefined,
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ error: errorMessage(error) || "opportunity vector file match failed" });
  }
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
      await streamTextChunks(res, workflowName, outputs);
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

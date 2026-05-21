import http from "node:http";
import { spawn } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PDF_EXPORT_PORT || 8889);
const PLAYWRIGHT_BIN = process.env.PLAYWRIGHT_BIN || "playwright";
const TIMEOUT_MS = Number(process.env.PDF_EXPORT_TIMEOUT_MS || 120000);

function sendJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
  });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function runPlaywrightPdf(renderUrl, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      "pdf",
      "--paper-format",
      "A4",
      "--wait-for-selector",
      "body[data-pdf-ready=\"true\"]",
      "--wait-for-timeout",
      "1000",
      "--timeout",
      String(TIMEOUT_MS),
      renderUrl,
      outputPath,
    ];

    const child = spawn(PLAYWRIGHT_BIN, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NO_COLOR: "1",
      },
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`playwright pdf timed out after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS + 5000);

    child.stdout.on("data", chunk => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", chunk => {
      stderr += chunk.toString();
    });
    child.on("error", error => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", code => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`playwright pdf failed with code ${code}: ${stderr || stdout}`));
    });
  });
}

async function handleGenerate(req, res) {
  const rawBody = await readRequestBody(req);
  const payload = rawBody ? JSON.parse(rawBody) : {};
  const renderUrl = payload.render_url;

  if (!renderUrl || typeof renderUrl !== "string") {
    sendJson(res, 400, { error: "render_url is required" });
    return;
  }

  const tmpDir = path.join(os.tmpdir(), `zgj-pdf-${randomUUID()}`);
  const outputPath = path.join(tmpDir, "resume.pdf");

  try {
    await mkdir(tmpDir, { recursive: true });
    await runPlaywrightPdf(renderUrl, outputPath);
    const pdf = await readFile(outputPath);

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": pdf.length,
      "Cache-Control": "no-store",
    });
    res.end(pdf);
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { ok: true, service: "zgj-pdfexport-service" });
      return;
    }

    if (req.method === "POST" && req.url === "/generate") {
      await handleGenerate(req, res);
      return;
    }

    sendJson(res, 404, { error: "not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "unknown error");
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`zgj-pdfexport-service listening on http://127.0.0.1:${PORT}`);
});

import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.LANGCHAIN_SERVICE_URL || "http://127.0.0.1:8890";
const pdfPath = process.argv[2] || path.resolve("..", "test-assets", "resume_recognition_sample.pdf");

async function main() {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`missing test file: ${pdfPath}`);
  }

  const form = new FormData();
  const bytes = fs.readFileSync(pdfPath);
  form.append("file", new Blob([bytes], { type: "application/pdf" }), path.basename(pdfPath));
  form.append("type", "application/pdf");
  form.append("user", "smoke");

  const upload = await fetch(`${baseUrl}/v1/files/upload`, {
    method: "POST",
    body: form,
  });
  if (!upload.ok) {
    throw new Error(`upload failed: HTTP ${upload.status} ${await upload.text()}`);
  }
  const uploaded = await upload.json();

  const extract = await fetch(`${baseUrl}/v1/workflows/run?workflow=doc_extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inputs: {
        doc_file: {
          transfer_method: "local_file",
          upload_file_id: uploaded.id,
          type: "document",
        },
      },
      response_mode: "blocking",
      user: "smoke",
    }),
  });
  if (!extract.ok) {
    throw new Error(`extract failed: HTTP ${extract.status} ${await extract.text()}`);
  }
  const extracted = await extract.json();
  const text = extracted?.data?.outputs?.output || "";
  if (!text || text.length < 20) {
    throw new Error("extracted text is unexpectedly short");
  }

  console.log(JSON.stringify({
    ok: true,
    uploadedId: uploaded.id,
    extractedChars: text.length,
    preview: text.slice(0, 120),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

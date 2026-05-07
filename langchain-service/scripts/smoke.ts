const baseUrl = process.env.LANGCHAIN_SERVICE_URL || "http://127.0.0.1:8890";

async function main() {
  const health = await fetch(`${baseUrl}/health`);
  if (!health.ok) {
    throw new Error(`health failed: HTTP ${health.status}`);
  }
  const healthJson = await health.json();

  const response = await fetch(`${baseUrl}/v1/workflows/run?workflow=doc_extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inputs: {
        doc_file: {
          upload_file_id: "missing",
        },
      },
      response_mode: "blocking",
      user: "smoke",
    }),
  });

  if (response.status !== 500) {
    throw new Error(`expected missing file to produce HTTP 500, got ${response.status}`);
  }

  console.log(JSON.stringify({ ok: true, health: healthJson }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

const baseUrl = process.env.LANGCHAIN_SERVICE_URL || "http://127.0.0.1:8890";

async function post(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${path} failed: HTTP ${response.status} ${text}`);
  }
  return JSON.parse(text);
}

async function main() {
  const sampleOpportunity = {
    id: 900001,
    company: "爱奇艺",
    title: "内容创作产品 / AI 产品产运实习生",
    category: "AI 产品 / 内容生产 / 工作流 Agent",
    location: "北京",
    cadence: "每周 5 天，实习 3 个月以上",
    summary: "探索影视综、短剧和二创内容的视频或文案 AI 自动化生产。",
    responsibilities: ["撰写 PRD", "搭建 Coze 或 Dify 工作流", "测试和优化 prompt", "评估成片效果"],
    requirements: ["熟练使用 ChatGPT、DeepSeek、Gemini", "对影视短剧二创感兴趣", "具备文案能力和内容审美"],
    contact_email: "popkid616@163.com",
    note: "测试数据",
    status: "published",
  };

  const upsert = await post("/v1/opportunities/vector/upsert", { items: [sampleOpportunity] });
  const match = await post("/v1/opportunities/vector/match", {
    top_k: 1,
    resume: "我熟悉 AI 产品、PRD 写作、Dify 工作流搭建、prompt 优化，也做过短视频内容策划。",
  });

  if (!Array.isArray(match.matches) || match.matches.length === 0) {
    throw new Error("expected at least one vector match");
  }

  await post("/v1/opportunities/vector/delete", { ids: [sampleOpportunity.id] });

  console.log(JSON.stringify({
    ok: true,
    upsert,
    bestMatch: match.matches[0],
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

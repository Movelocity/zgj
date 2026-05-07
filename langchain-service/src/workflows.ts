import { ChatDeepSeek } from "@langchain/deepseek";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Request } from "express";
import { config } from "./config.js";
import { extractUploadedText } from "./documents.js";
import { fallbackResume, parseJsonObject, resumeJsonInstruction } from "./resume-schema.js";
import type { WorkflowOutputs } from "./dify.js";

type ModelOptions = {
  temperature?: number;
  maxTokens?: number;
};

type WorkflowInputs = Record<string, unknown>;

type WorkflowRequestBody = {
  inputs?: WorkflowInputs;
};

type WorkflowRequest = Request<unknown, unknown, WorkflowRequestBody>;

function requireDeepSeekKey() {
  if (!config.deepseekApiKey) {
    throw new Error("未设置 DEEPSEEK_API_KEY，无法调用 DeepSeek。");
  }
}

function createModel(options: ModelOptions = {}) {
  requireDeepSeekKey();
  return new ChatDeepSeek({
    model: config.deepseekModel,
    temperature: options.temperature ?? 0.2,
    maxTokens: options.maxTokens ?? 4096,
    apiKey: config.deepseekApiKey,
  });
}

function messageText(message: BaseMessage): string {
  if (typeof message.content === "string") {
    return message.content;
  }
  return JSON.stringify(message.content);
}

async function invokeModel(model: ChatDeepSeek, messages: BaseMessage[], workflowName = "workflow"): Promise<BaseMessage> {
  const timeoutMs = Number(process.env.LLM_TIMEOUT_MS || 180000);
  let timeout: NodeJS.Timeout | undefined;
  const startedAt = Date.now();
  console.log(`[langchain] ${workflowName} start; timeout=${timeoutMs}ms`);

  try {
    const response = await Promise.race<BaseMessage>([
      model.invoke(messages),
      new Promise<BaseMessage>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`DeepSeek 调用超时（${timeoutMs}ms）`));
        }, timeoutMs);
      }),
    ]);
    console.log(`[langchain] ${workflowName} done; elapsed=${Date.now() - startedAt}ms`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function inferWorkflowName(req: WorkflowRequest): string {
  const queryWorkflow = req.query.workflow || req.query.name;
  if (queryWorkflow) {
    return String(queryWorkflow);
  }

  const inputs = req.body?.inputs || {};
  const docFile = inputs.doc_file as { upload_file_id?: string } | undefined;
  if (docFile?.upload_file_id) {
    return "doc_extract";
  }
  if (inputs.resume_edit || inputs.current_resume || inputs.text_content) {
    return "smart-format-2";
  }
  if (inputs.origin_resume) {
    return "common-analysis";
  }
  return "basic-chat";
}

function safeJson(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value ?? {}, null, 2);
}

function isResumeUpdateIntent(query: unknown): boolean {
  return /优化|润色|修改|改写|更新|调整|完善|增强|重写|精简|扩写|补充|替换|应用|改成|改为|英文简历|英文版|英语简历|English resume|English CV|foreign resume/i.test(String(query || ""));
}

export async function runWorkflow(workflowName: string, inputs: WorkflowInputs = {}, query = ""): Promise<WorkflowOutputs> {
  switch (workflowName) {
    case "doc_extract":
      return runDocExtract(inputs);
    case "resume_structure":
    case "smart-format-2":
      return runSmartFormat(inputs);
    case "common-analysis":
      return runCommonAnalysis(inputs);
    case "basic-chat":
      return runBasicChat(inputs, query);
    default:
      return runBasicChat(inputs, query || `请处理工作流 ${workflowName}`);
  }
}

async function runDocExtract(inputs: WorkflowInputs): Promise<WorkflowOutputs> {
  const docFile = inputs.doc_file as { upload_file_id?: string } | undefined;
  const uploadFileId = docFile?.upload_file_id || inputs.upload_file_id;
  if (!uploadFileId) {
    throw new Error("doc_extract 缺少 upload_file_id。");
  }
  const text = await extractUploadedText(String(uploadFileId));
  return {
    output: text,
  };
}

async function runSmartFormat(inputs: WorkflowInputs): Promise<WorkflowOutputs> {
  const currentResume = inputs.current_resume || inputs.text_content || "";
  const resumeEdit = inputs.resume_edit || "请结构化这份简历。";
  const rawContent = `${safeJson(currentResume)}\n\n${safeJson(resumeEdit)}`.trim();

  const model = createModel({ temperature: 0, maxTokens: 8192 });
  let parsed;
  try {
    const response = await invokeModel(model, [
      new SystemMessage(`你是中文简历结构化与改写专家。${resumeJsonInstruction}`),
      new HumanMessage(`原始简历或当前结构：\n${safeJson(currentResume)}\n\n改写/结构化要求：\n${safeJson(resumeEdit)}`),
    ], "smart-format-2");
    parsed = parseJsonObject(messageText(response), rawContent);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "");
    if (!message.includes("调用超时")) {
      throw error;
    }
    console.warn(`[langchain] smart-format-2 timed out; using fallback resume parser`);
    parsed = fallbackResume(rawContent);
  }
  return {
    output: JSON.stringify(parsed, null, 2),
  };
}

async function runCommonAnalysis(inputs: WorkflowInputs): Promise<WorkflowOutputs> {
  const originResume = inputs.origin_resume || inputs.resume || inputs.current_resume || "";
  const jobDescription = inputs.job_description || inputs.job_detail || "";
  const scene = inputs.scene || "normal";

  const model = createModel({ temperature: 0.35 });
  const response = await invokeModel(model, [
    new SystemMessage(
      "你是资深中文简历优化顾问。输出要直接给候选人可执行的简历修改建议，优先包含可以更新到简历的内容；不要闲聊。",
    ),
    new HumanMessage(
      `当前场景：${scene}\n\n岗位 JD：\n${safeJson(jobDescription)}\n\n简历 JSON：\n${safeJson(originResume)}\n\n请整体分析并优化简历，给出具体可替换的表达、缺口和优先级。`,
    ),
  ], "common-analysis");

  return {
    reply: messageText(response),
  };
}

async function runBasicChat(inputs: WorkflowInputs, query: string): Promise<WorkflowOutputs> {
  const resume = inputs.resume || inputs.origin_resume || inputs.current_resume || "";
  const scene = inputs.scene || "normal";
  const jobDetail = inputs.job_detail || "";
  const userQuery = query || inputs.__query || inputs.query || "请优化这份简历。";
  const shouldUpdateResume = isResumeUpdateIntent(userQuery) || scene === "foreign";

  if (shouldUpdateResume) {
    const model = createModel({ temperature: 0, maxTokens: 8192 });
    const rawContent = `${safeJson(resume)}\n\n${safeJson(userQuery)}`.trim();
    const foreignInstruction = scene === "foreign"
      ? "当前是英文简历场景：必须把简历主体内容转换为专业英文简历表达，保留事实、时间、公司、项目与量化成果；姓名用英文名顺序，电话保留中国区号；板块标题使用英文。"
      : "";
    const response = await invokeModel(model, [
      new SystemMessage(`你是中文简历编辑器里的自动改写引擎。用户要求修改简历时，你必须返回修改后的完整简历 JSON。${resumeJsonInstruction}`),
      new HumanMessage(
        `用户修改要求：\n${safeJson(userQuery)}\n\n当前场景：${scene}\n${foreignInstruction}\n\n岗位 JD：\n${safeJson(jobDetail)}\n\n当前简历 JSON：\n${safeJson(resume)}\n\n请直接产出应用修改后的完整简历 JSON。不要输出建议清单，不要解释原因。`,
      ),
    ], "basic-chat-resume-update");
    const parsed = parseJsonObject(messageText(response), rawContent);
    const updateBlock = JSON.stringify(parsed, null, 2);
    const reply = `已根据你的要求生成修改稿，正在更新到简历。\n\n\`\`\`resume-update\n${updateBlock}\n\`\`\``;

    return {
      reply,
      answer: reply,
    };
  }

  const model = createModel({ temperature: 0.3 });
  const response = await invokeModel(model, [
    new SystemMessage(
      "你是嵌入简历编辑器的中文简历助手。回答要围绕当前简历，给出可直接采用的修改建议；当用户要求改写时，提供清晰的新表述。",
    ),
    new HumanMessage(
      `用户问题：${safeJson(userQuery)}\n\n当前场景：${scene}\n\n岗位 JD：\n${safeJson(jobDetail)}\n\n当前简历：\n${safeJson(resume)}`,
    ),
  ], "basic-chat");

  return {
    reply: messageText(response),
    answer: messageText(response),
  };
}

export { fallbackResume, inferWorkflowName };

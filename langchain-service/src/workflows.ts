import { ChatDeepSeek } from "@langchain/deepseek";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Request } from "express";
import { config } from "./config.js";
import { extractUploadedText } from "./documents.js";
import { fallbackResume, parseJsonObject, resumeJsonInstruction, resumeJsonInstructionEn } from "./resume-schema.js";
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

function getScene(inputs: WorkflowInputs): string {
  return String(inputs.scene || inputs.current_target || inputs.target || "normal");
}

function isForeignScene(inputs: WorkflowInputs): boolean {
  const scene = getScene(inputs);
  return scene === "foreign";
}

function isResumeUpdateIntent(query: unknown): boolean {
  return /优化|润色|修改|改写|更新|调整|完善|增强|重写|精简|扩写|补充|替换|应用|改成|改为|英文简历|英文版|英语简历|English resume|English CV|foreign resume/i.test(String(query || ""));
}

const englishResumeTranslationPrompt = `
角色与使命
你是一位专业的英文简历撰写专家，专注于帮助中国学生将中文简历转换为专业、地道的英文简历，符合国际招聘标准和西方阅读习惯。你精通中美职场文化差异，擅长将中文表达转化为英语国家HR期望的简历格式和语言风格。

核心转换原则
1. 格式与结构转换
使用标准英文简历格式：姓名 + 联系方式 → 职业概要 → 教育背景 → 经历（实习/项目/工作）→ 技能 → 证书/活动（可选）
移除照片、性别、出生日期、婚姻状况等个人信息（除非特定国家要求）
采用逆时序排列（最近经历在前）
使用简洁、专业的布局，避免表格和复杂格式
2. 语言风格转换
动词优先：每个要点以强动作动词开头（Developed, Implemented, Analyzed, Led等）
量化成果：将中文的定性描述转化为定量成果（使用数字、百分比、具体指标）
去除非必要修饰词：移除"认真负责"、"努力学习"等主观描述，用事实和成果替代
时态统一：过去经历用过去时，当前职责用现在时
3. 文化适配
将中国特有的奖项、证书、活动转化为国际HR能理解的形式
解释中国特有的教育体系（如GPA换算、专业排名）
调整沟通风格：更直接、结果导向，减少含蓄表达

工作流程
第一步：内容提取与分类
提取中文简历中的所有信息
按标准英文简历结构分类：
联系信息
职业概要/目标
教育背景
专业经历（实习/工作）
项目经历
技能（技术/语言/软件）
证书与奖项
其他活动
第二步：逐项转化与优化
对每一部分进行以下处理：
标准化格式：转换为英文标准格式
语言转化：翻译+本地化优化
成果量化：识别并量化成就
关键词优化：加入行业相关关键词
第三步：整体润色与格式检查
确保语言自然、专业
检查动词多样性
优化篇幅（学生简历通常1页）
确保格式整洁、易读

输出格式与内容
第一部分：英文简历全文
以清晰、专业的格式直接输出完整的英文简历：
[Your Name]
[Phone Number] | [Email] | [LinkedIn/GitHub URL if provided] | [City, Country]

PROFESSIONAL SUMMARY / OBJECTIVE
• Concise 2-3 lines highlighting key qualifications and career goals

EDUCATION
[University Name], [City, Country]
[Degree Name], [Major]
Month Year - Month Year | GPA: [X.X/4.0] | Relevant Coursework: [Course1, Course2, ...]

WORK EXPERIENCE / INTERNSHIPS
[Company Name], [City, Country]
[Position Title]
Month Year - Month Year
• Action verb + what you did + quantifiable result
• Action verb + what you did + quantifiable result

PROJECT EXPERIENCE
[Project Name]
Month Year - Month Year
• Action verb + project scope + your contribution + outcome
• Technologies used: [Tech1, Tech2, ...]

SKILLS
Technical: [Skill1, Skill2, Skill3, ...]
Languages: [Language1 (Proficiency), Language2 (Proficiency), ...]
Software/Tools: [Tool1, Tool2, ...]

CERTIFICATIONS & AWARDS
• [Certification Name], [Issuing Organization], Year
• [Award Name], [Organization], Year

第二部分：关键转化说明
简要说明最重要的3处转化优化及其原因：
1. [原中文内容] → [英文优化版本]
   Reason: [解释为什么这样转化，如文化适配、量化成果等]
2. ...

第三部分：使用建议
提供2-3条针对投递外企的建议：
1. [建议1：如如何根据职位调整简历]
2. [建议2：如准备英文面试的要点]

特殊处理指南
教育背景转换
中国大学名称使用标准英文译名
学分绩点注明换算标准（如：3.7/4.0）
如无正式GPA，可使用"Major GPA"或排名（如：Top 10%）
核心课程选择与目标职位相关的列出

经历描述优化模板
中文常见表达 → 英文优化版本：
"负责..." → "Managed/Coordinated/Oversaw..."
"参与..." → "Contributed to/Collaborated on..."
"学习了..." → "Acquired expertise in/Mastered..."
"协助..." → "Supported/Assisted in..."

技能分类与表述
技术技能：按熟练程度分组（Proficient, Familiar, Beginner）
语言能力：使用标准等级（Native, Fluent, Professional, Limited）
避免主观评级（如"精通"直接列出技能，让经历证明能力）

质量检查清单
输出前确保：
无语法和拼写错误
动词不重复使用
所有日期格式统一（Month Year）
联系信息完整且专业
长度控制在1页内（学生简历）
无个人信息歧视风险内容
`.trim();

const resumeOptimizationReportPrompt = `
【角色与任务设定】
你是一名拥有15年经验的资深HR专家，具备顶尖的人才评估和职业竞争力分析能力。你的任务不再是简单润色简历，而是扮演一位职业导师，深度挖掘用户原始简历中潜藏的核心优势、可迁移技能和独特价值，并通过专业润色，将其转化为一份强劲有力、重点突出、能吸引多个潜在雇主的优化简历。你必须严格遵守“真实性”第一的原则。

【核心工作原则】
1、真实性原则（绝对核心）：严格基于用户提供的信息进行优化。严禁编造用户未提及的工作经历、项目、技能或具体数据。如果逻辑上需要新增一个量化成果但用户未提供具体数字，必须使用“XX”代替（例如：“提升效率约XX%”或“管理约XX人团队”），并建议用户自行补充真实数据。
2、优势导向：坚信每一段经历都有其价值。你的工作是发现并放大它，而不是简单地挑错。
3、成果量化：全力以赴地将用户已提供的经历和成果转化为可量化的、体现商业价值的成就。如果用户未提供数据，则通过优化语言来突出其影响和价值。
4、专业性：使用行业认可的专业术语。

【工作流程】
1、深度挖掘与优势识别（在真实信息范围内）：
1.1扫描全局：快速理解用户的职业生涯轨迹、行业和职能。
1.2提取核心优势（Core Strengths）：从工作经历、项目经历中提炼出用户最突出的3-5个核心能力（如：战略规划、数据分析、团队领导、客户关系管理、复杂问题解决等）。
1.3识别可迁移技能（Transferable Skills）：找出那些不受行业限制的通用高阶能力（如：项目管理、沟通协调、数据分析、逻辑思维、创新能力等）。
1.4挖掘量化成就：寻找所有用户已提供的、可以被数字化的信息（管理规模、提升比例、节省成本、增加收入、处理量、效率提升等）。
2、结构化重构与润色（严禁虚构）：
a. STAR法则解构与重生：对用户的每一段主要职责描述，严格运用STAR法则（情境-任务-行动-结果）进行解构，并重新生成一条成果导向的描述。重点突出行动（A）和可量化的结果（R）。
b. 添加职责标题：在STAR法则重构后的每一条描述之前，添加一个五个字以内（如四字短语）的简短标题，并用“|”或其他符号与后续描述隔开。该标题用于提炼核心能力或主要工作职责，要求精准、亮眼。
c. 专业润色：使用更专业、更积极、更具影响力的动词（如：主导、重构、优化、推动、实现、降低、提升）替换平淡的词汇。
d. 格式与布局：建议或提供一个清晰、专业、易于ATS（招聘追踪系统）解析的简历格式。
e. 精炼其他模块：确保“专业技能”、“项目经历”等模块的内容均来自用户输入，与提炼出的核心优势相呼应，突出重点。

【输出格式要求】
你的输出必须严格遵循以下结构：
第一部分：核心优势提炼报告
核心能力标签：用3-5个关键词概括用户的核心优势（如：数字化营销|数据驱动决策|跨部门项目领导）。
顶级成就一览：列出从简历中挖掘出的最令人印象深刻的2-3个量化成就。
可迁移技能：列出2-3项适用于广泛岗位的高阶技能。
⚠️需补充数据点（建议）：指出哪些成就如果能有具体数据支撑会更具说服力，并建议用户回忆补充（例如：“‘提升了工作效率’如能补充具体比例或节省的时间，效果会更佳”）。

第二部分：优化后的简历全文
直接给出完整润色后的简历文本。
对所有重大修改和新增的量化成果使用<mark>或粗体进行高亮，并在旁边用括号（ ）简要说明修改理由。
绝对禁止新增未提及的经历。对于因优化逻辑而新增的、但用户未提供关键数据的成果描述，必须使用“XX”占位符，例如：
<mark>**成功领导一个项目，使部门运营成本降低了约XX%**</mark>（修改说明：根据您“降低成本”的表述强化了成果，请补充具体数据以增强说服力）

第三部分：修改亮点解析
选择1-2处最具代表性的修改，对比展示“修改前”和“修改后”的表述，并详细解释：
为什么这样修改？（例如：为了将职责变为成就、为了植入影响力动词、为了量化结果）
修改后带来了什么提升？（例如：更显专业性、更具冲击力、更清晰地展示了个人价值）
`.trim();

const targetedResumeOptimizationPrompt = `
【角色与任务设定】
你是一名拥有15年经验的资深HR专家，尤其擅长人才甄别、竞争力分析和职业规划。你的核心任务是扮演一位严格且友善的职业顾问，针对用户提供的目标职位描述（JD）和自身原始简历，进行深度分析、精准修改和专业润色，输出一份极具竞争力、与目标岗位高度匹配的优化后简历。

【核心工作流程】
深度解析JD（Job Description）：
提取关键词：识别并列出JD中的硬技能（如Python, CFA III, SAP）、软技能（如跨部门沟通、项目管理）、核心职责和任职资格关键词。
理解公司文化：从JD字里行间分析公司文化和团队风格（是激进创新还是稳健保守？），以便调整简历的措辞和调性。
明确核心需求：总结该岗位最看重的3-5个核心能力。

诊断原始简历：
匹配度分析：将原始简历与JD关键词进行对比，找出匹配点、缺失点和可优化点。
亮点挖掘：识别用户经历中未被充分展示但可能与JD相关的潜在亮点和可迁移技能。
问题识别：指出简历中存在的普遍问题，如：表述空洞、未量化成果、重点不突出、格式不专业等。

执行优化与润色：
关键词植入：将JD中的关键词自然、准确地融入简历的【工作经历】、【项目经历】和【专业技能】部分。
成就量化（STAR原则）：将职责性描述重构为成果导向的表述；使用数据量化（提升X%、节省Y成本、完成Z数额）来展示 impact；遵循STAR（情境-任务-行动-结果）模型来结构化经历描述。
内容优先级排序：根据与JD的相关性，重新调整工作/项目经历的描述顺序，将最相关、最突出的成就放在最前面。
专业润色：使用更专业、更积极、更具影响力的动词（如：主导、重构、优化、推动、实现、降低、提升）替换平淡的词汇。
格式与布局：建议或提供一个清晰、专业、易于ATS（招聘追踪系统）解析的简历格式。

【真实性约束】
严格基于用户提供的JD和简历信息优化。严禁编造未提及的经历、项目、技能、证书或具体数据。如果需要量化但用户未提供数字，必须使用“XX”占位，并提示用户补充真实数据。

【输出格式要求】
你的输出必须严格遵循以下结构：
第一部分：匹配度分析报告
✅ 高匹配点：列出简历中已经与JD高度契合的内容。
⚠️ 潜在优化点：列出简历中具备相关潜力但未充分展示的内容。
❌ 关键缺失点：指出简历中完全缺失的JD关键要求，并提出补充建议（如通过课程、项目或个人学习来弥补）。

第二部分：优化后的简历全文
直接给出修改后的完整简历文本。
所有修改处最好使用<mark>或粗体进行高亮显示，并附上简短的修改说明（以括号形式标注在旁边）。

第三部分：修改思路详解
选择2-3处最重要的修改，详细解释为什么这样修改。

第四部分：职业发展建议
基于简历与JD的对比分析，为用户提供未来6-12个月的核心提升建议，旨在从根本上增强其与目标岗位或同类岗位的匹配度。建议应具体、可执行，并分点阐述：
核心技能提升建议：针对“关键缺失点”和“潜在优化点”，建议学习的具体技能、认证或课程。
经验补充策略：建议如何通过现有工作创造相关经验、参与特定类型项目、或进行 freelance/志愿工作来弥补经验缺口。
长期职业画像构建：根据目标岗位的进阶要求，指点用户未来1-3年的职业发展路径和需要持续积累的能力与成果，帮助其规划从“胜任”到“优秀”的成长轨迹。
`.trim();

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
  const foreign = isForeignScene(inputs);
  const rawContent = `${safeJson(currentResume)}\n\n${safeJson(resumeEdit)}`.trim();

  const model = createModel({ temperature: 0, maxTokens: 8192 });
  let parsed;
  try {
    const response = await invokeModel(model, [
      new SystemMessage(foreign
        ? `${englishResumeTranslationPrompt}

You are now the structured-output engine for the resume editor. Apply every rule above when converting or rewriting English resumes, then return only the final English resume as one JSON object that matches the required schema. Do not output the conversion notes or usage suggestions in the JSON.

${resumeJsonInstructionEn}`
        : `你是中文简历结构化与改写专家。${resumeJsonInstruction}`),
      new HumanMessage(foreign
        ? `Current resume or structure:\n${safeJson(currentResume)}\n\nRewrite / structuring request:\n${safeJson(resumeEdit)}\n\nIf the rewrite request contains multiple sections from the English translation prompt, extract and apply only the English resume body from the first section before returning JSON.`
        : `原始简历或当前结构：\n${safeJson(currentResume)}\n\n改写/结构化要求：\n${safeJson(resumeEdit)}`),
    ], "smart-format-2");
    parsed = parseJsonObject(messageText(response), rawContent, { language: foreign ? 'en' : undefined });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "");
    if (!message.includes("调用超时")) {
      throw error;
    }
    console.warn(`[langchain] smart-format-2 timed out; using fallback resume parser`);
    parsed = fallbackResume(rawContent, foreign ? 'en' : 'zh');
  }
  return {
    output: JSON.stringify(parsed, null, 2),
  };
}

async function runCommonAnalysis(inputs: WorkflowInputs): Promise<WorkflowOutputs> {
  const originResume = inputs.origin_resume || inputs.resume || inputs.current_resume || "";
  const jobDescription = inputs.job_description || inputs.job_detail || "";
  const scene = getScene(inputs);
  const isTargetedOptimization = scene === "jd" || String(jobDescription || "").trim().length > 0;
  const foreign = scene === "foreign";

  const model = createModel({ temperature: 0.35 });
  const response = await invokeModel(model, [
    new SystemMessage(foreign
      ? englishResumeTranslationPrompt
      : (isTargetedOptimization ? targetedResumeOptimizationPrompt : resumeOptimizationReportPrompt)),
    new HumanMessage(
      foreign
        ? `Current scene: ${scene}\n\nCurrent resume content or JSON:\n${safeJson(originResume)}\n\nStrictly follow the system prompt and output the three required parts only. Keep the English resume body fully in English, remove Chinese fragments instead of appending them, and use XX when a metric is missing.`
      : isTargetedOptimization
        ? `当前场景：${scene}\n\n【目标JD】：\n${safeJson(jobDescription)}\n\n【自身简历】：\n${safeJson(originResume)}\n\n请严格基于以上JD和简历信息完成定向优化，并按系统提示词要求输出四部分内容。`
        : `当前场景：${scene}\n\n岗位 JD：\n${safeJson(jobDescription)}\n\n简历 JSON：\n${safeJson(originResume)}\n\n请严格基于以上简历信息完成简历优化，并按系统提示词要求输出三部分内容。若岗位 JD 为空，不要虚构目标岗位要求。`,
    ),
  ], "common-analysis");

  return {
    reply: messageText(response),
  };
}

async function runBasicChat(inputs: WorkflowInputs, query: string): Promise<WorkflowOutputs> {
  const resume = inputs.resume || inputs.origin_resume || inputs.current_resume || "";
  const scene = getScene(inputs);
  const jobDetail = inputs.job_detail || "";
  const userQuery = query || inputs.__query || inputs.query || "请优化这份简历。";
  const shouldUpdateResume = isResumeUpdateIntent(userQuery) || scene === "foreign";

  if (shouldUpdateResume) {
    const model = createModel({ temperature: 0, maxTokens: 8192 });
    const rawContent = `${safeJson(resume)}\n\n${safeJson(userQuery)}`.trim();
    const foreignInstruction = scene === "foreign"
      ? "Current scene is an English resume. You must apply the full English translation prompt, preserve facts, dates, companies, projects, and quantified results, keep the same factual content, use English section titles only, and remove Chinese fragments instead of appending them."
      : "";
    const response = await invokeModel(model, [
      new SystemMessage(scene === "foreign"
        ? `${englishResumeTranslationPrompt}

You are the automatic rewrite engine in a resume editor. Apply the system prompt above while updating the resume, but return only the modified full English resume JSON.

${resumeJsonInstructionEn}`
        : `你是中文简历编辑器里的自动改写引擎。用户要求修改简历时，你必须返回修改后的完整简历 JSON。${resumeJsonInstruction}`),
      new HumanMessage(
        scene === "foreign"
          ? `User request:\n${safeJson(userQuery)}\n\nCurrent scene: ${scene}\n${foreignInstruction}\n\nCurrent resume JSON:\n${safeJson(resume)}\n\nReturn the full updated English resume JSON only. Follow the translation prompt's formatting and wording rules, but do not output the conversion notes or usage suggestions in the JSON.`
          : `用户修改要求：\n${safeJson(userQuery)}\n\n当前场景：${scene}\n${foreignInstruction}\n\n岗位 JD：\n${safeJson(jobDetail)}\n\n当前简历 JSON：\n${safeJson(resume)}\n\n请直接产出应用修改后的完整简历 JSON。不要输出建议清单，不要解释原因。`,
      ),
    ], "basic-chat-resume-update");
    const parsed = parseJsonObject(messageText(response), rawContent, { language: scene === "foreign" ? 'en' : undefined });
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

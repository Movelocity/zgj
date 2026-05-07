export const resumeJsonInstruction = `
必须只输出一个 JSON 对象，不要 Markdown，不要解释。JSON 结构如下：
{
  "version": 2,
  "portrait_img": "",
  "blocks": [
    {
      "title": "个人信息",
      "type": "object",
      "data": {
        "name": "",
        "title": "",
        "phone": "",
        "email": "",
        "location": "",
        "photo": ""
      }
    },
    {
      "title": "个人总结",
      "type": "text",
      "data": ""
    },
    {
      "title": "工作经历",
      "type": "list",
      "data": [
        {
          "id": "work-1",
          "name": "公司或组织",
          "time": "起止时间",
          "description": "职位和职责成果，使用换行组织要点",
          "highlight": "关键词，用逗号分隔"
        }
      ]
    }
  ]
}
list 项只能包含 id、name、time、description、highlight。object 个人信息只能包含 name、title、phone、email、location、photo。保留候选人的真实经历，不要编造不存在的学校、公司、项目或时间。
`.trim();

type ResumeBlock = {
  title: string;
  type: "object" | "text" | "list";
  data: unknown;
};

export type ResumeData = {
  version: 2;
  portrait_img: string;
  blocks: ResumeBlock[];
};

export function fallbackResume(text = ""): ResumeData {
  const normalized = String(text).replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] || "";

  return {
    version: 2,
    portrait_img: "",
    blocks: [
      {
        title: "个人信息",
        type: "object",
        data: {
          name: firstLine.slice(0, 20),
          title: "",
          phone: normalized.match(/1[3-9]\d{9}/)?.[0] || "",
          email: normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "",
          location: "",
          photo: "",
        },
      },
      {
        title: "简历内容",
        type: "text",
        data: normalized,
      },
    ],
  };
}

export function parseJsonObject(text: string, originalText = ""): ResumeData {
  if (!text) {
    return fallbackResume(originalText);
  }

  const raw = String(text).trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    return fallbackResume(originalText);
  }

  try {
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
      return fallbackResume(originalText);
    }
    return {
      version: parsed.version || 2,
      portrait_img: parsed.portrait_img || "",
      blocks: parsed.blocks,
    };
  } catch {
    return fallbackResume(originalText);
  }
}

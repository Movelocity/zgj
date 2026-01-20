// 简历相关类型定义 - 与后端 ResumeRecord 结构保持一致
export interface Resume {
  id: string;
  user_id: string;
  resume_number: string;
  version: number;
  name: string;
  original_filename: string;
  file_id: string;
  file_size: number;
  file_type: string;
  text_content?: string;
  structured_data?: any;
  status: 'active' | 'deleted';
  created_at: string;
  updated_at: string;
}

// 简历基本信息 - 用于列表显示
export interface ResumeInfo {
  id: string;
  resume_number: string;
  version: number;
  name: string;
  original_filename: string;
  file_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// 简历元数据 - 存储页面状态信息
export interface ResumeMetadata {
  currentTarget?: 'jd' | 'normal' | 'foreign'; // 当前编辑目标类型
  isNewResume?: boolean; // 标记是否已完成初始分析（true=分析中，false=已完成，undefined=需要初始化）
  [key: string]: any; // 支持未来扩展的其他字段
}

// 简历详细信息 - 包含文本内容和结构化数据
export interface ResumeDetail {
  id: string;
  resume_number: string;
  version: number;
  name: string;
  original_filename: string;
  file_id: string;
  text_content: string;
  structured_data: any;
  pending_content?: any; // 待保存的AI生成内容
  metadata?: ResumeMetadata; // 元数据，存储页面状态信息
  status: string;
  created_at: string;
  updated_at: string;
}

// 简历上传请求数据
export interface ResumeUploadData {
  file: File;
  name?: string;
}

// 创建纯文本简历请求数据
export interface CreateTextResumeData {
  name: string;
  text_content: string;
  metadata?: ResumeMetadata; // 元数据，存储页面状态信息
}

// 简历上传响应
export interface ResumeUploadResponse {
  id: string;
  resume_number: string;
  url: string;
  filename: string;
  size: number;
}

// 简历列表响应
export interface ResumeListResponse {
  list: ResumeInfo[];
  total: number;
  page: number;
  page_size: number;
}

// 简历更新请求
export interface ResumeUpdateRequest {
  name?: string;
  text_content?: string;
  structured_data?: any;
  pending_content?: any; // 待保存的AI生成内容
  metadata?: ResumeMetadata; // 元数据，存储页面状态信息
  new_version?: boolean; // 是否创建新版本而不是覆盖原简历，默认true
}

// 简历更新响应（创建新版本时）
export interface ResumeUpdateResponse {
  message: string;
  new_resume_id?: string; // 创建新版本时返回的新简历ID
  is_new_version?: boolean; // 是否创建了新版本
}

export interface ResumeVersion {
  id: string;
  resume_id: string;
  version: number;
  content: string;
  changes: string;
  created_at: string;
}

export interface ResumeOptimizationRequest {
  resume_id: string;
  job_description?: string;
  optimization_type: 'simple' | 'job_targeted';
  requirements?: string;
}


/** ============= */


export interface OptimizationResult {
  totalChanges: number;
  sectionsImproved: string[];
  improvementPercentage: number;
  resumeId?: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  duration: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  duration: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  duration: string;
  description: string;
  technologies: string;
}

export type OptimizedSections = {
  personalInfo: string[];
  summary: boolean;
  workExperience: {
    [key: string]: string[];
  };
  education: {
    [key: string]: string[];
  };
  skills: boolean;
  projects: {
    [key: string]: string[];
  };
}

/**
 * Resume block item for list type
 */
export interface ResumeBlockListItem {
  id: string;
  name: string;
  description: string;
  time: string;
  highlight: string;
}

export interface ResumePersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  photo: string;
}

/**
 * Resume block - can be either list or text type
 */
export interface ResumeBlock {
  title: string;
  type: 'list' | 'text' | 'object';
  data: ResumeBlockListItem[] | string | ResumePersonalInfo;
}

/**
 * V2 Resume structured data
 */
export interface ResumeData {
  version: 2;
  portrait_img?: string; // Profile picture URL
  blocks: ResumeBlock[];
}

/**
 * Complete V2 Resume with metadata
 */
// export interface ResumeV2 {
//   id: string;
//   user_id: string;
//   resume_number: string;
//   version: number;
//   name: string;
//   original_filename: string;
//   file_id: string;
//   text_content?: string;
//   structured_data: ResumeData;
//   portrait_img?: string;
//   status: 'active' | 'deleted';
//   created_at: string;
//   updated_at: string;
// }

/**
 * Helper to check if a block is list type
 */
export function isListBlock(block: ResumeBlock): block is ResumeBlock & { data: ResumeBlockListItem[] } {
  return block.type === 'list' && Array.isArray(block.data);
}

/**
 * Helper to check if a block is text type
 */
export function isTextBlock(block: ResumeBlock): block is ResumeBlock & { data: string } {
  return block.type === 'text' && typeof block.data === 'string';
}

/**
 * Helper to check if a block is object type (personal info)
 */
export function isObjectBlock(block: ResumeBlock): block is ResumeBlock & { data: ResumePersonalInfo } {
  return block.type === 'object' && typeof block.data === 'object' && !Array.isArray(block.data);
}

/**
 * Create empty list block
 */
export function createEmptyListBlock(title: string): ResumeBlock {
  return {
    title,
    type: 'list',
    data: []
  };
}

/**
 * Create empty text block
 */
export function createEmptyTextBlock(title: string): ResumeBlock {
  return {
    title,
    type: 'text',
    data: ''
  };
}

/**
 * Create empty list item
 */
export function createEmptyListItem(): ResumeBlockListItem {
  return {
    id: Date.now().toString(),
    name: '',
    description: '',
    time: '',
    highlight: ''
  };
}

/**
 * Default V2 resume template
 */
export const defaultResumeData: ResumeData = {
  version: 2,
  blocks: [
    {
      title: '',
      type: 'text',
      data: ''
    },
    {
      title: '',
      type: 'list',
      data: []
    },
    {
      title: '',
      type: 'list',
      data: []
    }
  ]
};

export const specialData: ResumeData = {
  version: 2,
  blocks: [
    {
      title: "个人信息",
      type: "object",
      data: {
        "name": "黄怀恩",
        "title": "高级运营专家",
        "phone": "13267222565",
        "email": "huanghuaien2023@163.com",
        "location": "",
        "photo": "/api/files/20251013221370913642/preview"
      } as ResumePersonalInfo
    },
    {
      "title": "个人总结",
      "type": "text",
      "data": "国际商务专业背景，具备系统的商业分析与多模型应用能力（SWOT、PEST、波特五力）。在课程项目中主导策略分析与内容策划，展现出优秀的逻辑思维、创意输出和团队协作能力。学习能力强，能快速适应短视频内容创作与平台研究等新领域，致力于通过数据驱动优化内容策略。"
    },
    {
      "title": "教育背景",
      "type": "list",
      "data": [
        {
          "id": "#EDU001",
          "name": "中南财经政法大学",
          "time": "2021.09 - 至今",
          "description": "国际商务 全日制本科\n主修课程：国际经济学、宏观经济学、投资学、管理学\nGPA：3.7/4.0",
          "highlight": ""
        }
      ]
    },
    {
      "title": "项目经历",
      "type": "list",
      "data": [
        {
          "id": "#PROJ001",
          "name": "美的集团国际化营销案例分析",
          "time": "2023",
          "description": "主导运用SWOT与波特五力模型，分析美的集团在国际市场的竞争环境，输出数据驱动的策略建议，提升方案可行性。\n协调团队分工，推动项目进度，确保高质量交付。",
          "highlight": "SWOT分析, 波特五力模型"
        },
        {
          "id": "#PROJ002",
          "name": "万代集团在中国的国际商务策略分析",
          "time": "2022",
          "description": "担任项目组长，挖掘IP营销模式中的关键问题，提出创意改进方案，提升内容落地性与用户 engagement。\n通过团队协作与逻辑分析，优化策略输出流程。",
          "highlight": "国际商务分析, 策略分析"
        },
        {
          "id": "#PROJ003",
          "name": "瑞幸咖啡账面事件案例分析",
          "time": "2021",
          "description": "基于PEST模型与财务分析，评估事件对市场环境的影响，识别风险与机会，为内容优化提供洞察。",
          "highlight": "PEST模型, 财务分析"
        }
      ]
    },
    {
      "title": "专业技能",
      "type": "text",
      "data": "商业分析工具：SWOT分析、波特五力模型、PEST分析\n软件技能：Excel、Word、PowerPoint\n剪辑软件：正在学习AE/Pr（通过Coursera课程）\n语言能力：中文（母语）、英文（流利）\n软技能：逻辑思维、创意策划、团队协作、快速学习"
    }
  ]
}
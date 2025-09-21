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

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  projects: Project[];
}

export const ResumeExample: ResumeData = {
  personalInfo: {
    name: '姓名',
    title: '职位', // AI优化：更突出专业性
    email: 'email@email.com',
    phone: '138-0000-0000',
    location: '北京市'
  },
  summary: '个人总结', // AI优化：更具体和有吸引力
  workExperience: [
    {
      id: '1',
      company: '公司名称',
      position: '职位',
      duration: '2021.06 - 至今',
      description: '工作经历' // AI优化：更有说服力的数据和成果
    }
  ],
  education: [
    {
      id: '1',
      school: '某某大学',
      degree: '计算机科学与技术 本科',
      duration: '2017.09 - 2021.06',
      description: '竞赛经历，获奖经历，主修课程等'
    }
  ],
  skills: ['技能1', '技能2', '技能3', '技能4', '技能5'], // AI优化：重新排序，突出核心技能
  projects: [
    {
      id: '1',
      name: '项目名称',
      duration: '2023.03 - 2023.08',
      description: '项目描述', // AI优化：更详细的技术实现和业务价值
      technologies: '技能1, 技能2, 技能3, 技能4, 技能5'
    }
  ]
}

/** Prompt Example
{
  "personalInfo": {
    "name": "张三",
    "title": "资深前端开发工程师 | React/Vue 专家",
    "email": "zhangsan@email.com",
    "phone": "138-0000-0000",
    "location": "北京市"
  },
  "summary": "3年前端开...快速适应新技术并应用于实际项目中。",
  "workExperience": [ // 0到多个工作经历
    {
      "id": "1",
      "company": "科技有限公司",
      "position": "前端开发工程师",
      "duration": "2021.06 - 至今",
      "description": "• 主导开发公司核心产品前端架构，服务用..."
    }
  ],
  "education": [ // 0到多个教育经历
    {
      "id": "1",
      "school": "某某大学",
      "degree": "计算机科学与技术 本科",
      "duration": "2017.09 - 2021.06",
      "description": "主修课程：数据结构、算法、... 3.7/4.0\n获得：优秀学生奖学金、ACM程序设计竞赛二等奖"
    }
  ],
  "skills": ["React", "Vue.js", "TypeScript", "JavaScript", "Webpack", "Vite", "Node.js", "HTML5/CSS3", "Git", "Docker"],
  "projects": [  // 0到多个项目经历
    {
      "id": "1",
      "name": "企业管理系统",
      "duration": "2023.03 - 2023.08",
      "description": "基于React+TypeScript...系统，确保数据安全和用户体验的平衡",
      "technologies": "React, TypeScript, Ant Design, Echarts, Webpack, Redux"
    }
  ]
}
*/

export type OptimizedSections = {
  personalInfo: string[];
  summary: boolean;
  workExperience: {
    [key: string]: string[];
  };
  skills: boolean;
  projects: {
    [key: string]: string[];
  };
}
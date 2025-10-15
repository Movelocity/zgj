
// 处理步骤类型
export type ProcessingStage = 'parsing' | 'structuring' | 'analyzing' | 'completed';

// 步骤处理结果
export interface StepResult {
  success: boolean;
  needsReload?: boolean;
  error?: string;
}

// 定义哪些内容是AI优化过的
// const optimizedSectionsExample: OptimizedSections = {
//   personalInfo: ['title'], // 职位标题被优化：更专业的表述
//   summary: true, // 整个个人总结被优化：更具体和有吸引力
//   workExperience: {
//     '1': ['description'] // 第一个工作经历的描述被优化：添加了数据和成果
//   },
//   skills: true, // 技能部分被优化：重新排序突出核心技能
//   projects: {
//     '1': ['description'] // 第一个项目的描述被优化：更详细的技术实现和业务价值
//   }
// };

// 版本2
/**
resume block: 
{
  "title": "教育背景",
  "type": "list" | "text",
  "data": [
    {"id": "1", "name": "xx大学", "description": "主修课程xxx", "time": "2021.09 - 至今", "highlight": "熟悉xx等技术"},
    {"id": "2", "name": "xx大学", "description": "主修课程xxx", "time": "2021.09 - 至今", "highlight": "熟悉xx等技术"}
  ] | "xxx"
}
*/
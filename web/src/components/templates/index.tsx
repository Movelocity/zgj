import type { TemplateConfig } from './types';
import CalmTemplate from './Calm';
import FeriyTemplate from './Feriy';
import ModernTemplate from './Modern';
import ClassicTemplate from './Classic';
import MinimalTemplate from './Minimal';
import { type ResumeData } from '@/types/resume';

/**
 * 所有可用的简历模板配置
 * 每个模板都有唯一的ID、名称、描述和对应的渲染组件
 */
export const templates: TemplateConfig[] = [
  {
    id: 'calm',
    name: 'Calm - 简洁优雅',
    description: '左侧边栏显示个人信息，右侧主内容区，使用柔和的蓝色调，适合专业人士',
    component: CalmTemplate,
  },
  {
    id: 'feriy',
    name: 'Feriy - 现代活力',
    description: '顶部横幅式个人信息，使用紫色渐变，卡片式内容布局，适合创意行业',
    component: FeriyTemplate,
  },
  {
    id: 'modern',
    name: 'Modern - 现代简约',
    description: '左右分栏布局，使用灰色调和橙色强调，清晰的层次结构，适合技术和商务领域',
    component: ModernTemplate,
  },
  {
    id: 'classic',
    name: 'Classic - 传统经典',
    description: '单列布局，居中对齐，使用传统的黑白配色，强调专业性，适合正式场合',
    component: ClassicTemplate,
  },
  {
    id: 'minimal',
    name: 'Minimal - 极简主义',
    description: '留白充足，极简线条，使用绿色点缀，强调内容本身，适合设计师和创意人士',
    component: MinimalTemplate,
  },
];

/**
 * 根据模板ID获取模板配置
 */
export const getTemplateById = (id: string): TemplateConfig | undefined => {
  return templates.find((template) => template.id === id);
};

/**
 * 获取所有模板ID列表
 */
export const getTemplateIds = (): string[] => {
  return templates.map((template) => template.id);
};

interface ResumeWithTemplateProps {
  resumeData: ResumeData;
  templateId: string;
  className?: string;
}

/**
 * ResumeWithTemplate - 根据模板ID渲染不同样式的简历
 * 
 * @param resumeData - 简历数据
 * @param templateId - 模板ID (calm, feriy, modern, classic, minimal)
 * @param className - 额外的CSS类名
 */
export const ResumeWithTemplate: React.FC<ResumeWithTemplateProps> = ({
  resumeData,
  templateId,
  className = '',
}) => {
  const template = templates.find((t) => t.id === templateId);

  if (!template) {
    return (
      <div className={`p-8 text-center text-red-500 ${className}`}>
        <p className="text-lg font-semibold">模板未找到</p>
        <p className="text-sm mt-2">模板ID: {templateId}</p>
        <p className="text-xs mt-4 text-gray-500">
          可用模板: {templates.map((t) => t.id).join(', ')}
        </p>
      </div>
    );
  }

  const TemplateComponent = template.component;

  return (
    <div className={className}>
      <TemplateComponent resumeData={resumeData} />
    </div>
  );
};

/**
 * 导出主组件
 */
// export { ResumeWithTemplate } from './ResumeWithTemplate';
// export type { ResumeTemplateProps, TemplateConfig } from './ResumeWithTemplate';

// 导出各个模板组件（如果需要单独使用）
export { CalmTemplate } from './Calm';
export { FeriyTemplate } from './Feriy';
export { ModernTemplate } from './Modern';
export { ClassicTemplate } from './Classic';
export { MinimalTemplate } from './Minimal';

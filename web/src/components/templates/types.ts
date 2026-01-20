import { type ResumeData } from '@/types/resume';

export interface ResumeTemplateProps {
  resumeData: ResumeData;
  className?: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<ResumeTemplateProps>;
}
// Resume V2 Block-based Structure Types

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

/**
 * Resume block - can be either list or text type
 */
export interface ResumeBlock {
  title: string;
  type: 'list' | 'text';
  data: ResumeBlockListItem[] | string;
}

/**
 * V2 Resume structured data
 */
export interface ResumeV2Data {
  version: 2;
  portrait_img?: string; // Profile picture URL
  blocks: ResumeBlock[];
}

/**
 * Complete V2 Resume with metadata
 */
export interface ResumeV2 {
  id: string;
  user_id: string;
  resume_number: string;
  version: number;
  name: string;
  original_filename: string;
  file_id: string;
  text_content?: string;
  structured_data: ResumeV2Data;
  portrait_img?: string;
  status: 'active' | 'deleted';
  created_at: string;
  updated_at: string;
}

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
export const defaultResumeV2Data: ResumeV2Data = {
  version: 2,
  blocks: [
    {
      title: '个人信息',
      type: 'text',
      data: ''
    },
    {
      title: '教育背景',
      type: 'list',
      data: []
    },
    {
      title: '工作经历',
      type: 'list',
      data: []
    },
    {
      title: '项目经历',
      type: 'list',
      data: []
    },
    {
      title: '专业技能',
      type: 'text',
      data: ''
    }
  ]
};


/**
 * Resume format converter between V1 and V2
 */

import type { ResumeData, PersonalInfo, WorkExperience, Education, Project } from '@/types/resume';
import type { ResumeV2Data, ResumeBlock, ResumeBlockListItem } from '@/types/resumeV2';

/**
 * Check if data is V1 format (no version field)
 */
export function isV1Format(data: any): data is ResumeData {
  if (!data || typeof data !== 'object') return false;
  // V1 has personalInfo, summary, workExperience, education, skills, projects
  // V1 does NOT have version field
  return (
    !('version' in data) &&
    'personalInfo' in data &&
    'summary' in data &&
    'workExperience' in data &&
    'education' in data &&
    'skills' in data &&
    'projects' in data
  );
}

/**
 * Check if data is V2 format (version: 2)
 */
export function isV2Format(data: any): data is ResumeV2Data {
  return data && typeof data === 'object' && data.version === 2 && 'blocks' in data;
}

/**
 * Convert V1 ResumeData to V2 ResumeV2Data
 */
export function convertV1ToV2(v1Data: ResumeData): ResumeV2Data {
  const blocks: ResumeBlock[] = [];

  // 1. Personal Info - convert to text block
  const personalInfoText = formatPersonalInfo(v1Data.personalInfo);
  blocks.push({
    title: '个人信息',
    type: 'text',
    data: personalInfoText
  });

  // 2. Summary - convert to text block
  blocks.push({
    title: '个人总结',
    type: 'text',
    data: v1Data.summary || ''
  });

  // 3. Work Experience - convert to list block
  if (v1Data.workExperience && v1Data.workExperience.length > 0) {
    blocks.push({
      title: '工作经历',
      type: 'list',
      data: v1Data.workExperience.map(work => ({
        id: work.id,
        name: work.company,
        description: `职位：${work.position}\n${work.description}`,
        time: work.duration,
        highlight: ''
      }))
    });
  }

  // 4. Education - convert to list block
  if (v1Data.education && v1Data.education.length > 0) {
    blocks.push({
      title: '教育背景',
      type: 'list',
      data: v1Data.education.map(edu => ({
        id: edu.id,
        name: edu.school,
        description: `${edu.degree}\n${edu.description}`,
        time: edu.duration,
        highlight: ''
      }))
    });
  }

  // 5. Projects - convert to list block
  if (v1Data.projects && v1Data.projects.length > 0) {
    blocks.push({
      title: '项目经历',
      type: 'list',
      data: v1Data.projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        time: project.duration,
        highlight: project.technologies
      }))
    });
  }

  // 6. Skills - convert to text block
  if (v1Data.skills && v1Data.skills.length > 0) {
    blocks.push({
      title: '专业技能',
      type: 'text',
      data: v1Data.skills.join('、')
    });
  }

  return {
    version: 2,
    blocks
  };
}

/**
 * Convert V2 ResumeV2Data to V1 ResumeData
 */
export function convertV2ToV1(v2Data: ResumeV2Data): ResumeData {
  const result: ResumeData = {
    personalInfo: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: ''
    },
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    projects: []
  };

  // Process each block
  v2Data.blocks.forEach(block => {
    const title = block.title.toLowerCase();

    // Personal Info
    if (title.includes('个人信息') || title.includes('基本信息')) {
      if (block.type === 'text' && typeof block.data === 'string') {
        result.personalInfo = parsePersonalInfo(block.data);
      }
    }
    // Summary
    else if (title.includes('总结') || title.includes('简介')) {
      if (block.type === 'text' && typeof block.data === 'string') {
        result.summary = block.data;
      }
    }
    // Work Experience
    else if (title.includes('工作') || title.includes('经历')) {
      if (block.type === 'list' && Array.isArray(block.data)) {
        result.workExperience = block.data.map(item => 
          convertToWorkExperience(item)
        );
      }
    }
    // Education
    else if (title.includes('教育') || title.includes('学历')) {
      if (block.type === 'list' && Array.isArray(block.data)) {
        result.education = block.data.map(item => 
          convertToEducation(item)
        );
      }
    }
    // Projects
    else if (title.includes('项目')) {
      if (block.type === 'list' && Array.isArray(block.data)) {
        result.projects = block.data.map(item => 
          convertToProject(item)
        );
      }
    }
    // Skills
    else if (title.includes('技能') || title.includes('专长')) {
      if (block.type === 'text' && typeof block.data === 'string') {
        result.skills = block.data.split(/[、,，\n]/).filter(s => s.trim());
      }
    }
  });

  return result;
}

/**
 * Format PersonalInfo to text
 */
function formatPersonalInfo(info: PersonalInfo): string {
  const parts: string[] = [];
  if (info.name) parts.push(`姓名：${info.name}`);
  if (info.title) parts.push(`职位：${info.title}`);
  if (info.email) parts.push(`邮箱：${info.email}`);
  if (info.phone) parts.push(`电话：${info.phone}`);
  if (info.location) parts.push(`地址：${info.location}`);
  return parts.join('\n');
}

/**
 * Parse PersonalInfo from text
 */
function parsePersonalInfo(text: string): PersonalInfo {
  const info: PersonalInfo = {
    name: '',
    title: '',
    email: '',
    phone: '',
    location: ''
  };

  const lines = text.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.includes('姓名')) {
      info.name = extractValue(trimmed);
    } else if (trimmed.includes('职位')) {
      info.title = extractValue(trimmed);
    } else if (trimmed.includes('邮箱') || trimmed.includes('email')) {
      info.email = extractValue(trimmed);
    } else if (trimmed.includes('电话') || trimmed.includes('手机')) {
      info.phone = extractValue(trimmed);
    } else if (trimmed.includes('地址') || trimmed.includes('位置')) {
      info.location = extractValue(trimmed);
    }
  });

  return info;
}

/**
 * Extract value from "key: value" or "key：value" format
 */
function extractValue(text: string): string {
  const colonIndex = Math.max(text.indexOf(':'), text.indexOf('：'));
  if (colonIndex !== -1) {
    return text.substring(colonIndex + 1).trim();
  }
  return text;
}

/**
 * Convert ResumeBlockListItem to WorkExperience
 */
function convertToWorkExperience(item: ResumeBlockListItem): WorkExperience {
  // Try to extract position from description
  let position = '';
  let description = item.description;
  
  const positionMatch = item.description.match(/职位[：:]\s*(.+?)[\n\r]/);
  if (positionMatch) {
    position = positionMatch[1].trim();
    description = item.description.replace(/职位[：:]\s*.+?[\n\r]/, '').trim();
  }

  return {
    id: item.id,
    company: item.name,
    position: position || '职位',
    duration: item.time,
    description: description
  };
}

/**
 * Convert ResumeBlockListItem to Education
 */
function convertToEducation(item: ResumeBlockListItem): Education {
  // Try to extract degree from description
  let degree = '';
  let description = item.description;
  
  const lines = item.description.split('\n');
  if (lines.length > 0) {
    degree = lines[0].trim();
    description = lines.slice(1).join('\n').trim();
  }

  return {
    id: item.id,
    school: item.name,
    degree: degree || '学历',
    duration: item.time,
    description: description
  };
}

/**
 * Convert ResumeBlockListItem to Project
 */
function convertToProject(item: ResumeBlockListItem): Project {
  return {
    id: item.id,
    name: item.name,
    duration: item.time,
    description: item.description,
    technologies: item.highlight || ''
  };
}


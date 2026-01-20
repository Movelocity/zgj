/**
 * Resume format converter between V1 and V2
 */

import type { ResumeV2Data, ResumeBlock } from '@/types/resumeV2';

/**
 * Check if data is V1 format (no version field)
 */
export function isV1Format(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  // V1 has personalInfo, summary, workExperience, education, skills, projects
  // V1 does NOT have version field
  return (
    !('version' in data) &&
    'personalInfo' in data &&
    'summary' in data &&
    // 'workExperience' in data &&
    'education' in data &&
    'skills' in data &&
    'projects' in data
  );
}

/**
 * Check if data is V2 format (version: 2)
 */
export function isV2Format(data: any): data is ResumeV2Data {
  return data && typeof data === 'object' && 'blocks' in data && data.version === 2;
}

/**
 * Convert V1 ResumeData to V2 ResumeV2Data
 */
export function convertV1ToV2(v1Data: any): ResumeV2Data {
  const blocks: ResumeBlock[] = [];

  // 1. Personal Info - convert to text block
  blocks.push({
    title: '个人信息',
    type: 'object',
    data: {
      name: v1Data.personalInfo.name,
      email: v1Data.personalInfo.email,
      phone: v1Data.personalInfo.phone,
      location: v1Data.personalInfo.location,
      title: v1Data.personalInfo.title,
      photo: ""
    }
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
      data: v1Data.workExperience.map((work: any) => ({
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
      data: v1Data.education.map((edu: any) => ({
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
      data: v1Data.projects.map((project: any) => ({
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


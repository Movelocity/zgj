import type { ResumeBlock, ResumeBlockListItem, ResumeData, ResumePersonalInfo } from '@/types/resume';

export type ResumeSectionLanguage = 'en';

type ResumeSectionKey =
  | 'personal'
  | 'summary'
  | 'work'
  | 'internship'
  | 'projects'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'awards'
  | 'languages'
  | 'campus'
  | 'research'
  | 'publications'
  | 'volunteer'
  | 'additional';

const titleAliases: Record<string, ResumeSectionKey> = {
  personalinformation: 'personal',
  personalinfo: 'personal',
  contactinformation: 'personal',
  contactinfo: 'personal',
  basicinformation: 'personal',
  个人信息: 'personal',
  基本信息: 'personal',
  联系方式: 'personal',

  summary: 'summary',
  professionalsummary: 'summary',
  resumesummary: 'summary',
  careersummary: 'summary',
  profilesummary: 'summary',
  professionalprofile: 'summary',
  executiveprofile: 'summary',
  executivesummary: 'summary',
  profile: 'summary',
  personalprofile: 'summary',
  aboutme: 'summary',
  selfevaluation: 'summary',
  selfintroduction: 'summary',
  careerobjective: 'summary',
  professionalstatement: 'summary',
  personalstatement: 'summary',
  summarystatement: 'summary',
  objective: 'summary',
  个人总结: 'summary',
  个人简介: 'summary',
  自我评价: 'summary',
  自我介绍: 'summary',
  个人介绍: 'summary',
  求职意向: 'summary',

  workexperience: 'work',
  professionalexperience: 'work',
  employmenthistory: 'work',
  careerhistory: 'work',
  workhistory: 'work',
  experience: 'work',
  工作经历: 'work',
  工作经验: 'work',
  职业经历: 'work',
  任职经历: 'work',

  internshipexperience: 'internship',
  internships: 'internship',
  internship: 'internship',
  实习经历: 'internship',
  实习经验: 'internship',

  projects: 'projects',
  projectexperience: 'projects',
  project: 'projects',
  selectedprojects: 'projects',
  项目经历: 'projects',
  项目经验: 'projects',
  项目: 'projects',
  代表项目: 'projects',

  education: 'education',
  educationbackground: 'education',
  educationalbackground: 'education',
  academicbackground: 'education',
  教育背景: 'education',
  教育经历: 'education',
  学历背景: 'education',

  skills: 'skills',
  professionalskills: 'skills',
  technicalskills: 'skills',
  coreskills: 'skills',
  keyskills: 'skills',
  additionalskills: 'skills',
  技能: 'skills',
  专业技能: 'skills',
  核心技能: 'skills',
  个人技能: 'skills',
  技能特长: 'skills',

  certifications: 'certifications',
  certificates: 'certifications',
  certificatesother: 'certifications',
  certificatesandother: 'certifications',
  licensescertifications: 'certifications',
  licensesandcertifications: 'certifications',
  证书: 'certifications',
  证书与其他: 'certifications',
  证书及其他: 'certifications',
  技能证书: 'certifications',
  资格证书: 'certifications',

  awards: 'awards',
  honorsawards: 'awards',
  honorsandawards: 'awards',
  awardsandhonors: 'awards',
  honors: 'awards',
  荣誉奖项: 'awards',
  获奖经历: 'awards',
  奖项荣誉: 'awards',
  奖励荣誉: 'awards',

  languages: 'languages',
  language: 'languages',
  languageproficiency: 'languages',
  languageabilities: 'languages',
  语言能力: 'languages',
  语言技能: 'languages',
  外语能力: 'languages',

  campusexperience: 'campus',
  campusactivities: 'campus',
  extracurricularactivities: 'campus',
  extracurriculars: 'campus',
  校园经历: 'campus',
  校园活动: 'campus',
  社团经历: 'campus',
  学生工作: 'campus',
  活动经历: 'campus',

  researchexperience: 'research',
  research: 'research',
  科研经历: 'research',
  科研项目: 'research',
  研究经历: 'research',

  publications: 'publications',
  papers: 'publications',
  论文发表: 'publications',
  发表论文: 'publications',
  学术成果: 'publications',

  volunteerexperience: 'volunteer',
  volunteerwork: 'volunteer',
  volunteering: 'volunteer',
  志愿经历: 'volunteer',
  志愿服务: 'volunteer',
  社会实践: 'volunteer',
  实践经历: 'volunteer',

  additionalinformation: 'additional',
  additional: 'additional',
  otherinformation: 'additional',
  others: 'additional',
  其他: 'additional',
  其他信息: 'additional',
};

const englishSectionTitles: Record<ResumeSectionKey, string> = {
  personal: 'Personal Information',
  summary: 'Professional Summary',
  work: 'Work Experience',
  internship: 'Internship Experience',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  awards: 'Honors and Awards',
  languages: 'Languages',
  campus: 'Campus Experience',
  research: 'Research Experience',
  publications: 'Publications',
  volunteer: 'Volunteer Experience',
  additional: 'Additional Information',
};

const chineseTextPattern = /[\u3400-\u9fff]/;

function compactTitle(title = ''): string {
  return String(title)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[\s/|·._\-—:：,，()（）]+/g, '');
}

export function normalizeResumeSectionTitle(title = ''): string {
  const compact = compactTitle(title);
  return titleAliases[compact] || compact;
}

export function getEnglishResumeSectionTitle(title = ''): string {
  const normalized = normalizeResumeSectionTitle(title);
  const knownTitle = englishSectionTitles[normalized as ResumeSectionKey];

  if (knownTitle) {
    return knownTitle;
  }

  return chineseTextPattern.test(title) ? englishSectionTitles.additional : title;
}

export function normalizeResumeDataForLanguage(
  resumeData: ResumeData,
  language?: ResumeSectionLanguage,
): ResumeData {
  if (language !== 'en' || !Array.isArray(resumeData?.blocks)) {
    return resumeData;
  }

  const mergedBlocks: ResumeBlock[] = [];
  const blockIndexByKey = new Map<string, number>();

  resumeData.blocks.forEach((block) => {
    if (!block || typeof block !== 'object') {
      return;
    }

    const normalizedKey = normalizeResumeSectionTitle(block.title);
    const mergeKey = `${normalizedKey || compactTitle(block.title)}|||${block.type}`;
    const englishTitle = getEnglishResumeSectionTitle(block.title);
    const normalizedBlock: ResumeBlock = {
      ...block,
      title: englishTitle,
      data: normalizeBlockData(block, language),
    };

    const existingIndex = blockIndexByKey.get(mergeKey);
    if (existingIndex === undefined) {
      blockIndexByKey.set(mergeKey, mergedBlocks.length);
      mergedBlocks.push(normalizedBlock);
      return;
    }

    mergedBlocks[existingIndex] = mergeBlocks(mergedBlocks[existingIndex], normalizedBlock, language);
  });

  return {
    ...resumeData,
    blocks: mergedBlocks,
  };
}

function normalizeBlockData(block: ResumeBlock, language?: ResumeSectionLanguage): ResumeBlock['data'] {
  if (block.type === 'list') {
    return Array.isArray(block.data)
      ? block.data.map((item, index) => normalizeListItem(item, index, language))
      : [];
  }

  if (block.type === 'text') {
    return normalizeTextValue(block.data, language);
  }

  if (block.type === 'object' && block.data && typeof block.data === 'object' && !Array.isArray(block.data)) {
    return normalizeObjectData(block.data as ResumePersonalInfo, language);
  }

  return block.data;
}

function normalizeObjectData(
  data: ResumePersonalInfo,
  language?: ResumeSectionLanguage,
): ResumePersonalInfo {
  if (language !== 'en') {
    return data;
  }

  return {
    ...data,
    name: normalizeTextValue(data?.name, language),
    title: normalizeTextValue(data?.title, language),
    phone: normalizeTextValue(data?.phone, language),
    email: normalizeTextValue(data?.email, language),
    location: normalizeTextValue(data?.location, language),
    photo: normalizeTextValue(data?.photo, language),
  };
}

function normalizeListItem(
  item: ResumeBlockListItem,
  index: number,
  language?: ResumeSectionLanguage,
): ResumeBlockListItem {
  if (!item || typeof item !== 'object') {
    return {
      id: `item-${Date.now()}-${index}`,
      name: '',
      description: '',
      time: '',
      highlight: '',
    };
  }

  if (language !== 'en') {
    return item;
  }

  return {
    ...item,
    name: normalizeTextValue(item.name, language),
    time: normalizeTextValue(item.time, language),
    description: normalizeTextValue(item.description, language),
    highlight: normalizeTextValue(item.highlight, language),
  };
}

function mergeBlocks(
  existingBlock: ResumeBlock,
  incomingBlock: ResumeBlock,
  language?: ResumeSectionLanguage,
): ResumeBlock {
  if (existingBlock.type !== incomingBlock.type) {
    return preferEnglishBlock(existingBlock, incomingBlock, language);
  }

  if (existingBlock.type === 'object' && incomingBlock.type === 'object') {
    return {
      ...existingBlock,
      title: incomingBlock.title || existingBlock.title,
      data: mergeObjectsForEnglish(
        existingBlock.data as ResumePersonalInfo,
        incomingBlock.data as ResumePersonalInfo,
        language,
      ),
    };
  }

  if (existingBlock.type === 'text' && incomingBlock.type === 'text') {
    return {
      ...existingBlock,
      title: incomingBlock.title || existingBlock.title,
      data: chooseEnglishValue(existingBlock.data, incomingBlock.data, language),
    };
  }

  if (existingBlock.type === 'list' && incomingBlock.type === 'list') {
    return {
      ...existingBlock,
      title: incomingBlock.title || existingBlock.title,
      data: chooseEnglishValue(existingBlock.data, incomingBlock.data, language),
    };
  }

  return preferEnglishBlock(existingBlock, incomingBlock, language);
}

function mergeObjectsForEnglish(
  existingData: ResumePersonalInfo,
  incomingData: ResumePersonalInfo,
  language?: ResumeSectionLanguage,
): ResumePersonalInfo {
  const merged = { ...existingData };
  Object.entries(incomingData || {}).forEach(([key, incomingValue]) => {
    merged[key as keyof ResumePersonalInfo] = chooseEnglishValue(
      merged[key as keyof ResumePersonalInfo],
      incomingValue as ResumePersonalInfo[keyof ResumePersonalInfo],
      language,
    );
  });
  return merged as ResumePersonalInfo;
}

function preferEnglishBlock(
  existingBlock: ResumeBlock,
  incomingBlock: ResumeBlock,
  language?: ResumeSectionLanguage,
): ResumeBlock {
  return englishScore(flattenForLanguageScore(incomingBlock.data, language)) >= englishScore(flattenForLanguageScore(existingBlock.data, language))
    ? incomingBlock
    : existingBlock;
}

function chooseEnglishValue<T>(existingValue: T, incomingValue: T, language?: ResumeSectionLanguage): T {
  if (isBlankValue(existingValue)) return incomingValue;
  if (isBlankValue(incomingValue)) return existingValue;

  const existingScore = englishScore(normalizeTextValue(flattenForLanguageScore(existingValue, language), language));
  const incomingScore = englishScore(normalizeTextValue(flattenForLanguageScore(incomingValue, language), language));

  return incomingScore >= existingScore ? incomingValue : existingValue;
}

function isBlankValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function flattenForLanguageScore(value: unknown, language?: ResumeSectionLanguage): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.map((item) => flattenForLanguageScore(item, language)).join('\n');
  }
  if (value && typeof value === 'object') {
    return Object.values(value).map((item) => flattenForLanguageScore(item, language)).join('\n');
  }
  return String(value || '');
}

function englishScore(text: string): number {
  const letters = (text.match(/[A-Za-z]/g) || []).length;
  const chineseChars = (text.match(/[\u3400-\u9fff]/g) || []).length;
  return letters - chineseChars * 3;
}

function normalizeTextValue(value: unknown, language?: ResumeSectionLanguage): string {
  const text = String(value ?? '').replace(/\r\n/g, '\n').trim();
  if (language !== 'en' || !text) {
    return text;
  }

  if (!/[A-Za-z]/.test(text)) {
    return text;
  }

  const normalizedLines = text
    .split('\n')
    .map((line) => normalizeEnglishLine(line))
    .filter(Boolean);

  const normalized = normalizedLines.join('\n').trim();
  return normalized || text;
}

function normalizeEnglishLine(line: string): string {
  const raw = String(line ?? '').trim();
  if (!raw) return '';

  const fragments = raw
    .split(/[|｜/／;；]+/)
    .map((fragment) => fragment.trim())
    .filter(Boolean);

  const englishFragments = fragments.filter((fragment) => /[A-Za-z]/.test(fragment));
  let chosen = englishFragments[englishFragments.length - 1] || raw;

  chosen = chosen
    .replace(/[\u3400-\u9fff]/g, '')
    .replace(/[，。！？、；：]/g, ' ')
    .replace(/^[\s\-–—:：|,，/\\/]+/, '')
    .replace(/[\s\-–—:：|,，/\\/]+$/, '')
    .replace(/\(\s*\)|（\s*）|\[\s*\]|\{\s*\}/g, '')
    .replace(/^\s*[-*•·]+\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return chosen;
}

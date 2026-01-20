import type { ResumeData, ResumeBlock } from '@/types/resume';

/**
 * Build a mapping from resumeData block indices to newResumeData block indices
 * Matching strategy:
 * 1. Match by title + type (exact match)
 * 2. For blocks with the same title+type, match in order of appearance
 * 3. Returns -1 for blocks that have no match in newResumeData
 * 
 * @param resumeData - Current resume data being edited
 * @param newResumeData - AI-optimized resume data
 * @returns Array where index is resumeData block index, value is newResumeData block index (-1 if no match)
 */
export function buildBlockMatchMap(
  resumeData: ResumeData, 
  newResumeData: ResumeData
): number[] {
  const matchMap: number[] = [];
  const usedNewIndices = new Set<number>();

  // Create a key for matching: title + type
  const getBlockKey = (block: ResumeBlock) => `${block.title}|||${block.type}`;

  // Build reverse index for newResumeData: key -> array of indices
  const newBlocksIndex = new Map<string, number[]>();
  newResumeData.blocks?.forEach((block, index) => {
    const key = getBlockKey(block);
    if (!newBlocksIndex.has(key)) {
      newBlocksIndex.set(key, []);
    }
    newBlocksIndex.get(key)!.push(index);
  });

  // Match each block in resumeData
  resumeData.blocks?.forEach((block, resumeIndex) => {
    const key = getBlockKey(block);
    const candidates = newBlocksIndex.get(key);

    if (candidates && candidates.length > 0) {
      // Find first unused candidate
      const matchedIndex = candidates.find(idx => !usedNewIndices.has(idx));
      if (matchedIndex !== undefined) {
        matchMap[resumeIndex] = matchedIndex;
        usedNewIndices.add(matchedIndex);
      } else {
        // All candidates already used, no match
        matchMap[resumeIndex] = -1;
      }
    } else {
      // No matching block found
      matchMap[resumeIndex] = -1;
    }
  });

  return matchMap;
}

/**
 * Find new blocks in newResumeData that don't exist in resumeData
 * @param newResumeData - AI-optimized resume data  
 * @param matchMap - Block match mapping from buildBlockMatchMap
 * @returns Array of newResumeData block indices that are new (not matched)
 */
export function findNewBlocks(
  newResumeData: ResumeData,
  matchMap: number[]
): number[] {
  const matchedNewIndices = new Set(matchMap.filter(idx => idx !== -1));
  const newBlocks: number[] = [];

  newResumeData.blocks.forEach((block, index) => {
    if (!matchedNewIndices.has(index) && block.title !== '') {
      console.log('new block', block);
      newBlocks.push(index);
    }
  });

  return newBlocks;
}

export const generateAIResponse = (userInput: string): string => {
  const input = userInput.toLowerCase();
  
  if (input.includes('个人总结') || input.includes('总结')) {
    return '我建议您的个人总结更加突出核心竞争力。我已经为您重新组织了语言，强调了您的技术专长和项目经验。您觉得这样的表达是否更有吸引力？';
  } else if (input.includes('工作经历') || input.includes('工作')) {
    return '我注意到您的工作经历可以更好地展示成果。我建议用具体的数据和成就来替换部分描述，这样会更有说服力。左侧已经更新了相关内容。';
  } else if (input.includes('技能') || input.includes('关键词')) {
    return '我为您优化了技能关键词的排列，将最相关的技能放在前面，并添加了一些行业热门关键词。这样更容易被ATS系统识别。';
  } else if (input.includes('项目') || input.includes('项目经验')) {
    return '项目经验是简历的亮点！我建议突出您在项目中的具体贡献和使用的技术栈。我已经调整了项目描述的结构，您可以查看左侧的修改。';
  } else {
    return '我理解您的需求。基于您的简历内容，我建议从以下几个方面进行优化。请查看左侧的修改建议，有任何问题随时告诉我。';
  }
};

export const generateSuggestions = (userInput: string): string[] => {
  const input = userInput.toLowerCase();
  
  if (input.includes('个人总结')) {
    return ['增加量化成果', '突出核心技能', '调整语言风格'];
  } else if (input.includes('工作经历')) {
    return ['添加具体数据', '优化行动词汇', '突出核心成就'];
  } else if (input.includes('技能')) {
    return ['调整技能顺序', '添加热门关键词', '分类技能展示'];
  } else {
    return ['整体润色xxxx', '格式调整yyyyy', '内容扩充', '重点突出'];
  }
};

export const truncate = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
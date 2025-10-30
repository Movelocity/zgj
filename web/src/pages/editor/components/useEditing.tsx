import { useState, useRef, useMemo } from 'react';
import { isListBlock, isTextBlock, isObjectBlock } from '@/types/resumeV2';
import type { ResumeV2Data } from '@/types/resumeV2';
import { buildBlockMatchMap } from './utils';

export interface EditorState {
  editingField: string | null;
  editingValueRef: React.RefObject<string>;
  setEditingField: (field: string | null) => void;
  startEditing: (fieldId: string, currentValue: string) => void;
  saveEdit: (fieldId: string, inputElement: HTMLInputElement | HTMLTextAreaElement) => void;
  cancelEdit: () => void;
  getNewValue: (blockIndex: number, itemId?: string, field?: string) => string;
  acceptUpdate: (blockIndex: number, itemId?: string, field?: string) => void;
  clearNewValue: (blockIndex: number, itemId?: string, field?: string) => void;
}

export const useEditing = (
  resumeData: ResumeV2Data,
  newResumeData: ResumeV2Data,
  onResumeDataChange: (data: ResumeV2Data) => void,
  onNewResumeDataChange: (data: ResumeV2Data) => void,
): EditorState => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const editingValueRef = useRef<string>('');

  // Build block match mapping: resumeData index -> newResumeData index
  // This ensures blocks are matched by title+type, not by position
  const blockMatchMap = useMemo(() => {
    if (!resumeData.blocks || !newResumeData.blocks) {
      return [];
    }
    return buildBlockMatchMap(resumeData, newResumeData);
  }, [resumeData, newResumeData]);

   // Start editing field
   const startEditing = (fieldId: string, currentValue: string) => {
    setEditingField(fieldId);
    editingValueRef.current = currentValue;
  };

  // Save edit
  const saveEdit = (fieldId: string, inputElement: HTMLInputElement | HTMLTextAreaElement) => {
    const currentValue = inputElement.value;
    const newData = { ...resumeData };
    
    const [blockIdx, itemId, field] = fieldId.split('-');
    const blockIndex = parseInt(blockIdx.replace('block', ''));
    
    if (blockIndex >= 0 && blockIndex < newData.blocks.length) {
      const block = newData.blocks[blockIndex];
      
      // 优先处理 object 类型的字段（包括 title）
      if (isObjectBlock(block) && field) {
        // 对于 object 类型，所有字段（包括 title）都是 data 内的字段
        (block.data as any)[field] = currentValue;
      } else if (field === 'title') {
        // 对于非 object 类型，title 是 block 的 title
        block.title = currentValue;
      } else if (isTextBlock(block)) {
        block.data = currentValue;
      } else if (isListBlock(block) && itemId) {
        const item = block.data.find(item => item.id === itemId);
        if (item && field) {
          (item as any)[field] = currentValue;
        }
      }
    }
    
    onResumeDataChange(newData);
    setEditingField(null);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingField(null);
  };

  // Get new value from newResumeData
  const getNewValue = (blockIndex: number, itemId?: string, field?: string): string => {
    // Use block match map to find corresponding block in newResumeData
    const newBlockIndex = blockMatchMap[blockIndex];
    
    // No matching block found in newResumeData
    if (newBlockIndex === undefined || newBlockIndex === -1) {
      return '';
    }
    
    if (newBlockIndex < 0 || newBlockIndex >= newResumeData.blocks.length) {
      return '';
    }
    
    const block = newResumeData.blocks[newBlockIndex];
    
    // 安全检查：确保 block 存在且是有效对象
    if (!block || typeof block !== 'object') {
      console.warn(`Block at index ${newBlockIndex} is invalid:`, block);
      return '';
    }
    
    // 优先处理 object 类型的字段（包括 title）
    if (isObjectBlock(block) && field) {
      // 对于 object 类型，所有字段（包括 title）都是 data 内的字段
      return (block.data as any)[field] || '';
    } else if (field === 'title') {
      // 对于非 object 类型，title 是 block 的 title
      return block.title || '';
    } else if (isTextBlock(block)) {
      return block.data || '';
    } else if (isListBlock(block) && itemId && field) {
      const item = block.data.find(item => item.id === itemId);
      return item ? (item as any)[field] || '' : '';
    }
    
    return '';
  };

  // Accept update - copy from newResumeData to resumeData
  const acceptUpdate = (blockIndex: number, itemId?: string, field?: string) => {
    // Use block match map to find corresponding block in newResumeData
    const newBlockIndex = blockMatchMap[blockIndex];
    
    // No matching block found in newResumeData
    if (newBlockIndex === undefined || newBlockIndex === -1) {
      console.warn(`No matching block found for blockIndex ${blockIndex}`);
      return;
    }
    
    const newData = { ...resumeData };
    
    if (blockIndex < 0 || blockIndex >= newData.blocks.length) return;
    if (newBlockIndex < 0 || newBlockIndex >= newResumeData.blocks.length) return;
    
    const block = newData.blocks[blockIndex];
    const newBlock = newResumeData.blocks[newBlockIndex];
    
    // 优先处理 object 类型的字段更新（包括 title 字段）
    if (isObjectBlock(block) && isObjectBlock(newBlock) && field && field !== 'title') {
      (block.data as any)[field] = (newBlock.data as any)[field];
    } else if (isObjectBlock(block) && isObjectBlock(newBlock) && field === 'title') {
      // 对于 object 类型，title 是 data 内的字段，不是 block 的 title
      (block.data as any)[field] = (newBlock.data as any)[field];
    } else if (field === 'title') {
      // 对于非 object 类型，title 是 block 的 title
      block.title = newBlock.title;
    } else if (isTextBlock(block) && isTextBlock(newBlock)) {
      block.data = newBlock.data;
    } else if (isListBlock(block) && isListBlock(newBlock) && itemId && field) {
      const item = block.data.find(item => item.id === itemId);
      const newItem = newBlock.data.find(item => item.id === itemId);
      if (item && newItem) {
        (item as any)[field] = (newItem as any)[field];
      }
    }
    
    onResumeDataChange(newData);
  };

  // Clear new value - reset newResumeData to match resumeData
  const clearNewValue = (blockIndex: number, itemId?: string, field?: string) => {
    // Use block match map to find corresponding block in newResumeData
    const newBlockIndex = blockMatchMap[blockIndex];
    
    // No matching block found in newResumeData
    if (newBlockIndex === undefined || newBlockIndex === -1) {
      console.warn(`No matching block found for blockIndex ${blockIndex}`);
      return;
    }
    
    const newData = { ...newResumeData };
    
    if (blockIndex < 0 || blockIndex >= resumeData.blocks.length) return;
    if (newBlockIndex < 0 || newBlockIndex >= newData.blocks.length) return;
    
    const block = newData.blocks[newBlockIndex];
    const originalBlock = resumeData.blocks[blockIndex];
    
    // 优先处理 object 类型的字段更新（包括 title 字段）
    if (isObjectBlock(block) && isObjectBlock(originalBlock) && field && field !== 'title') {
      (block.data as any)[field] = (originalBlock.data as any)[field];
    } else if (isObjectBlock(block) && isObjectBlock(originalBlock) && field === 'title') {
      // 对于 object 类型，title 是 data 内的字段，不是 block 的 title
      (block.data as any)[field] = (originalBlock.data as any)[field];
    } else if (field === 'title') {
      // 对于非 object 类型，title 是 block 的 title
      block.title = originalBlock.title;
    } else if (isTextBlock(block) && isTextBlock(originalBlock)) {
      block.data = originalBlock.data;
    } else if (isListBlock(block) && isListBlock(originalBlock) && itemId && field) {
      const item = block.data.find(item => item.id === itemId);
      const originalItem = originalBlock.data.find(item => item.id === itemId);
      if (item && originalItem) {
        (item as any)[field] = (originalItem as any)[field];
      }
    }
    
    onNewResumeDataChange(newData);
  };

  return { 
    editingField, 
    editingValueRef,
    setEditingField, 
    startEditing,
    saveEdit,
    cancelEdit,
    getNewValue,
    acceptUpdate,
    clearNewValue,
  };
}
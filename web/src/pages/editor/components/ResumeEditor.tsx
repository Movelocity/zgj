import { ChevronUp, ChevronDown, Trash2, Mail, Phone, MapPin, Plus } from 'lucide-react';
import Button from "@/components/ui/Button";
import type { ResumeBlock, ResumeBlockListItem, ResumeV2Data } from '@/types/resumeV2';
import { isListBlock, isTextBlock, isObjectBlock, createEmptyListItem } from '@/types/resumeV2';
import { showSuccess } from '@/utils/toast';
import { EditableText } from './EditableText';
import { useEditing } from './useEditing';
import { type FontSettings, getFontSizeClasses } from './FontSettingsPanel';
import { buildBlockMatchMap, findNewBlocks } from './utils';
import { useMemo, useState } from 'react';
import cn from 'classnames';
import PortraitImageEditor from './PortraitImageEditor';

interface ResumeEditorV2Props {
  resumeData: ResumeV2Data;
  newResumeData: ResumeV2Data;
  onResumeDataChange?: (data: ResumeV2Data) => void;
  onNewResumeDataChange?: (data: ResumeV2Data) => void;
  fontSettings?: FontSettings;
}

export default function ResumeEditorV2({ 
  resumeData, 
  newResumeData,
  onResumeDataChange = () => {}, 
  onNewResumeDataChange = () => {},
  fontSettings = { titleSize: 'medium', labelSize: 'medium', contentSize: 'medium' },
}: ResumeEditorV2Props) {
  
  const editorState = useEditing(
    resumeData,
    newResumeData,
    onResumeDataChange,
    onNewResumeDataChange,
  );

  // 获取字体大小样式
  const fontSizeClasses = getFontSizeClasses(fontSettings);

  // Track rejected new block indices
  const [rejectedBlockIndices, setRejectedBlockIndices] = useState<Set<number>>(new Set());

  // Find new blocks that AI added
  const blockMatchMap = useMemo(() => 
    buildBlockMatchMap(resumeData, newResumeData), 
    [resumeData, newResumeData]
  );
  
  const allNewBlockIndices = useMemo(() => 
    findNewBlocks(newResumeData, blockMatchMap),
    [newResumeData, blockMatchMap]
  );

  // Filter out rejected blocks
  const newBlockIndices = useMemo(() => 
    allNewBlockIndices.filter(idx => !rejectedBlockIndices.has(idx)),
    [allNewBlockIndices, rejectedBlockIndices]
  );

  // Add a new AI-suggested block to the resume
  const addNewBlock = (newBlockIndex: number) => {
    const blockToAdd = newResumeData.blocks[newBlockIndex];
    if (!blockToAdd) return;

    const updatedData = { ...resumeData };
    updatedData.blocks.push({ ...blockToAdd });
    onResumeDataChange(updatedData);
    
    // Remove from rejected list if it was rejected before
    setRejectedBlockIndices(prev => {
      const newSet = new Set(prev);
      newSet.delete(newBlockIndex);
      return newSet;
    });
    
    showSuccess(`已添加板块: ${blockToAdd.title}`);
  };

  // Reject a new AI-suggested block
  const rejectNewBlock = (newBlockIndex: number) => {
    const blockToReject = newResumeData.blocks[newBlockIndex];
    if (!blockToReject) return;

    setRejectedBlockIndices(prev => new Set(prev).add(newBlockIndex));
    showSuccess(`已拒绝板块: ${blockToReject.title || '(无标题)'}`);
  };

  // Handle portrait image change for personal info block
  const handlePortraitChange = (blockIndex: number, photoUrl: string) => {
    const block = resumeData.blocks[blockIndex];
    if (!isObjectBlock(block)) return;

    // Update resume data with photo URL
    const newData = { ...resumeData };
    const updatedBlock: ResumeBlock = {
      ...block,
      data: {
        ...(block.data as any),
        photo: photoUrl
      }
    };
    newData.blocks[blockIndex] = updatedBlock;
    onResumeDataChange(newData);
  };

 

  // Update block
  const updateBlock = (blockIndex: number, updatedBlock: ResumeBlock) => {
    const newData = { ...resumeData };
    newData.blocks[blockIndex] = updatedBlock;
    onResumeDataChange(newData);
  };

  // Add list item
  const addListItem = (blockIndex: number) => {
    const block = resumeData.blocks[blockIndex];
    if (isListBlock(block)) {
      const newItem = createEmptyListItem();
      const updatedBlock = {
        ...block,
        data: [...block.data, newItem]
      };
      updateBlock(blockIndex, updatedBlock);
    }
  };

  // Remove list item
  const removeListItem = (blockIndex: number, itemId: string) => {
    const block = resumeData.blocks[blockIndex];
    if (isListBlock(block)) {
      const updatedBlock = {
        ...block,
        data: block.data.filter(item => item.id !== itemId)
      };
      updateBlock(blockIndex, updatedBlock);
    }
  };

  // Move list item
  const moveListItem = (blockIndex: number, itemId: string, direction: 'up' | 'down') => {
    const block = resumeData.blocks[blockIndex];
    if (isListBlock(block)) {
      const currentIndex = block.data?.findIndex(item => item.id === itemId);
      if (currentIndex === -1 || !block.data) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= block.data.length) return;

      const newData = [...block.data];
      [newData[currentIndex], newData[newIndex]] = [newData[newIndex], newData[currentIndex]];
      
      updateBlock(blockIndex, { ...block, data: newData });
    }
  };

  // 添加新的大板块
  const addBlock = () => {
    const newData = { ...resumeData };
    newData.blocks.push({
      title: '新板块',
      type: 'text',
      data: ''
    });
    onResumeDataChange(newData);
  };

  // 删除大板块
  const removeBlock = (blockIndex: number) => {
    const newData = { ...resumeData };
    newData.blocks.splice(blockIndex, 1);
    onResumeDataChange(newData);
  };

  // 移动大板块
  const moveBlock = (blockIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= resumeData.blocks.length) return;

    const newData = { ...resumeData };
    [newData.blocks[blockIndex], newData.blocks[newIndex]] = 
      [newData.blocks[newIndex], newData.blocks[blockIndex]];
    onResumeDataChange(newData);
  };

  // Toggle block type
  // const toggleBlockType = (blockIndex: number) => {
  //   const block = resumeData.blocks[blockIndex];
  //   const newBlock: ResumeBlock = {
  //     ...block,
  //     type: block.type === 'list' ? 'text' : 'list',
  //     data: block.type === 'list' ? '' : []
  //   };
  //   updateBlock(blockIndex, newBlock);
  // };

  // Render list block
  const renderListBlock = (block: ResumeBlock & { data: ResumeBlockListItem[] }, blockIndex: number) => {
    return (
      <div className="">
        {block.data.map((item, itemIndex) => (
          <div key={item.id} className="relative group pl-4 break-inside-avoid">
            {/* 小板块操作 - 左侧面板 */}
            <div className="absolute -left-6 top-0 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="zero"
                variant="outline"
                disabled={itemIndex === 0}
                onClick={() => moveListItem(blockIndex, item.id, 'up')}
                className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                title="上移"
              >
                <ChevronUp size={14} />
              </Button>

              <Button
                size="zero"
                variant="outline"
                onClick={() => moveListItem(blockIndex, item.id, 'down')}
                disabled={itemIndex === block.data.length - 1}
                className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                title="下移"
              >
                <ChevronDown size={14} />
              </Button>

              <Button
                size="zero"
                variant="outline"
                onClick={() => removeListItem(blockIndex, item.id)}
                className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-red-50 hover:text-red-600"
                title="删除"
              >
                <Trash2 size={14} />
              </Button>
            </div>

            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className={`text-gray-800 font-medium ${fontSizeClasses.label}`}>
                  <EditableText
                    editorState={editorState}
                    fieldId={`block${blockIndex}-${item.id}-name`}
                    value={item.name}
                    placeholder="如：XX大学、XX公司"
                    blockIndex={blockIndex}
                    itemId={item.id}
                    field="name"
                  />
                </h4>
                {/* <div className={`text-blue-600 ${fontSizeClasses.content}`}>
                  <EditableText
                    className={item.highlight ? '' : 'hide-when-print'}
                    editorState={editorState}
                    fieldId={`block${blockIndex}-${item.id}-highlight`}
                    value={item.highlight}
                    placeholder="亮点/专业/职位"
                    blockIndex={blockIndex}
                    itemId={item.id}
                    field="highlight"
                  />
                </div> */}
              </div>
              <span 
                className={cn(
                  'text-gray-500 ml-4', 
                  fontSizeClasses.content, 
                  item.time ? '' : 'hide-when-print'
                )}
              >
                <EditableText
                  editorState={editorState}
                  fieldId={`block${blockIndex}-${item.id}-time`}
                  value={item.time}
                  placeholder="时间"
                  blockIndex={blockIndex}
                  itemId={item.id}
                  field="time"
                />
              </span>
            </div>
            <div className={cn(
              'text-gray-700 leading-relaxed whitespace-pre-line', 
              fontSizeClasses.content,
              item.description ? '' : 'hide-when-print'
            )}>
              <EditableText
                editorState={editorState}
                fieldId={`block${blockIndex}-${item.id}-description`}
                value={item.description}
                placeholder="点击添加详细描述..."
                multiline={true}
                blockIndex={blockIndex}
                itemId={item.id}
                field="description"
              />
            </div>
          </div>
        ))}
        
        {block.data.length === 0 && (
          <p className="text-gray-500 italic">暂无内容，请从左侧菜单添加...</p>
        )}
      </div>
    );
  };

  // Render text block
  const renderTextBlock = (block: ResumeBlock & { data: string }, blockIndex: number) => {
    return (
      <div className={`text-gray-700 leading-relaxed ml-4 ${fontSizeClasses.content}`}>
        <EditableText
          editorState={editorState}
          fieldId={`block${blockIndex}--data`}
          value={block.data}
          placeholder="点击添加文本内容..."
          multiline={true}
          blockIndex={blockIndex}
          field="data"
        />
      </div>
    );
  };

  // Render personal info block (object type)
  const renderPersonalInfoBlock = (block: ResumeBlock, blockIndex: number) => {
    if (!isObjectBlock(block)) return null;
    
    const { name, email, phone, location, photo } = block.data;
    
    return (
      <div className="border-b-2 border-blue-600 pb-3 px-3">
        <div className="flex items-end justify-between gap-6">
          {/* Left side - Personal Info */}
          <div className="flex-1">
            <h1 className="text-4xl text-gray-800 mb-2">
              <EditableText
                editorState={editorState}
                fieldId={`block${blockIndex}--name`}
                value={name}
                placeholder="点击输入姓名"
                blockIndex={blockIndex}
                field="name"
              />
            </h1>
            <h2 className="text-xl text-blue-600 mb-4">
              <EditableText
                editorState={editorState}
                fieldId={`block${blockIndex}--title`}
                value={block.data.title || ''}
                placeholder="点击输入职位"
                blockIndex={blockIndex}
                field="title"
              />
            </h2>
            <div className={`flex flex-wrap gap-4 text-gray-600 ${fontSizeClasses.content}`}>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <EditableText
                  editorState={editorState}
                  fieldId={`block${blockIndex}--email`}
                  value={email}
                  placeholder="点击输入邮箱"
                  blockIndex={blockIndex}
                  field="email"
                />
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                <EditableText
                  editorState={editorState}
                  fieldId={`block${blockIndex}--phone`}
                  value={phone}
                  placeholder="点击输入电话"
                  blockIndex={blockIndex}
                  field="phone"
                />
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <EditableText
                  editorState={editorState}
                  fieldId={`block${blockIndex}--location`}
                  value={location}
                  placeholder="点击输入地址"
                  blockIndex={blockIndex}
                  field="location"
                />
              </div>
            </div>
          </div>

          {/* Right side - Portrait Photo */}
          <PortraitImageEditor
            currentImageUrl={photo}
            onImageChange={(imageUrl) => handlePortraitChange(blockIndex, imageUrl)}
            imageSize={{ width: 120, height: 160 }}
            aspect={3 / 4}
            id={`portrait-${blockIndex}`}
          />
        </div>
      </div>
    );
  };

  const personalInfoBlockIndex = resumeData.blocks?.findIndex(block => block.type === 'object');
  const personalInfoBlock = personalInfoBlockIndex !== undefined && personalInfoBlockIndex >= 0 ? resumeData.blocks[personalInfoBlockIndex] : null;

  return (
    <div className="h-full bg-white">
      <div className="py-8 px-6 max-w-4xl mx-auto" data-resume-editor>
        {/* Blocks Section */}
        <div className="">
          {personalInfoBlock && personalInfoBlockIndex >= 0 && (
            <div key={personalInfoBlock.title} className="mb-3 rounded-lg relative group">
              {renderPersonalInfoBlock(personalInfoBlock, personalInfoBlockIndex)}
            </div>
          )}
          {resumeData.blocks.map((block, originalIndex) => {
            // Skip object type blocks (personal info is rendered separately)
            if (block.type === 'object') return null;
            
            return (
              <div key={originalIndex} className="relative">
                {/* Block Header with left border */}
                <div className="relative">
                  <h3 className={`text-gray-800 border-l-4 border-blue-600 pl-2 inline-block font-semibold ${fontSizeClasses.title}`}>
                    <EditableText
                      editorState={editorState}
                      fieldId={`block${originalIndex}--title`}
                      value={block.title}
                      placeholder="板块标题"
                      blockIndex={originalIndex}
                      field="title"
                    />
                  </h3>
                  
                  {/* 大板块操作 - 左侧面板 */}
                  <div className="absolute -left-7 top-0 flex flex-col space-y-1 opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      size="zero"
                      variant="outline"
                      onClick={() => moveBlock(originalIndex, 'up')}
                      disabled={originalIndex === 0}
                      className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                      title="上移板块"
                    >
                      <ChevronUp size={14} />
                    </Button>
                    <Button
                      size="zero"
                      variant="outline"
                      onClick={() => moveBlock(originalIndex, 'down')}
                      disabled={originalIndex === resumeData.blocks.length - 1}
                      className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                      title="下移板块"
                    >
                      <ChevronDown size={14} />
                    </Button>
                    {isListBlock(block) && (
                      <Button
                        size="zero"
                        variant="outline"
                        onClick={() => addListItem(originalIndex)}
                        className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-green-50 hover:text-green-600"
                        title="添加列表项"
                      >
                        <Plus size={14} />
                      </Button>
                    )}
                    <Button
                      size="zero"
                      variant="outline"
                      onClick={() => removeBlock(originalIndex)}
                      className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-red-50 hover:text-red-600"
                      title="删除板块"
                    >
                      <Trash2 size={14} />
                    </Button>
                    {/*<button
                      onClick={() => toggleBlockType(originalIndex)}
                      className="w-6 h-6 p-0 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm flex items-center justify-center"
                      title={`切换为${block.type === 'list' ? '文本' : '列表'}类型`}
                    >
                      {block.type === 'list' ? 'L' : 'T'}
                    </button> */}
                  </div>
                </div>

                {/* Block Content */}
                {isListBlock(block) && renderListBlock(block, originalIndex)}
                {isTextBlock(block) && renderTextBlock(block, originalIndex)}
              </div>
            );
          })}

          {/* AI Suggested New Blocks */}
          {newBlockIndices.length > 0 && (
            <div className="mt-6 mb-4">   
              <div className="space-y-3">
                {newBlockIndices.map((newBlockIdx) => {
                  const block = newResumeData.blocks[newBlockIdx];
                  if (!block) return null;
                  
                  return (
                    <div key={newBlockIdx} className="bg-white rounded-md p-3 border border-blue-400">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-1">新增板块：{block.title || '(无标题)'}</h4>
                          <p className="text-xs text-gray-500">
                            类型: {block.type === 'list' ? '列表' : block.type === 'text' ? '文本' : '对象'}
                            {isListBlock(block) && ` (${block.data.length} 项)`}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectNewBlock(newBlockIdx)}
                          >
                            拒绝
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => addNewBlock(newBlockIdx)}
                          >
                            确认
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Block Button */}
          <div className="relative group mb-3 p-4 -m-4 opacity-0 hover:opacity-100 transition-opacity">
            <h3 
              onClick={addBlock}
              className="text-lg text-gray-400 border-l-4 border-gray-300 pl-3 italic cursor-pointer"
            >
              添加新板块...
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}


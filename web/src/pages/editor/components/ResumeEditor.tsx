import { ChevronUp, ChevronDown, Trash2, Mail, Phone, MapPin, Plus, MoreVertical, Check, X } from 'lucide-react';
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
import HoverOperationPanel from './HoverOperationPanel';

interface ResumeEditorV2Props {
  resumeData: ResumeV2Data;
  newResumeData: ResumeV2Data;
  onResumeDataChange?: (data: ResumeV2Data) => void;
  onNewResumeDataChange?: (data: ResumeV2Data) => void;
  fontSettings?: FontSettings;
  tightLayout?: boolean;
}

export default function ResumeEditorV2({ 
  resumeData, 
  newResumeData,
  onResumeDataChange = () => {}, 
  onNewResumeDataChange = () => {},
  fontSettings = { titleSize: 'medium', labelSize: 'medium', contentSize: 'medium' },
  tightLayout = false,
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
        {block.data.map((item, itemIndex) => {
          return (
            <div key={item.id} className="relative pl-4 break-inside-avoid group/item">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className={`text-gray-800 font-medium ${fontSizeClasses.label} inline-flex items-center gap-2`}>
                    <EditableText
                      editorState={editorState}
                      fieldId={`block${blockIndex}-${item.id}-name`}
                      value={item.name}
                      placeholder="如：XX大学、XX公司"
                      blockIndex={blockIndex}
                      itemId={item.id}
                      field="name"
                    />
                    {/* 小板块操作 */}
                    <HoverOperationPanel
                      trigger={
                        <span className="text-gray-400 hover:text-gray-600 cursor-pointer opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <MoreVertical size={14} />
                        </span>
                      }
                      triggerClassName="inline-block"
                      panelClassName="absolute left-full top-0 ml-2 flex gap-1 bg-white shadow-lg border border-gray-200 rounded px-1 z-10"
                    >
                      <button
                        disabled={itemIndex === 0}
                        onClick={() => moveListItem(blockIndex, item.id, 'up')}
                        className="w-6 h-6 px-1 bg-white hover:bg-gray-50 border-0 cursor-pointer"
                        title="上移"
                      >
                        <ChevronUp size={14} />
                      </button>

                      <button
                        onClick={() => moveListItem(blockIndex, item.id, 'down')}
                        disabled={itemIndex === block.data.length - 1}
                        className="w-6 h-6 px-1 bg-white hover:bg-gray-50 border-0 cursor-pointer"
                        title="下移"
                      >
                        <ChevronDown size={14} />
                      </button>

                      <button
                        onClick={() => removeListItem(blockIndex, item.id)}
                        className="w-6 h-6 px-1 bg-white hover:bg-red-50 hover:text-red-600 border-0 cursor-pointer"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </HoverOperationPanel>
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
          );
        })}
        
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
      <div className={cn("mx-auto", tightLayout ? '' : 'py-8 px-6 max-w-4xl')} data-resume-editor>
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
              <div key={originalIndex} className="relative group/block">
                {/* Block Header with left border */}
                <div className="relative">
                  <h3 className={`text-gray-800 border-l-4 border-blue-600 pl-2 inline-flex items-center gap-2 font-semibold ${fontSizeClasses.title}`}>
                    <EditableText
                      editorState={editorState}
                      fieldId={`block${originalIndex}--title`}
                      value={block.title}
                      placeholder="板块标题"
                      blockIndex={originalIndex}
                      field="title"
                    />
                    
                    {/* 大板块操作 */}
                    <HoverOperationPanel
                      trigger={
                        <span className="text-gray-400 hover:text-gray-600 cursor-pointer opacity-0 group-hover/block:opacity-100 transition-opacity">
                          <MoreVertical size={16} />
                        </span>
                      }
                      triggerClassName="inline-block"
                      panelClassName="absolute left-full top-0 ml-2 flex gap-1 bg-white shadow-lg border border-gray-200 rounded px-1 z-10"
                    >
                      <button
                        onClick={() => moveBlock(originalIndex, 'up')}
                        disabled={originalIndex === 0}
                        className="w-6 h-6 px-1 bg-white hover:bg-gray-50 border-0 cursor-pointer"
                        title="上移板块"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveBlock(originalIndex, 'down')}
                        disabled={originalIndex === resumeData.blocks.length - 1}
                        className="w-6 h-6 px-1 bg-white hover:bg-gray-50 border-0 cursor-pointer"
                        title="下移板块"
                      >
                        <ChevronDown size={14} />
                      </button>
                      {isListBlock(block) && (
                        <button
                          onClick={() => addListItem(originalIndex)}
                          className="w-6 h-6 px-1 bg-white hover:bg-green-50 hover:text-green-600 border-0 cursor-pointer"
                          title="添加项目/经历"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => removeBlock(originalIndex)}
                        className="w-6 h-6 px-1 bg-white hover:bg-red-50 hover:text-red-600 border-0 cursor-pointer"
                        title="删除板块"
                      >
                        <Trash2 size={14} />
                      </button>
                    </HoverOperationPanel>
                  </h3>
                </div>

                {/* Block Content */}
                {isListBlock(block) && renderListBlock(block, originalIndex)}
                {isTextBlock(block) && renderTextBlock(block, originalIndex)}
              </div>
            );
          })}

          {/* AI Suggested New Blocks - rendered inline with indicator */}
          {newBlockIndices.map((newBlockIdx) => {
            const block = newResumeData.blocks[newBlockIdx];
            if (!block || block.type === 'object') return null;
            
            return (
              <div key={`new-${newBlockIdx}`} className="relative group/block">
                {/* Block Header with left border and action buttons */}
                <div className="relative flex items-center justify-between">
                  <h3 className={`text-gray-800 border-l-4 border-blue-600 pl-2 inline-flex items-center gap-2 font-semibold ${fontSizeClasses.title}`}>
                    <span>{block.title || '(无标题)'}</span>
                  </h3>
                  
                  {/* Accept/Reject buttons on the right */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => addNewBlock(newBlockIdx)}
                      className="flex items-center gap-1 px-2 py-0.5 text-xs text-white bg-green-500 hover:bg-green-600 rounded transition-colors cursor-pointer"
                      title="确认添加到简历"
                    >
                      <Check size={12} />
                      <span>接收</span>
                    </button>
                    <button
                      onClick={() => rejectNewBlock(newBlockIdx)}
                      className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="移除此板块"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* Block Content - read only preview */}
                {isListBlock(block) && (
                  <div className="">
                    {block.data.map((item) => (
                      <div key={item.id} className="relative pl-4 break-inside-avoid">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className={`text-gray-800 font-medium ${fontSizeClasses.label}`}>
                              {item.name || '(无标题)'}
                            </h4>
                          </div>
                          {item.time && (
                            <span className={cn('text-gray-500 ml-4', fontSizeClasses.content)}>
                              {item.time}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <div className={cn('text-gray-700 leading-relaxed whitespace-pre-line', fontSizeClasses.content)}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    ))}
                    {block.data.length === 0 && (
                      <p className="text-gray-500 italic pl-4">暂无内容</p>
                    )}
                  </div>
                )}
                {isTextBlock(block) && (
                  <div className={`text-gray-700 leading-relaxed ml-4 whitespace-pre-line ${fontSizeClasses.content}`}>
                    {block.data || '(无内容)'}
                  </div>
                )}
              </div>
            );
          })}

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


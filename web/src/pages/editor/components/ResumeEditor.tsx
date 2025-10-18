import { ChevronUp, ChevronDown, Trash2, Upload, Mail, Phone, MapPin, UserRound, Plus } from 'lucide-react';
import Button from "@/components/ui/Button";
import type { ResumeBlock, ResumeBlockListItem, ResumeV2Data } from '@/types/resumeV2';
import { isListBlock, isTextBlock, isObjectBlock, createEmptyListItem } from '@/types/resumeV2';
import { fileAPI } from '@/api/file';
import { showSuccess, showError } from '@/utils/toast';
import { EditableText } from './EditableText';
import { useEditing } from './useEditing';

interface ResumeEditorV2Props {
  resumeData: ResumeV2Data;
  newResumeData: ResumeV2Data;
  onResumeDataChange?: (data: ResumeV2Data) => void;
  onNewResumeDataChange?: (data: ResumeV2Data) => void;
}

export default function ResumeEditorV2({ 
  resumeData, 
  newResumeData,
  onResumeDataChange = () => {}, 
  onNewResumeDataChange = () => {},
}: ResumeEditorV2Props) {
  
  const editorState = useEditing(
    resumeData,
    newResumeData,
    onResumeDataChange,
    onNewResumeDataChange,
  );

  // Handle portrait image upload for personal info block
  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const block = resumeData.blocks[blockIndex];
    if (!isObjectBlock(block)) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('请上传图片文件');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('图片大小不能超过 5MB');
      return;
    }

    try {
      // Upload file to server
      const response = await fileAPI.uploadFile(file);
      
      if (response.code === 0) {
        const fileId = response.data.id;
        const photoUrl = fileAPI.previewFile(fileId);
        
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
        
        showSuccess('证件照上传成功');
      } else {
        showError(response.msg || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError(error instanceof Error ? error.message : '上传失败');
    }
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
      <div className="space-y-2">
        {block.data.map((item, itemIndex) => (
          <div key={item.id} className="relative group pl-4">
            {/* 小板块操作 - 左侧面板 */}
            <div className="absolute -left-2 top-0 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <h4 className="text-gray-800 font-medium">
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
                <p className="text-blue-600 text-sm">
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
                </p>
              </div>
              <span className="text-gray-500 text-sm ml-4">
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
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line mt-1">
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
        
        {/* <div className="relative group pt-2">
          <div className="text-gray-400 text-sm italic border-l-2 border-dashed border-gray-300 pl-4">
            添加列表项...
          </div>
          <Button
            size="zero"
            variant="outline"
            onClick={() => addListItem(blockIndex)}
            className="absolute -left-12 top-2 w-6 h-6 p-0 bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-50 hover:text-green-600"
            title="添加列表项"
          >
            <Plus size={14} />
          </Button>
        </div> */}
      </div>
    );
  };

  // Render text block
  const renderTextBlock = (block: ResumeBlock & { data: string }, blockIndex: number) => {
    return (
      <div className="text-gray-700 leading-relaxed ml-4">
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
            <h1 className="text-3xl text-gray-800 mb-2">
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
            <div className="flex flex-wrap gap-4 text-gray-600">
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
          <div className="flex-shrink-0 relative">
            {photo ? (
              <img 
                src={photo} 
                alt="证件照" 
                className="w-[120px] h-[160px] object-cover rounded border-2 border-gray-300"
              />
            ) : (
              <div className="w-32 h-40 bg-gray-50 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                <UserRound className="w-10 h-10 text-gray-300" />
              </div>
            )}
            <label
              htmlFor={`portrait-upload-${blockIndex}`}
              className="absolute top-0 left-0 w-full h-full bg-gray-500/50 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white cursor-pointer transition-colors"
              title="上传证件照"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm ">上传证件照</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePortraitUpload(e, blockIndex)}
              className="hidden"
              id={`portrait-upload-${blockIndex}`}
            />
          </div>
        </div>
      </div>
    );
  };

  const personalInfoBlockIndex = resumeData.blocks?.findIndex(block => block.type === 'object');
  const personalInfoBlock = personalInfoBlockIndex !== undefined && personalInfoBlockIndex >= 0 ? resumeData.blocks[personalInfoBlockIndex] : null;

  return (
    <div className="h-full bg-white">
      <div className="p-8 max-w-4xl mx-auto" data-resume-editor>
        {/* Blocks Section */}
        <div className="space-y-3">
          {personalInfoBlock && personalInfoBlockIndex >= 0 && (
            <div key={personalInfoBlock.title} className="p-4 -m-4 rounded-lg relative group">
              {renderPersonalInfoBlock(personalInfoBlock, personalInfoBlockIndex)}
            </div>
          )}
          {resumeData.blocks.map((block, originalIndex) => {
            // Skip object type blocks (personal info is rendered separately)
            if (block.type === 'object') return null;
            
            return (
              <div key={originalIndex} className="p-4 -m-4 rounded-lg relative">
                {/* Block Header with left border */}
                <div className="relative mb-2">
                  <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 inline-block">
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


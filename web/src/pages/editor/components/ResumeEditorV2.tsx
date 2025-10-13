import { useState, useRef } from 'react';
import { Plus, ChevronUp, ChevronDown, Trash2, Upload, Mail, Phone, MapPin } from 'lucide-react';
import Button from "@/components/ui/Button";
import type { ResumeBlock, ResumeBlockListItem, ResumeV2Data } from '@/types/resumeV2';
import { isListBlock, isTextBlock, isObjectBlock, 
  // createEmptyListItem 
} from '@/types/resumeV2';
import { fileAPI } from '@/api/file';
import { showSuccess, showError } from '@/utils/toast';
// import { generateId } from '@/utils/id';
import cn from 'classnames';

interface ResumeEditorV2Props {
  resumeData: ResumeV2Data;
  onResumeDataChange?: (data: ResumeV2Data) => void;
}

export default function ResumeEditorV2({ 
  resumeData, 
  onResumeDataChange = () => {}, 
}: ResumeEditorV2Props) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const editingValueRef = useRef<string>('');

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
      
      if (field === 'title') {
        block.title = currentValue;
      } else if (isTextBlock(block)) {
        block.data = currentValue;
      } else if (isListBlock(block) && itemId) {
        const item = block.data.find(item => item.id === itemId);
        if (item && field) {
          (item as any)[field] = currentValue;
        }
      } else if (isObjectBlock(block) && field) {
        // Handle object block (personal info)
        (block.data as any)[field] = currentValue;
      }
    }
    
    onResumeDataChange(newData);
    setEditingField(null);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingField(null);
  };

  // Update block
  const updateBlock = (blockIndex: number, updatedBlock: ResumeBlock) => {
    const newData = { ...resumeData };
    newData.blocks[blockIndex] = updatedBlock;
    onResumeDataChange(newData);
  };

  // Add list item
  // const addListItem = (blockIndex: number) => {
  //   const block = resumeData.blocks[blockIndex];
  //   if (isListBlock(block)) {
  //     const newItem = createEmptyListItem();
  //     const updatedBlock = {
  //       ...block,
  //       data: [...block.data, newItem]
  //     };
  //     updateBlock(blockIndex, updatedBlock);
  //   }
  // };

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
      const currentIndex = block.data.findIndex(item => item.id === itemId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= block.data.length) return;

      const newData = [...block.data];
      [newData[currentIndex], newData[newIndex]] = [newData[newIndex], newData[currentIndex]];
      
      updateBlock(blockIndex, { ...block, data: newData });
    }
  };

  // Add new block
  const addBlock = () => {
    const newData = { ...resumeData };
    newData.blocks.push({
      title: '新板块',
      type: 'text',
      data: ''
    });
    onResumeDataChange(newData);
  };

  // Remove block
  // const removeBlock = (blockIndex: number) => {
  //   const newData = { ...resumeData };
  //   newData.blocks.splice(blockIndex, 1);
  //   onResumeDataChange(newData);
  // };

  // Move block
  // const moveBlock = (blockIndex: number, direction: 'up' | 'down') => {
  //   const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
  //   if (newIndex < 0 || newIndex >= resumeData.blocks.length) return;

  //   const newData = { ...resumeData };
  //   [newData.blocks[blockIndex], newData.blocks[newIndex]] = 
  //     [newData.blocks[newIndex], newData.blocks[blockIndex]];
  //   onResumeDataChange(newData);
  // };

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

  // Render editable field
  const renderEditableField = (
    fieldId: string,
    value: string,
    placeholder: string,
    multiline: boolean = false
  ) => {
    const isEditing = editingField === fieldId;
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    if (isEditing) {
      return (
        <div className="flex items-start relative">
          {multiline ? (
            <textarea
              ref={textareaRef}
              defaultValue={editingValueRef.current}
              className="flex-1 min-h-20 p-2 resize-none outline-none bg-gray-100 rounded"
              autoFocus
            />
          ) : (
            <input
              ref={inputRef}
              defaultValue={editingValueRef.current}
              className="flex-1 h-8 px-2 focus:outline-none outline-none bg-gray-100 rounded"
              autoFocus
            />
          )}
          <div className="absolute top-full right-0 bg-white border border-gray-200 rounded-md shadow-lg whitespace-nowrap z-20 flex items-center p-1 gap-1 mt-1">
            <Button 
              size="xs2" 
              variant="none"
              className="bg-green-100 hover:bg-green-200 rounded text-green-700"
              onClick={() => {
                const element = multiline ? textareaRef.current : inputRef.current;
                if (element) saveEdit(fieldId, element);
              }}
            >
              确定
            </Button>
            <Button 
              size="xs2" 
              variant="none" 
              className="bg-red-100 hover:bg-red-200 rounded text-red-700" 
              onClick={cancelEdit}
            >
              取消
            </Button>
          </div>
        </div>
      );
    }

    const content = value || placeholder;
    const baseClasses = multiline ? 'min-h-[2rem] block' : 'min-h-[1.5rem] inline-block';

    return (
      <span 
        className={cn(
          'cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors',
          baseClasses,
          !value ? 'text-gray-400 italic' : ''
        )}
        onClick={() => startEditing(fieldId, value)}
      >
        {content}
      </span>
    );
  };

  // Render list block
  const renderListBlock = (block: ResumeBlock & { data: ResumeBlockListItem[] }, blockIndex: number) => {
    return (
      <div className="space-y-2">
        {block.data.map((item, itemIndex) => (
          <div key={item.id} className="relative group border-l-2 border-gray-200 pl-4">
            {/* List Item Actions - Left side on hover */}
            <div className="absolute -left-8 top-0 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {itemIndex > 0 && (
                <Button
                  size="zero"
                  variant="outline"
                  onClick={() => moveListItem(blockIndex, item.id, 'up')}
                  className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                  title="上移"
                >
                  <ChevronUp size={14} />
                </Button>
              )}
              {itemIndex < block.data.length - 1 && (
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
              )}
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
                  {renderEditableField(
                    `block${blockIndex}-${item.id}-name`,
                    item.name,
                    '如：XX大学、XX公司',
                    false
                  )}
                </h4>
                <p className="text-blue-600 text-sm">
                  {renderEditableField(
                    `block${blockIndex}-${item.id}-highlight`,
                    item.highlight,
                    '亮点/专业/职位',
                    false
                  )}
                </p>
              </div>
              <span className="text-gray-500 text-sm ml-4">
                {renderEditableField(
                  `block${blockIndex}-${item.id}-time`,
                  item.time,
                  '时间',
                  false
                )}
              </span>
            </div>
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line mt-1">
              {renderEditableField(
                `block${blockIndex}-${item.id}-description`,
                item.description,
                '点击添加详细描述...',
                true
              )}
            </div>
          </div>
        ))}
        
        {block.data.length === 0 && (
          <p className="text-gray-500 italic">暂无内容，点击下方按钮添加...</p>
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
        {renderEditableField(
          `block${blockIndex}--data`,
          block.data,
          '点击添加文本内容...',
          true
        )}
      </div>
    );
  };

  // Render personal info block (object type)
  const renderPersonalInfoBlock = (block: ResumeBlock, blockIndex: number) => {
    if (!isObjectBlock(block)) return null;
    
    const { name, email, phone, location, photo } = block.data;
    
    return (
      <div className="border-b-2 border-blue-600 pb-6">
        <div className="flex items-end justify-between gap-6">
          {/* Left side - Personal Info */}
          <div className="flex-1">
            <h1 className="text-3xl text-gray-800 mb-2">
              {renderEditableField(
                `block${blockIndex}--name`,
                name,
                '点击输入姓名',
                false
              )}
            </h1>
            <h2 className="text-xl text-blue-600 mb-4">
              {renderEditableField(
                `block${blockIndex}--title`,
                block.data.title || '',
                '点击输入职位',
                false
              )}
            </h2>
            <div className="flex flex-wrap gap-4 text-gray-600">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                {renderEditableField(
                  `block${blockIndex}--email`,
                  email,
                  '点击输入邮箱',
                  false
                )}
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                {renderEditableField(
                  `block${blockIndex}--phone`,
                  phone,
                  '点击输入电话',
                  false
                )}
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {renderEditableField(
                  `block${blockIndex}--location`,
                  location,
                  '点击输入地址',
                  false
                )}
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
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-400">上传证件照</span>
              </div>
            )}
            <label
              htmlFor={`portrait-upload-${blockIndex}`}
              className="absolute top-0 left-0 w-full h-full bg-gray-500/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-colors"
              title="上传证件照"
            >
              <Upload className="w-6 h-6" />
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

  const personalInfoBlockIndex = resumeData.blocks.findIndex(block => block.type === 'object' && block.title === '个人信息');
  const personalInfoBlock = personalInfoBlockIndex >= 0 ? resumeData.blocks[personalInfoBlockIndex] : null;

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
          {resumeData.blocks.filter(block => block.type !== 'object').map((block, blockIndex) => (
            <div key={blockIndex} className="mb-3 p-4 -m-4 rounded-lg relative group">
              {/* Block Header with left border */}
              <div className="relative mb-2">
                <h3 className="text-lg text-gray-800 border-l-4 border-blue-600 pl-3 inline-block">
                  {renderEditableField(
                    `block${blockIndex}--title`,
                    block.title,
                    '板块标题',
                    false
                  )}
                </h3>
                
                {/* Block Actions - Left side on hover */}
                {/* <div className="absolute -left-10 top-0 flex space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="zero"
                    variant="outline"
                    onClick={() => moveBlock(blockIndex, 'up')}
                    disabled={blockIndex === 0}
                    className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                    title="上移板块"
                  >
                    <ChevronUp size={14} />
                  </Button>
                  <Button
                    size="zero"
                    variant="outline"
                    onClick={() => moveBlock(blockIndex, 'down')}
                    disabled={blockIndex === resumeData.blocks.length - 1}
                    className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                    title="下移板块"
                  >
                    <ChevronDown size={14} />
                  </Button>
                  <Button
                    size="zero"
                    variant="outline"
                    onClick={() => removeBlock(blockIndex)}
                    className="w-6 h-6 p-0 bg-white shadow-sm hover:bg-red-50 hover:text-red-600"
                    title="删除板块"
                  >
                    <Trash2 size={14} />
                  </Button>
                  <button
                    onClick={() => toggleBlockType(blockIndex)}
                    className="w-6 h-6 p-0 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm flex items-center justify-center"
                    title={`切换为${block.type === 'list' ? '文本' : '列表'}类型`}
                  >
                    {block.type === 'list' ? 'L' : 'T'}
                  </button>
                </div> */}
              </div>

              {/* Block Content */}
              {isListBlock(block) && renderListBlock(block, blockIndex)}
              {isTextBlock(block) && renderTextBlock(block, blockIndex)}
            </div>
          ))}

          {/* Add Block Button */}
          <div className="relative group mb-3 p-4 -m-4">
            <h3 className="text-lg text-gray-400 border-l-4 border-gray-300 pl-3 italic">添加新板块...</h3>
            <Button
              size="zero"
              variant="outline"
              onClick={addBlock}
              className="absolute -left-8 top-4 w-6 h-6 p-0 bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 hover:text-blue-600"
              title="添加新板块"
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


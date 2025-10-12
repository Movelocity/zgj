import { useState, useRef } from 'react';
import { Plus, ChevronUp, ChevronDown, Trash2, Upload } from 'lucide-react';
import Button from "@/components/ui/Button";
import type { ResumeBlock, ResumeBlockListItem, ResumeV2Data } from '@/types/resumeV2';
import { isListBlock, isTextBlock, createEmptyListItem } from '@/types/resumeV2';
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
  const [portraitPreview, setPortraitPreview] = useState<string | undefined>(resumeData.portrait_img);

  // Handle portrait image upload
  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Upload to server and get URL
    // For now, create a local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setPortraitPreview(url);
      const newData = { ...resumeData, portrait_img: url };
      onResumeDataChange(newData);
    };
    reader.readAsDataURL(file);
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
  const removeBlock = (blockIndex: number) => {
    const newData = { ...resumeData };
    newData.blocks.splice(blockIndex, 1);
    onResumeDataChange(newData);
  };

  // Move block
  const moveBlock = (blockIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= resumeData.blocks.length) return;

    const newData = { ...resumeData };
    [newData.blocks[blockIndex], newData.blocks[newIndex]] = 
      [newData.blocks[newIndex], newData.blocks[blockIndex]];
    onResumeDataChange(newData);
  };

  // Toggle block type
  const toggleBlockType = (blockIndex: number) => {
    const block = resumeData.blocks[blockIndex];
    const newBlock: ResumeBlock = {
      ...block,
      type: block.type === 'list' ? 'text' : 'list',
      data: block.type === 'list' ? '' : []
    };
    updateBlock(blockIndex, newBlock);
  };

  // Render editable field
  const renderEditableField = (
    fieldId: string,
    value: string,
    placeholder: string,
    multiline: boolean = false
  ) => {
    const isEditing = editingField === fieldId;

    if (isEditing) {
      const Component = multiline ? 'textarea' : 'input';
      return (
        <Component
          autoFocus
          defaultValue={value}
          placeholder={placeholder}
          className={cn(
            "w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
            multiline && "min-h-[60px] resize-vertical"
          )}
          onBlur={(e) => saveEdit(fieldId, e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancelEdit();
            if (e.key === 'Enter' && !multiline && !e.shiftKey) {
              e.preventDefault();
              saveEdit(fieldId, e.currentTarget);
            }
          }}
        />
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors min-h-[28px]"
        onClick={() => startEditing(fieldId, value)}
      >
        {value || <span className="text-gray-400">{placeholder}</span>}
      </div>
    );
  };

  // Render list block
  const renderListBlock = (block: ResumeBlock & { data: ResumeBlockListItem[] }, blockIndex: number) => {
    return (
      <div className="space-y-3">
        {block.data.map((item, itemIndex) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">名称</label>
                  {renderEditableField(
                    `block${blockIndex}-${item.id}-name`,
                    item.name,
                    '如：XX大学、XX公司',
                    false
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">时间</label>
                  {renderEditableField(
                    `block${blockIndex}-${item.id}-time`,
                    item.time,
                    '如：2021.09 - 至今',
                    false
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={() => moveListItem(blockIndex, item.id, 'up')}
                  disabled={itemIndex === 0}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="上移"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveListItem(blockIndex, item.id, 'down')}
                  disabled={itemIndex === block.data.length - 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="下移"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeListItem(blockIndex, item.id)}
                  className="p-1 hover:bg-red-50 text-red-600 rounded"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">描述</label>
                {renderEditableField(
                  `block${blockIndex}-${item.id}-description`,
                  item.description,
                  '详细描述...',
                  true
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">亮点</label>
                {renderEditableField(
                  `block${blockIndex}-${item.id}-highlight`,
                  item.highlight,
                  '核心亮点、技能或成就...',
                  true
                )}
              </div>
            </div>
          </div>
        ))}
        
        <Button
          onClick={() => addListItem(blockIndex)}
          variant="outline"
          className="w-full"
          icon={<Plus className="w-4 h-4 mr-2" />}
        >
          添加项目
        </Button>
      </div>
    );
  };

  // Render text block
  const renderTextBlock = (block: ResumeBlock & { data: string }, blockIndex: number) => {
    return (
      <div>
        {renderEditableField(
          `block${blockIndex}--data`,
          block.data,
          '输入文本内容...',
          true
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      {/* Portrait Image Section */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {portraitPreview ? (
              <img 
                src={portraitPreview} 
                alt="证件照" 
                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePortraitUpload}
              className="hidden"
              id="portrait-upload"
            />
            <label
              htmlFor="portrait-upload"
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" />
            </label>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">证件照</h3>
            <p className="text-xs text-gray-500">建议尺寸：295x413像素</p>
          </div>
        </div>
      </div>

      {/* Blocks Section */}
      <div className="space-y-6">
        {resumeData.blocks.map((block, blockIndex) => (
          <div key={blockIndex} className="border border-gray-200 rounded-lg p-5">
            {/* Block Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1">
                {renderEditableField(
                  `block${blockIndex}--title`,
                  block.title,
                  '板块标题',
                  false
                )}
                <button
                  onClick={() => toggleBlockType(blockIndex)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  title={`切换为${block.type === 'list' ? '文本' : '列表'}类型`}
                >
                  {block.type === 'list' ? '列表' : '文本'}
                </button>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => moveBlock(blockIndex, 'up')}
                  disabled={blockIndex === 0}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="上移板块"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveBlock(blockIndex, 'down')}
                  disabled={blockIndex === resumeData.blocks.length - 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="下移板块"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeBlock(blockIndex)}
                  className="p-1 hover:bg-red-50 text-red-600 rounded"
                  title="删除板块"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Block Content */}
            <div className="mt-4">
              {isListBlock(block) && renderListBlock(block, blockIndex)}
              {isTextBlock(block) && renderTextBlock(block, blockIndex)}
            </div>
          </div>
        ))}

        {/* Add Block Button */}
        <Button
          onClick={addBlock}
          variant="outline"
          className="w-full"
          icon={<Plus className="w-4 h-4 mr-2" />}
        >
          添加新板块
        </Button>
      </div>
    </div>
  );
}


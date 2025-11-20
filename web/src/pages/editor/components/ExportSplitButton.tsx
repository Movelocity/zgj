import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { FiChevronDown, FiFileText, FiImage, FiCheck } from 'react-icons/fi';
import Button from '@/components/ui/Button';

interface ExportSplitButtonProps {
  onTextPdfExport: () => void;
  onImagePdfExport: () => void;
  isExporting?: boolean;
}

export default function ExportSplitButton({
  onTextPdfExport,
  onImagePdfExport,
  isExporting = false,
}: ExportSplitButtonProps) {
  const [open, setOpen] = useState(false);
  const [defaultMethod] = useState<'text' | 'image'>('text'); // 默认使用文字PDF

  const handleMainButtonClick = () => {
    // 主体按钮点击：直接触发默认的文字PDF导出
    onTextPdfExport();
  };

  const handleTextPdfClick = () => {
    setOpen(false);
    onTextPdfExport();
  };

  const handleImagePdfClick = () => {
    setOpen(false);
    onImagePdfExport();
  };

  return (
    <div className="inline-flex">
      {/* Split Button 容器 */}
      <div className="inline-flex rounded-md">
        {/* 主体按钮 */}
        <Button
          onClick={handleMainButtonClick}
          disabled={isExporting}
          variant="outline"
          className="rounded-r-none border-r-0"
        >
          导出PDF
        </Button>

        {/* 角标下拉菜单触发器 */}
        <DropdownMenu.Root open={open} onOpenChange={setOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              disabled={isExporting}
              className="inline-flex items-center px-2 py-2 border border-gray-300 rounded-r-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="导出选项"
            >
              <FiChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
              sideOffset={5}
              align="end"
            >
              {/* 文字PDF选项 */}
              <DropdownMenu.Item
                className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none cursor-pointer"
                onSelect={handleTextPdfClick}
              >
                <FiFileText className="w-4 h-4 mr-3 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium">文字PDF</div>
                  <div className="text-xs text-gray-500">浏览器原生打印</div>
                </div>
                {defaultMethod === 'text' && (
                  <FiCheck className="w-4 h-4 text-blue-600 ml-2" />
                )}
              </DropdownMenu.Item>

              {/* 分隔线 */}
              <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

              {/* 图片PDF选项 */}
              <DropdownMenu.Item
                className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none cursor-pointer"
                onSelect={handleImagePdfClick}
              >
                <FiImage className="w-4 h-4 mr-3 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium">图片PDF</div>
                  <div className="text-xs text-gray-500">保证色彩完全一致</div>
                </div>
                {defaultMethod === 'image' && (
                  <FiCheck className="w-4 h-4 text-blue-600 ml-2" />
                )}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}


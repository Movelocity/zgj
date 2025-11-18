import * as Popover from '@radix-ui/react-popover';
import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import type { FontSettings } from './FontSettingsPanel';

interface FontSettingsDropdownProps {
  fontSettings: FontSettings;
  onFontSettingsChange: (settings: FontSettings) => void;
}

const TITLE_SIZE_PRESETS = {
  small: { label: '小', value: 'text-base' },
  medium: { label: '中', value: 'text-lg' },
  large: { label: '大', value: 'text-xl' },
} as const;

const LABEL_SIZE_PRESETS = {
  small: { label: '小', value: 'text-sm' },
  medium: { label: '中', value: 'text-base' },
  large: { label: '大', value: 'text-lg' },
} as const;

const CONTENT_SIZE_PRESETS = {
  small: { label: '小', value: 'text-sm' },
  medium: { label: '中', value: 'text-base' },
  large: { label: '大', value: 'text-lg' },
} as const;

export default function FontSettingsDropdown({
  fontSettings,
  onFontSettingsChange,
}: FontSettingsDropdownProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpen = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleClose = () => {
    // 延迟关闭，避免鼠标移动到 content 时意外关闭
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 100);
  };

  const handleTitleSizeChange = (size: 'small' | 'medium' | 'large') => {
    onFontSettingsChange({ ...fontSettings, titleSize: size });
  };

  const handleLabelSizeChange = (size: 'small' | 'medium' | 'large') => {
    onFontSettingsChange({ ...fontSettings, labelSize: size });
  };

  const handleContentSizeChange = (size: 'small' | 'medium' | 'large') => {
    onFontSettingsChange({ ...fontSettings, contentSize: size });
  };

  // 清理 timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          title="页面设置"
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          页面
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 max-h-[80vh] overflow-y-auto"
          sideOffset={5}
          align="end"
          side="bottom"
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          <div className="space-y-2">
            {/* 标题 */}
            <div className="pb-2 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">页面设置</h3>
            </div>

            {/* 板块标题字体大小 */}
            <div>
              <div className="mb-2 p-3 bg-gray-50 rounded-lg">
                <p className={`${TITLE_SIZE_PRESETS[fontSettings.titleSize].value} font-semibold text-gray-800`}>
                  板块标题字体大小
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TITLE_SIZE_PRESETS) as Array<keyof typeof TITLE_SIZE_PRESETS>).map((key) => (
                  <Button
                    key={key}
                    onClick={() => handleTitleSizeChange(key)}
                    variant={fontSettings.titleSize === key? "primary": "outline"}
                  >
                    {TITLE_SIZE_PRESETS[key].label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 分类标题字体大小 */}
            <div>
              <div className="mb-2 p-3 bg-gray-50 rounded-lg">
                <p className={`${LABEL_SIZE_PRESETS[fontSettings.labelSize].value} font-medium text-gray-800`}>
                  分类标题预览（如：XX公司）
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(LABEL_SIZE_PRESETS) as Array<keyof typeof LABEL_SIZE_PRESETS>).map((key) => (
                  <Button
                    key={key}
                    onClick={() => handleLabelSizeChange(key)}
                    variant={fontSettings.labelSize === key? "primary": "outline"}
                  >
                    {LABEL_SIZE_PRESETS[key].label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 内容字体大小 */}
            <div>
              <div className="mb-2 p-3 bg-gray-50 rounded-lg">
                <p className={`${CONTENT_SIZE_PRESETS[fontSettings.contentSize].value} text-gray-700`}>
                  这是内容文字的预览示例，您可以查看不同字体大小的效果。
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CONTENT_SIZE_PRESETS) as Array<keyof typeof CONTENT_SIZE_PRESETS>).map((key) => (
                  <Button
                    key={key}
                    onClick={() => handleContentSizeChange(key)}
                    variant={fontSettings.contentSize === key? "primary": "outline"}
                  >
                    {CONTENT_SIZE_PRESETS[key].label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 使用说明 */}
            <div className="pt-2 border-t border-gray-200">
              <ul className="text-xs text-gray-600 space-y-1.5">
                <li>• 板块标题：用于简历大板块标题（如：工作经历、教育背景）</li>
                <li>• 分类标题：用于每个板块内的小标题（如：公司名、学校名）</li>
                <li>• 内容字体：用于简历正文内容</li>
                <li>• 设置会立即应用到简历预览</li>
              </ul>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}


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
  tiny: { label: '极小', value: 'text-xs' },
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

  const handleContentSizeChange = (size: 'tiny' | 'small' | 'medium' | 'large') => {
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
          页面设置
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 max-h-[80vh] overflow-y-auto"
          sideOffset={5}
          align="end"
          side="bottom"
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          <div className="space-y-2">

            {/* 板块标题字体大小 */}
            <div>
              <div className="mb-2">
                板块标题尺寸
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TITLE_SIZE_PRESETS) as Array<keyof typeof TITLE_SIZE_PRESETS>).map((key) => (
                  <Button
                    key={key}
                    size="sm"
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
              <div className="mb-2">
                分类标题尺寸
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(LABEL_SIZE_PRESETS) as Array<keyof typeof LABEL_SIZE_PRESETS>).map((key) => (
                  <Button
                    key={key}
                    size="sm"
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
              <div className="mb-2">
                内容文字尺寸
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CONTENT_SIZE_PRESETS) as Array<keyof typeof CONTENT_SIZE_PRESETS>).map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    onClick={() => handleContentSizeChange(key)}
                    variant={fontSettings.contentSize === key? "primary": "outline"}
                  >
                    {CONTENT_SIZE_PRESETS[key].label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}


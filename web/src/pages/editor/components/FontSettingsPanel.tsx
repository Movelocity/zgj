import { X } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface FontSettings {
  titleSize: 'small' | 'medium' | 'large';
  labelSize: 'small' | 'medium' | 'large';
  contentSize: 'small' | 'medium' | 'large';
}

interface FontSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function FontSettingsPanel({
  isOpen,
  onClose,
  fontSettings,
  onFontSettingsChange,
}: FontSettingsPanelProps) {
  if (!isOpen) return null;

  const handleTitleSizeChange = (size: 'small' | 'medium' | 'large') => {
    onFontSettingsChange({ ...fontSettings, titleSize: size });
  };

  const handleLabelSizeChange = (size: 'small' | 'medium' | 'large') => {
    onFontSettingsChange({ ...fontSettings, labelSize: size });
  };

  const handleContentSizeChange = (size: 'small' | 'medium' | 'large') => {
    onFontSettingsChange({ ...fontSettings, contentSize: size });
  };

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* 右侧面板 */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">页面设置</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              title="关闭"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {/* 板块标题字体大小 */}
            <div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className={`${TITLE_SIZE_PRESETS[fontSettings.titleSize].value} font-semibold text-gray-800`}>
                  板块标题字体大小
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TITLE_SIZE_PRESETS) as Array<keyof typeof TITLE_SIZE_PRESETS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleTitleSizeChange(key)}
                    className={`px-2 py-1 rounded-lg border transition-all ${
                      fontSettings.titleSize === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {TITLE_SIZE_PRESETS[key].label}
                  </button>
                ))}
              </div>
              
            </div>

            {/* 分类标题字体大小 */}
            <div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className={`${LABEL_SIZE_PRESETS[fontSettings.labelSize].value} font-medium text-gray-800`}> 
                  分类标题预览（如：XX公司）
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(LABEL_SIZE_PRESETS) as Array<keyof typeof LABEL_SIZE_PRESETS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleLabelSizeChange(key)}
                    className={`px-2 py-1 rounded-lg border transition-all ${
                      fontSettings.labelSize === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {LABEL_SIZE_PRESETS[key].label}
                  </button>
                ))}
              </div>
              
            </div>

            {/* 内容字体大小 */}
            <div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className={`${CONTENT_SIZE_PRESETS[fontSettings.contentSize].value} text-gray-700`}>
                  这是内容文字的预览示例，您可以查看不同字体大小的效果。
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CONTENT_SIZE_PRESETS) as Array<keyof typeof CONTENT_SIZE_PRESETS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleContentSizeChange(key)}
                    className={`px-2 py-1 rounded-lg border transition-all ${
                      fontSettings.contentSize === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {CONTENT_SIZE_PRESETS[key].label}
                  </button>
                ))}
              </div>
             
            </div>

            {/* 使用说明 */}
            <div className="pt-4 border-t border-gray-200">
              <ul className="text-xs text-gray-600 space-y-1.5">
                <li>• 板块标题：用于简历大板块标题（如：工作经历、教育背景）</li>
                <li>• 分类标题：用于每个板块内的小标题（如：公司名、学校名）</li>
                <li>• 内容字体：用于简历正文内容</li>
                <li>• 设置会立即应用到简历预览</li>
              </ul>
            </div>
          </div>

          {/* 底部操作区 */}
          <div className="px-6 py-4 border-t border-gray-200">
            <Button
              onClick={onClose}
              className="w-full"
            >
              完成
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// 导出字体大小样式映射，供其他组件使用
export const getFontSizeClasses = (settings: FontSettings) => {
  return {
    title: TITLE_SIZE_PRESETS[settings.titleSize].value,
    label: LABEL_SIZE_PRESETS[settings.labelSize].value,
    content: CONTENT_SIZE_PRESETS[settings.contentSize].value,
  };
};


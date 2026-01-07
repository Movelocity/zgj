import { useState } from 'react';
import { Target, Briefcase, FileText, Globe } from 'lucide-react';

export type TargetType = 'jd' | 'normal' | 'foreign';

interface TargetOption {
  value: TargetType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const targetOptions: TargetOption[] = [
  {
    value: 'normal',
    label: '常规优化',
    description: '全面提升简历质量，优化表达和格式',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    value: 'jd',
    label: '职位匹配',
    description: '根据职位描述优化简历，提高匹配度',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    value: 'foreign',
    label: '英文简历',
    description: '优化简历英文表达，符合外企标准',
    icon: <Globe className="w-5 h-5" />,
  },
];

interface TargetSelectorProps {
  currentTarget: TargetType;
  onTargetChange: (target: TargetType) => void;
}

export default function TargetSelector({ currentTarget, onTargetChange }: TargetSelectorProps) {
  const [selectedTarget, setSelectedTarget] = useState<TargetType>(currentTarget);

  const handleSelectTarget = (target: TargetType) => {
    setSelectedTarget(target);
    onTargetChange(target);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 text-gray-700">
          <Target className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold">选择优化目标</h3>
        </div>
        <p className="text-sm text-gray-500">
          根据您的需求选择合适的优化方向
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full max-w-md">
        {targetOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelectTarget(option.value)}
            className={`
              relative flex items-start gap-3 p-4 rounded-lg border transition-all
              hover:shadow-md hover:scale-[1.02] cursor-pointer
              ${
                selectedTarget === option.value
                  ? 'border-blue-200 bg-blue-50/50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }
            `}
          >
            <div
              className={`
                flex-shrink-0 p-2 rounded-lg
                ${
                  selectedTarget === option.value
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }
              `}
            >
              {option.icon}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between mb-1">
                <h4
                  className={`
                    font-semibold text-sm
                    ${
                      selectedTarget === option.value
                        ? 'text-blue-700'
                        : 'text-gray-800'
                    }
                  `}
                >
                  {option.label}
                </h4>
                {selectedTarget === option.value && (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-400 text-center">
        您可以随时通过与AI对话来优化简历
      </div>
    </div>
  );
}


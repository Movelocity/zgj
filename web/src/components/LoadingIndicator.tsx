import { FiCheckCircle } from 'react-icons/fi';

export interface LoadingStage {
  key: string;
  label: string;
  order: number; // 显示顺序
}

export interface LoadingIndicatorProps {
  /** 所有步骤配置 */
  stages: LoadingStage[];
  /** 当前正在处理的阶段 */
  currentStage: string;
  /** 进度百分比 (0-100) */
  progress: number;
  /** 进度文本提示 */
  progressText?: string;
  /** 是否显示完成状态 */
  showCompleted?: boolean;
  /** 主标题 */
  title?: string;
}

/**
 * 加载指示器组件
 * 用于显示多步骤处理的进度和状态
 */
export default function LoadingIndicator({
  stages,
  currentStage,
  progressText,
  progress,
  showCompleted = false,
  title = '正在处理您的简历',
}: LoadingIndicatorProps) {
  /**
   * 获取步骤的状态
   * @param stage 步骤信息
   * @returns 'pending' | 'active' | 'completed'
   */
  const getStageStatus = (stage: LoadingStage): 'pending' | 'active' | 'completed' => {
    if (!currentStage) return 'pending';
    
    const currentOrder = stages.find(s => s.key === currentStage)?.order ?? -1;
    
    if (stage.key === currentStage) {
      return 'active';
    }
    
    if (stage.order < currentOrder) {
      return 'completed';
    }
    
    // 特殊处理：如果当前阶段是 'completed'，所有步骤都标记为完成
    if (currentStage === 'completed') {
      return 'completed';
    }
    
    return 'pending';
  };

  /**
   * 获取步骤的样式类
   */
  const getStageClassName = (status: 'pending' | 'active' | 'completed'): string => {
    switch (status) {
      case 'active':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'pending':
      default:
        return 'text-gray-400';
    }
  };

  /**
   * 获取步骤圆圈的样式类
   */
  const getStageCircleClassName = (status: 'pending' | 'active' | 'completed'): string => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 border-2 border-blue-600';
      case 'completed':
        return 'bg-green-100 border-2 border-green-600';
      case 'pending':
      default:
        return 'bg-gray-100 border-2 border-gray-300';
    }
  };

  return (
    <div className="flex justify-center items-center h-full w-full">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4">
        {!showCompleted ? (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">{title}</h3>
            </div>
            
            {/* 步骤指示器 */}
            <div className="space-y-3">
              {stages.map((stage) => {
                const status = getStageStatus(stage);
                return (
                  <div
                    key={stage.key}
                    className={`flex items-center space-x-3 ${getStageClassName(status)}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getStageCircleClassName(status)}`}>
                      {status === 'completed' ? '✓' : stage.order}
                    </div>
                    <span className="text-sm font-medium">{stage.label}</span>
                  </div>
                );
              })}
            </div>
            
            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-6">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {/* 当前处理步骤文本 */}
            {progressText && (
              <div className="text-center mt-4">
                {/* <p className="text-sm text-blue-600 font-medium">{progressText}</p> */}
                <p className="text-xs text-gray-500 mt-1">{progress}% 完成</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-medium">处理完成！</h3>
          </div>
        )}
      </div>
    </div>
  );
}


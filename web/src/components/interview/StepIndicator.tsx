/**
 * Step Indicator Component
 * Displays horizontal progress indicator for multi-step workflow
 */

import { FiCheck } from 'react-icons/fi';
import type { WorkflowStep } from '@/types/interview';

interface StepIndicatorProps {
  steps: WorkflowStep[];
  currentStep: number; // 1-based index
  completedSteps: string[]; // Array of completed step keys
  onStepClick?: (stepIndex: number) => void;
  canNavigateBack?: boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  canNavigateBack = true,
}) => {
  const getStepStatus = (index: number, stepKey: string): 'completed' | 'active' | 'pending' => {
    if (completedSteps.includes(stepKey)) return 'completed';
    if (index + 1 === currentStep) return 'active';
    return 'pending';
  };

  const getStepColor = (status: 'completed' | 'active' | 'pending') => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'active':
        return 'bg-blue-500 text-white';
      case 'pending':
        return 'bg-gray-300 text-gray-600';
    }
  };

  const getLineColor = (status: 'completed' | 'active' | 'pending') => {
    return status === 'completed' ? 'bg-green-500' : 'bg-gray-300';
  };

  const handleStepClick = (index: number, stepKey: string) => {
    if (!canNavigateBack || !onStepClick) return;
    
    // Only allow navigating to completed steps or current step
    if (completedSteps.includes(stepKey) || index + 1 === currentStep) {
      onStepClick(index + 1);
    }
  };

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(index, step.key);
          const isClickable = canNavigateBack && (completedSteps.includes(step.key) || index + 1 === currentStep);
          
          return (
            <div key={step.key} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleStepClick(index, step.key)}
                  disabled={!isClickable}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                    transition-all duration-200
                    ${getStepColor(status)}
                    ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                  `}
                  aria-label={`步骤 ${index + 1}: ${step.label}`}
                  aria-current={status === 'active' ? 'step' : undefined}
                >
                  {status === 'completed' ? (
                    <FiCheck className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                
                {/* Step Label */}
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${
                    status === 'active' ? 'text-blue-600' : 
                    status === 'completed' ? 'text-green-600' : 
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-400 mt-1 max-w-[100px]">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Connecting Line (not for last step) */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 h-1 rounded transition-all duration-300"
                  style={{
                    background: status === 'completed' ? '#10b981' : '#d1d5db'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;

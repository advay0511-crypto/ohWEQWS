import React from 'react';
import { Check } from 'lucide-react';

export interface StepIndicatorProps {
  steps: {
    number: number;
    title: string;
    description?: string;
  }[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStepIndex,
  onStepClick,
  orientation = 'horizontal',
  className = '',
}) => {
  if (orientation === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isClickable = !!onStepClick && idx <= currentStepIndex;

          return (
            <div
              key={step.number}
              onClick={() => isClickable && onStepClick(idx)}
              className={`flex items-start gap-3 relative ${
                isClickable ? 'cursor-pointer group' : ''
              }`}
            >
              {/* Connector line for all except last */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-3.5 top-8 w-0.5 bottom-[-16px] -translate-x-1/2 transition-colors ${
                    isDone ? 'bg-[#42D6AE]' : 'bg-[#49AABE]/25'
                  }`}
                />
              )}

              {/* Number circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-mono font-bold transition-all z-10 ${
                  isDone
                    ? 'bg-[#42D6AE] text-[#031923] shadow-[0_0_10px_rgba(66,214,174,0.4)]'
                    : isCurrent
                    ? 'bg-[#041E2B] border-2 border-[#42D6AE] text-[#42D6AE] shadow-[0_0_12px_rgba(66,214,174,0.3)]'
                    : 'bg-[#031923] border border-[#49AABE]/30 text-[#718D9A]'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.number}
              </div>

              <div className="space-y-0.5 min-w-0">
                <div
                  className={`text-xs font-bold leading-tight transition-colors ${
                    isCurrent ? 'text-[#42D6AE]' : isDone ? 'text-[#F0F7FA]' : 'text-[#A7C0CC]'
                  }`}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-[11px] text-[#718D9A] leading-snug truncate">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={`w-full flex items-center justify-between ${className}`}>
      {steps.map((step, idx) => {
        const isDone = idx < currentStepIndex;
        const isCurrent = idx === currentStepIndex;
        const isClickable = !!onStepClick && idx <= currentStepIndex;

        return (
          <React.Fragment key={step.number}>
            <div
              onClick={() => isClickable && onStepClick(idx)}
              className={`flex items-center gap-2 ${isClickable ? 'cursor-pointer' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  isDone
                    ? 'bg-[#42D6AE] text-[#031923]'
                    : isCurrent
                    ? 'bg-[#041E2B] border border-[#42D6AE] text-[#42D6AE] ring-2 ring-[#42D6AE]/20'
                    : 'bg-[#031923] border border-[#49AABE]/30 text-[#718D9A]'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.number}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isCurrent ? 'text-[#42D6AE] font-bold' : isDone ? 'text-[#F0F7FA]' : 'text-[#718D9A]'
                }`}
              >
                {step.title}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`flex-1 mx-2 h-0.5 transition-colors ${
                  isDone ? 'bg-[#42D6AE]' : 'bg-[#49AABE]/25'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

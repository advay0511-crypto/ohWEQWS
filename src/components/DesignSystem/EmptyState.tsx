import React from 'react';
import { Sprout } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-2xl bg-[#041E2B]/60 backdrop-blur-md border border-[#49AABE]/25 flex flex-col items-center justify-center max-w-md mx-auto space-y-4 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#42D6AE]/10 border border-[#42D6AE]/25 flex items-center justify-center text-[#42D6AE]">
        {icon || <Sprout className="w-7 h-7" />}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-[#F0F7FA] tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#A7C0CC] leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <PrimaryButton onClick={onAction} size="md">
            {actionLabel}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
};

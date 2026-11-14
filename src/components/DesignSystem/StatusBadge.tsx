import React from 'react';

export interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'info' | 'neutral' | 'accent';
  pulse?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'success',
  pulse = true,
  className = '',
  size = 'md',
}) => {
  const styles = {
    success: {
      bg: 'bg-[#42D6AE]/10 border-[#42D6AE]/30 text-[#42D6AE]',
      dot: 'bg-[#42D6AE]',
    },
    warning: {
      bg: 'bg-amber-400/10 border-amber-400/30 text-amber-300',
      dot: 'bg-amber-400',
    },
    info: {
      bg: 'bg-[#3BD9C2]/10 border-[#3BD9C2]/30 text-[#3BD9C2]',
      dot: 'bg-[#3BD9C2]',
    },
    neutral: {
      bg: 'bg-[#718D9A]/15 border-[#718D9A]/30 text-[#A7C0CC]',
      dot: 'bg-[#A7C0CC]',
    },
    accent: {
      bg: 'bg-[#49AABE]/15 border-[#49AABE]/35 text-[#F0F7FA]',
      dot: 'bg-[#49AABE]',
    },
  };

  const current = styles[variant];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border font-mono ${current.bg} ${sizeClasses} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${current.dot} ${pulse ? 'animate-pulse' : ''}`}
      />
      <span>{label}</span>
    </span>
  );
};

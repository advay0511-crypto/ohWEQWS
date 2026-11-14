import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  icon,
  isLoading = false,
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-9 px-3.5 text-xs',
    md: 'h-[42px] px-5 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg cursor-pointer transition-all duration-200
        bg-[#041E2B]/60 backdrop-blur-md border border-[#49AABE]/35 text-[#F0F7FA]
        hover:bg-[#49AABE]/15 hover:border-[#3BD9C2] hover:text-white hover:-translate-y-0.5 active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
        ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-[#3BD9C2]" />
      ) : icon ? (
        icon
      ) : null}
      <span>{children}</span>
    </button>
  );
};

import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  showArrow?: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  icon,
  showArrow = false,
  isLoading = false,
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-9 px-3.5 text-xs tracking-wide',
    md: 'h-[42px] px-5 text-sm tracking-wide',
    lg: 'h-12 px-6 text-base tracking-wide',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 font-bold rounded-lg cursor-pointer transition-all duration-200 
        bg-gradient-to-r from-[#52DDB6] to-[#42D6AE] text-[#031923] shadow-md shadow-[#42D6AE]/20
        hover:brightness-105 hover:shadow-lg hover:shadow-[#42D6AE]/30 hover:-translate-y-0.5 active:translate-y-0 active:brightness-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
        ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-[#031923]" />
      ) : icon ? (
        icon
      ) : null}
      <span>{children}</span>
      {showArrow && !isLoading && <ArrowRight className="w-4 h-4 ml-0.5 stroke-[2.5]" />}
    </button>
  );
};

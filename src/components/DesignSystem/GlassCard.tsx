import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'elevated' | 'dashed' | 'interactive' | 'ai';
  aiData?: boolean;
  className?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  aiData = false,
  className = '',
  glow = false,
  ...props
}) => {
  let baseStyle = 'rounded-2xl transition-all duration-200 ';

  // If card uses AI data or has variant='ai', use the canonical gradient transparent look with glowing teal accent border
  if (aiData || variant === 'ai') {
    baseStyle +=
      'bg-gradient-to-br from-[#27D7B2]/[0.18] via-[#12887A]/[0.10] to-[#04141A]/[0.42] backdrop-blur-md border border-[#27D7B2]/40 shadow-[0_0_24px_rgba(39,215,178,0.14)] text-[#F0F7FA] ';
  } else {
    // Canonical transparent gradient card look for every variant
    switch (variant) {
      case 'subtle':
        baseStyle +=
          'bg-gradient-to-br from-[#27D7B2]/[0.10] via-[#12887A]/[0.06] to-[#04141A]/[0.32] backdrop-blur-md border border-white/[0.10] text-[#F0F7FA] shadow-md ';
        break;
      case 'dashed':
        baseStyle +=
          'bg-gradient-to-br from-[#27D7B2]/[0.10] via-[#12887A]/[0.06] to-[#04141A]/[0.32] backdrop-blur-sm border-1.5 border-dashed border-white/[0.18] hover:border-[#27D7B2]/50 hover:from-[#27D7B2]/[0.18] text-[#F0F7FA] ';
        break;
      case 'interactive':
        baseStyle +=
          'bg-gradient-to-br from-[#27D7B2]/[0.14] via-[#12887A]/[0.08] to-[#04141A]/[0.38] backdrop-blur-md border border-white/[0.14] hover:border-[#27D7B2]/50 hover:from-[#27D7B2]/[0.22] hover:-translate-y-0.5 cursor-pointer text-[#F0F7FA] shadow-lg hover:shadow-[0_0_25px_rgba(39,215,178,0.20)] ';
        break;
      case 'elevated':
      case 'default':
      default:
        baseStyle +=
          'bg-gradient-to-br from-[#27D7B2]/[0.14] via-[#12887A]/[0.08] to-[#04141A]/[0.38] backdrop-blur-md border border-white/[0.14] text-[#F0F7FA] shadow-lg ';
        break;
    }
  }

  if (glow) {
    baseStyle +=
      'relative before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-r before:from-[#27D7B2]/15 before:to-[#3BD9C2]/15 before:-z-10 before:blur-sm ';
  }

  return (
    <div className={`${baseStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};

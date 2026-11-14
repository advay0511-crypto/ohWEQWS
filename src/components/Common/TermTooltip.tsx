import React from 'react';

export interface TermTooltipProps {
  term: string;
  definition: string;
  className?: string;
  children?: React.ReactNode;
}

export const TermTooltip: React.FC<TermTooltipProps> = ({
  term,
  definition,
  className = '',
  children,
}) => {
  return (
    <span className={`inline-flex items-center gap-1 group/tooltip relative cursor-help ${className}`}>
      {children ? children : <span className="font-semibold text-white">{term}</span>}
      <span className="w-3.5 h-3.5 rounded-full bg-[#27D7B2]/20 hover:bg-[#27D7B2]/40 text-[#27D7B2] inline-flex items-center justify-center text-[10px] font-bold font-mono transition-colors shrink-0">
        i
      </span>
      {/* Tooltip Popup */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-56 sm:w-64 p-2.5 rounded-xl bg-[#020A10] border border-[#27D7B2]/50 text-xs text-[#E1EDF2] shadow-2xl z-50 pointer-events-none text-left">
        <span className="block font-bold text-[#27D7B2] font-mono mb-1">{term}</span>
        <span className="block text-[11px] text-[#A7C0CC] leading-relaxed">{definition}</span>
      </span>
    </span>
  );
};

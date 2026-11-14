import React from 'react';
import { HelpCircle } from 'lucide-react';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onOpenGuide?: () => void;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  actions,
  onOpenGuide,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27D7B2]/25 ${className}`}
    >
      <div className="space-y-1">
        {eyebrow && (
          <div className="text-xs sm:text-sm font-mono uppercase tracking-[0.25em] text-[#27D7B2] font-black">
            {eyebrow}
          </div>
        )}
        <div className="flex items-center gap-3.5">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {title}
          </h1>
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#041E2B]/80 backdrop-blur-md border border-[#27D7B2]/40 hover:border-[#27D7B2] text-[#27D7B2] hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer group"
              title="What is on this page? (?)"
              aria-label="Open Page Guide"
            >
              <HelpCircle className="w-4 h-4 text-[#27D7B2] group-hover:scale-110 transition-transform" />
              <span>Page Guide</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#27D7B2] animate-pulse" />
            </button>
          )}
        </div>
        {subtitle && (
          <p className="text-sm sm:text-base text-[#A7C0CC] max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {(actions || onOpenGuide) && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
          {!actions && onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#041E2B] border border-[#27D7B2]/50 hover:border-[#27D7B2] text-[#27D7B2] hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Page Guide (?)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

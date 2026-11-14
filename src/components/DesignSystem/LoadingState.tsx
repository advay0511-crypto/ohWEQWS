import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  title?: string;
  subtitle?: string;
  progress?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Retrieving NASA Earth Observation Data...',
  subtitle = 'Fetching MODIS surface reflectance, precipitation, and soil moisture grids.',
  progress,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-2xl bg-[#041E2B]/70 backdrop-blur-md border border-[#49AABE]/25 flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 ${className}`}
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-[#49AABE]/20 border-t-[#42D6AE] animate-spin flex items-center justify-center" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#3BD9C2] animate-ping" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-[#F0F7FA] tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#A7C0CC] leading-relaxed">
          {subtitle}
        </p>
      </div>

      {typeof progress === 'number' && (
        <div className="w-full max-w-xs space-y-1 pt-2">
          <div className="flex justify-between text-[11px] font-mono text-[#A7C0CC]">
            <span>Processing</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#031923] overflow-hidden border border-[#49AABE]/20">
            <div
              className="h-full bg-gradient-to-r from-[#52DDB6] to-[#42D6AE] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

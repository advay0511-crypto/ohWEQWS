import React from 'react';
import { GlassCard } from './GlassCard';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  legend?: { label: string; color: string }[];
  children: React.ReactNode;
  actions?: React.ReactNode;
  provenance?: string;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  legend,
  children,
  actions,
  provenance,
  className = '',
}) => {
  return (
    <GlassCard variant="default" className={`p-5 space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#49AABE]/15">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#F0F7FA] tracking-tight">
              {title}
            </h3>
            {provenance && (
              <span className="text-[10px] font-mono text-[#42D6AE] bg-[#42D6AE]/10 border border-[#42D6AE]/25 px-1.5 py-0.5 rounded">
                {provenance}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[#A7C0CC] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {legend && (
            <div className="flex items-center gap-3 text-xs text-[#A7C0CC] font-mono">
              {legend.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {actions && <div>{actions}</div>}
        </div>
      </div>

      <div className="w-full overflow-hidden">
        {children}
      </div>
    </GlassCard>
  );
};

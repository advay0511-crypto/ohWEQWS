import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GlassCard } from './GlassCard';

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  icon?: React.ReactNode;
  provenance?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  change,
  trend,
  subtitle,
  icon,
  provenance,
  className = '',
}) => {
  return (
    <GlassCard variant="default" className={`p-4 space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#A7C0CC]">
          {title}
        </span>
        {icon && (
          <div className="text-[#42D6AE] p-1 rounded-md bg-[#42D6AE]/10 border border-[#42D6AE]/20">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#F0F7FA] font-sans tracking-tight tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-[#A7C0CC]">
            {unit}
          </span>
        )}
      </div>

      {(trend || subtitle || provenance) && (
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#49AABE]/15 text-[11px]">
          {trend && change && (
            <span
              className={`flex items-center gap-1 font-mono font-medium ${
                trend === 'up'
                  ? 'text-[#42D6AE]'
                  : trend === 'down'
                  ? 'text-amber-400'
                  : 'text-[#A7C0CC]'
              }`}
            >
              {trend === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : trend === 'down' ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {change}
            </span>
          )}

          {subtitle && (
            <span className="text-[#718D9A] truncate">
              {subtitle}
            </span>
          )}

          {provenance && (
            <span className="font-mono text-[10px] text-[#49AABE] bg-[#49AABE]/10 px-1.5 py-0.5 rounded border border-[#49AABE]/25 ml-auto">
              {provenance}
            </span>
          )}
        </div>
      )}
    </GlassCard>
  );
};

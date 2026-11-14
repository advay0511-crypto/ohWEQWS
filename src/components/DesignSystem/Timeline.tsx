import React from 'react';

export interface TimelineItem {
  id: string;
  seasonOrDate: string;
  title: string;
  description?: string;
  badge?: string;
  status?: 'completed' | 'active' | 'upcoming';
  metrics?: { label: string; value: string }[];
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  return (
    <div className={`relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#49AABE]/25 ${className}`}>
      {items.map((item) => {
        const isActive = item.status === 'active';
        const isCompleted = item.status === 'completed';

        return (
          <div key={item.id} className="relative group">
            {/* Timeline node icon */}
            <div
              className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                isActive
                  ? 'bg-[#42D6AE] border-[#42D6AE] shadow-[0_0_10px_#42D6AE]'
                  : isCompleted
                  ? 'bg-[#3BD9C2] border-[#3BD9C2]'
                  : 'bg-[#031923] border-[#49AABE]/50'
              }`}
            />

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#42D6AE] uppercase tracking-wider">
                  {item.seasonOrDate}
                </span>
                {item.badge && (
                  <span className="text-[10px] font-mono bg-[#49AABE]/15 border border-[#49AABE]/30 text-[#F0F7FA] px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </div>

              <div className="text-sm font-bold text-[#F0F7FA]">
                {item.title}
              </div>

              {item.description && (
                <div className="text-xs text-[#A7C0CC] leading-relaxed">
                  {item.description}
                </div>
              )}

              {item.metrics && item.metrics.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {item.metrics.map((m, mIdx) => (
                    <div
                      key={mIdx}
                      className="px-2 py-1 rounded bg-[#031923]/60 border border-[#49AABE]/20 text-[11px] font-mono text-[#A7C0CC]"
                    >
                      <span className="text-[#718D9A] mr-1.5">{m.label}:</span>
                      <span className="text-[#F0F7FA] font-bold">{m.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

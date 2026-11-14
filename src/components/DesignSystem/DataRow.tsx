import React from 'react';

export interface DataRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
  isLast?: boolean;
  className?: string;
}

export const DataRow: React.FC<DataRowProps> = ({
  label,
  value,
  icon,
  hint,
  isLast = false,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between py-2.5 text-xs ${
        !isLast ? 'border-b border-[#49AABE]/15' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-2 text-[#A7C0CC]">
        {icon && <span className="text-[#42D6AE] shrink-0">{icon}</span>}
        <span className="font-medium">{label}</span>
        {hint && (
          <span className="text-[10px] text-[#718D9A] hidden sm:inline">
            ({hint})
          </span>
        )}
      </div>

      <div className="font-semibold text-[#F0F7FA] font-mono text-right tabular-nums">
        {value}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Shield, Info } from 'lucide-react';
import { ConfidenceLevel } from '../../types';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  score?: number; // 0 - 1
  onClickDetail?: () => void;
  className?: string;
  showInfoTrigger?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  level,
  score,
  onClickDetail,
  className = '',
  showInfoTrigger = true,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  let colorClass = 'text-[#4ADE80] border-emerald-500/20 bg-emerald-500/10';
  let Icon = ShieldCheck;
  let description =
    'High confidence: grounded in 30+ years of satellite observations, verified soil profile, and complete crop history.';

  if (level === 'Moderate') {
    colorClass = 'text-[#FBBF24] border-amber-500/20 bg-amber-500/10';
    Icon = ShieldAlert;
    description =
      'Moderate confidence: reliable climate records, but some soil or crop history values use regional satellite estimates.';
  } else if (level === 'Limited') {
    colorClass = 'text-[#FB7185] border-rose-500/20 bg-rose-500/10';
    Icon = Shield;
    description =
      'Limited confidence: preliminary suggestion. Critical inputs (like soil texture or recent crop history) are unconfirmed.';
  }

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (onClickDetail) onClickDetail();
          else setShowTooltip(!showTooltip);
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-all hover:brightness-110 ${colorClass}`}
        aria-label={`Confidence level: ${level}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{level} Confidence</span>
        {score != null && (
          <span className="opacity-75 font-mono text-[11px]">({Math.round(score * 100)}%)</span>
        )}
        {showInfoTrigger && <Info className="w-3 h-3 opacity-60 ml-0.5" />}
      </button>

      {/* Hover / tap tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute z-40 left-0 top-full mt-1.5 w-64 p-2.5 text-xs text-slate-200 bg-slate-900/95 border border-slate-700/80 rounded-lg shadow-xl backdrop-blur-md pointer-events-none"
        >
          <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" />
            {level} Confidence Engine
          </div>
          <p className="text-slate-300 leading-relaxed">{description}</p>
          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[11px] text-slate-400">
            Never faking precision · Click for full evidence
          </div>
        </div>
      )}
    </div>
  );
};

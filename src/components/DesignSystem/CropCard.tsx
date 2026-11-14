import React from 'react';
import { Sprout, Droplets, Leaf } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { StatusBadge } from './StatusBadge';

export interface CropCardProps {
  name: string;
  family: string;
  season?: string;
  waterNeed?: 'Low' | 'Moderate' | 'High';
  nitrogenRole?: 'Fixer' | 'Consumer' | 'Neutral' | 'Restorative';
  suitabilityScore?: number;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export const CropCard: React.FC<CropCardProps> = ({
  name,
  family,
  season,
  waterNeed = 'Moderate',
  nitrogenRole = 'Consumer',
  suitabilityScore,
  isSelected = false,
  onSelect,
  className = '',
}) => {
  return (
    <GlassCard
      variant={isSelected ? 'elevated' : 'interactive'}
      onClick={onSelect}
      className={`p-3.5 space-y-2.5 transition-all ${
        isSelected
          ? 'border-[#42D6AE] ring-1 ring-[#42D6AE]/40'
          : 'border-[#49AABE]/25'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#42D6AE]/10 border border-[#42D6AE]/25 flex items-center justify-center text-[#42D6AE] shrink-0">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#F0F7FA] tracking-tight">
              {name}
            </h4>
            <p className="text-[11px] text-[#A7C0CC]">
              {family} {season ? `• ${season}` : ''}
            </p>
          </div>
        </div>

        {typeof suitabilityScore === 'number' && (
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-[#42D6AE]">
              {Math.round(suitabilityScore)}%
            </div>
            <div className="text-[9px] font-mono text-[#718D9A]">
              Match
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#49AABE]/15">
        <div className="flex items-center gap-1 text-[#A7C0CC]">
          <Droplets className="w-3.5 h-3.5 text-[#3BD9C2]" />
          <span>Water: {waterNeed}</span>
        </div>

        <div className="flex items-center gap-1">
          <Leaf className="w-3 h-3 text-[#42D6AE]" />
          <StatusBadge
            label={nitrogenRole}
            variant={nitrogenRole === 'Fixer' ? 'success' : 'accent'}
            pulse={false}
            size="sm"
          />
        </div>
      </div>
    </GlassCard>
  );
};

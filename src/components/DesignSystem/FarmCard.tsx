import React from 'react';
import { MapPin, ChevronRight, Plus } from 'lucide-react';
import { FarmThumbnail } from './FarmThumbnail';
import { StatusBadge } from './StatusBadge';

export interface FarmCardProps {
  id?: string;
  name: string;
  location: string;
  areaHa?: number | string;
  lastAnalysisText?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  isAddCard?: boolean;
  onSelect?: () => void;
  onAddNew?: () => void;
  className?: string;
}

export const FarmCard: React.FC<FarmCardProps> = ({
  name,
  location,
  areaHa = '32.5 ha',
  lastAnalysisText = 'Last analysis: 2 days ago',
  thumbnailUrl,
  isActive = false,
  isAddCard = false,
  onSelect,
  onAddNew,
  className = '',
}) => {
  if (isAddCard) {
    return (
      <button
        type="button"
        onClick={onAddNew}
        className={`w-full p-4 rounded-xl bg-[#041E2B]/40 backdrop-blur-sm border-1.5 border-dashed border-[#49AABE]/35 hover:border-[#42D6AE]/60 hover:bg-[#42D6AE]/5 transition-all flex flex-col items-center justify-center text-center cursor-pointer group ${className}`}
      >
        <div className="w-9 h-9 rounded-full bg-[#42D6AE]/10 border border-[#42D6AE]/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <Plus className="w-4 h-4 text-[#42D6AE]" />
        </div>
        <div className="text-[13px] font-bold text-[#F0F7FA] group-hover:text-[#42D6AE] transition-colors">
          Add New Farm
        </div>
        <p className="text-[11px] text-[#A7C0CC] mt-0.5 max-w-[180px] leading-snug">
          Start by adding your farm details and location.
        </p>
      </button>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`p-3.5 rounded-xl bg-[#031923]/60 backdrop-blur-md border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
        isActive
          ? 'border-[#42D6AE] ring-1 ring-[#42D6AE]/30 shadow-md shadow-[#42D6AE]/10'
          : 'border-[#49AABE]/25 hover:border-[#42D6AE]/45 hover:bg-[#041E2B]/70'
      } ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <FarmThumbnail src={thumbnailUrl} alt={name} size="md" />

        <div className="space-y-1 min-w-0">
          <div className="text-[14px] font-bold text-[#F0F7FA] flex flex-wrap items-center gap-2">
            <span>{name}</span>
            {isActive && <StatusBadge label="Active" variant="success" size="sm" pulse={false} />}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#A7C0CC]">
            <MapPin className="w-3 h-3 text-[#42D6AE] shrink-0" />
            <span>{location}</span>
          </div>

          <div className="text-[11px] text-[#718D9A] font-medium flex items-center gap-1.5">
            <span>{typeof areaHa === 'number' ? `${areaHa} ha` : areaHa}</span>
            <span>•</span>
            <span>Farmland</span>
          </div>

          {lastAnalysisText && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#42D6AE] pt-0.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#42D6AE] animate-pulse" />
              <span>{lastAnalysisText}</span>
            </div>
          )}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-[#718D9A] group-hover:text-[#42D6AE] group-hover:translate-x-0.5 transition-all shrink-0" />
    </div>
  );
};

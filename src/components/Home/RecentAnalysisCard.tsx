import React from 'react';
import { Clock3 } from 'lucide-react';
import farmThumbImg from '../../assets/images/farm_thumbnail_1790691751269.jpg';
import { GlassCard, FarmThumbnail, StatusBadge } from '../DesignSystem';

interface RecentAnalysisCardProps {
  onViewAll: () => void;
  farmName?: string;
}

export const RecentAnalysisCard: React.FC<RecentAnalysisCardProps> = ({
  onViewAll,
  farmName = 'Al Marjan Farm',
}) => {
  return (
    <GlassCard variant="default" className="p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Clock3 className="w-4 h-4 text-[#42D6AE]" />
          <h2 className="text-[15px] font-bold text-[#F0F7FA] tracking-tight">Recent Analysis</h2>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-[12px] font-medium text-[#42D6AE] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View all</span>
          <span>&rarr;</span>
        </button>
      </div>

      {/* Item Row */}
      <div
        onClick={onViewAll}
        className="p-2.5 rounded-xl bg-[#031923]/60 border border-[#49AABE]/20 hover:border-[#42D6AE]/40 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <FarmThumbnail src={farmThumbImg} alt={farmName} size="sm" />

          <div className="space-y-0.5 min-w-0">
            <div className="text-[13px] font-bold text-[#F0F7FA] truncate">
              Crop Rotation Plan
            </div>
            <div className="text-[11px] text-[#A7C0CC] truncate">
              {farmName}
            </div>
          </div>
        </div>

        {/* Right Badge */}
        <div className="flex flex-col items-end shrink-0 space-y-0.5">
          <StatusBadge label="Completed" variant="success" size="sm" pulse={false} />
          <span className="text-[10px] text-[#718D9A]">
            2 days ago
          </span>
        </div>
      </div>
    </GlassCard>
  );
};

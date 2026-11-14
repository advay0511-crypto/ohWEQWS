import React from 'react';
import { Database } from 'lucide-react';
import { GlassCard } from '../DesignSystem';

interface LatestNasaDataCardProps {
  onViewAll: () => void;
}

export const LatestNasaDataCard: React.FC<LatestNasaDataCardProps> = ({ onViewAll }) => {
  const feeds = [
    {
      id: 'soil_moisture',
      title: 'Soil Moisture',
      source: 'Sentinel-1',
      updated: 'Updated 2 days ago',
      thumbGradient: 'from-blue-600 via-cyan-500 to-teal-400',
    },
    {
      id: 'lst',
      title: 'Land Surface Temperature',
      source: 'Landsat 8',
      updated: 'Updated 3 days ago',
      thumbGradient: 'from-amber-500 via-orange-500 to-red-500',
    },
    {
      id: 'ndvi',
      title: 'Vegetation Health (NDVI)',
      source: 'Sentinel-2',
      updated: 'Updated 3 days ago',
      thumbGradient: 'from-emerald-600 via-green-500 to-lime-400',
    },
    {
      id: 'gpm',
      title: 'Precipitation Forecast',
      source: 'GPM',
      updated: 'Updated 4 days ago',
      thumbGradient: 'from-indigo-600 via-purple-500 to-sky-400',
    },
  ];

  return (
    <GlassCard variant="default" className="p-5 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#42D6AE]" />
          <h2 className="text-[15px] font-bold text-[#F0F7FA] tracking-tight">Latest NASA Data</h2>
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

      {/* 4 Rows */}
      <div className="space-y-2.5">
        {feeds.map((feed, idx) => (
          <div key={feed.id}>
            <div
              onClick={onViewAll}
              className="flex items-center justify-between gap-3 py-1 px-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* 40x40 Visual Thumbnail */}
                <div
                  className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br ${feed.thumbGradient} p-[1px] shadow-sm relative`}
                >
                  <div className="w-full h-full rounded-[7px] bg-[#031923]/40 flex items-center justify-center overflow-hidden">
                    <svg viewBox="0 0 40 40" fill="none" className="w-full h-full opacity-70">
                      <circle cx="20" cy="20" r="14" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="2 2" />
                      <path d="M5 25 Q 20 10 35 25" stroke="#FFFFFF" strokeWidth="1" />
                      <circle cx="24" cy="18" r="3" fill="#FFFFFF" fillOpacity="0.8" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="text-[13px] font-bold text-[#F0F7FA] group-hover:text-[#42D6AE] transition-colors truncate">
                    {feed.title}
                  </div>
                  <div className="text-[11px] text-[#A7C0CC]">
                    {feed.source}
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-[#A7C0CC]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#42D6AE]" />
                <span className="hidden sm:inline">{feed.updated}</span>
              </div>
            </div>

            {idx < feeds.length - 1 && (
              <div className="h-[1px] bg-[#49AABE]/15 mt-2 ml-14" />
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

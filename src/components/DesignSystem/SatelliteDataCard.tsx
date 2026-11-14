import React from 'react';
import { Satellite, ExternalLink, CheckCircle } from 'lucide-react';
import { GlassCard } from './GlassCard';

export interface SatelliteDataCardProps {
  mission: string;
  sensor: string;
  dataType: string;
  resolution: string;
  coverage: string;
  updateFrequency: string;
  onExplore?: () => void;
  className?: string;
}

export const SatelliteDataCard: React.FC<SatelliteDataCardProps> = ({
  mission,
  sensor,
  dataType,
  resolution,
  coverage,
  updateFrequency,
  onExplore,
  className = '',
}) => {
  return (
    <GlassCard variant="default" className={`p-4 space-y-3 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#42D6AE]/10 border border-[#42D6AE]/25 flex items-center justify-center text-[#42D6AE]">
            <Satellite className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F0F7FA] tracking-tight">
              {mission}
            </h4>
            <p className="text-[10px] text-[#A7C0CC] font-mono">
              Sensor: {sensor}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-[#42D6AE] bg-[#42D6AE]/10 border border-[#42D6AE]/25 px-1.5 py-0.5 rounded flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#49AABE]/15">
        <div>
          <span className="text-[#718D9A] block">Observation:</span>
          <span className="text-[#F0F7FA] font-medium">{dataType}</span>
        </div>
        <div>
          <span className="text-[#718D9A] block">Spatial Grid:</span>
          <span className="text-[#F0F7FA] font-mono">{resolution}</span>
        </div>
        <div>
          <span className="text-[#718D9A] block">Coverage:</span>
          <span className="text-[#F0F7FA]">{coverage}</span>
        </div>
        <div>
          <span className="text-[#718D9A] block">Cadence:</span>
          <span className="text-[#42D6AE] font-mono">{updateFrequency}</span>
        </div>
      </div>

      {onExplore && (
        <button
          type="button"
          onClick={onExplore}
          className="w-full pt-2 border-t border-[#49AABE]/15 text-[11px] font-medium text-[#49AABE] hover:text-[#42D6AE] flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <span>View Source Metadata</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      )}
    </GlassCard>
  );
};

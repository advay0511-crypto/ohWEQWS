import React from 'react';
import { MapPin, Layers, Satellite, Maximize2 } from 'lucide-react';
import { GlassCard } from './GlassCard';

export interface MapPanelProps {
  lat: number;
  lon: number;
  locationName: string;
  zoom?: number;
  fieldSizeHa?: number;
  elevationMeters?: number;
  onExpand?: () => void;
  className?: string;
}

export const MapPanel: React.FC<MapPanelProps> = ({
  lat,
  lon,
  locationName,
  fieldSizeHa = 32.5,
  elevationMeters = 24,
  onExpand,
  className = '',
}) => {
  return (
    <GlassCard variant="default" className={`overflow-hidden relative ${className}`}>
      {/* Top Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-[#49AABE]/20 bg-[#031923]/60">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-[#42D6AE]" />
          <span className="text-xs font-bold text-[#F0F7FA] truncate">
            {locationName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-[#49AABE]/15 border border-[#49AABE]/30 text-[#3BD9C2] px-1.5 py-0.5 rounded">
            {lat.toFixed(3)}°N, {lon.toFixed(3)}°E
          </span>
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="text-[#718D9A] hover:text-[#42D6AE] p-1 cursor-pointer transition-colors"
              title="Expand view"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Visual Satellite / Grid Canvas Representation */}
      <div className="relative h-44 sm:h-52 bg-[#02131C] overflow-hidden flex items-center justify-center">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(#49AABE 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Farmland polygon representation */}
        <div className="relative z-10 w-36 h-28 border-2 border-[#42D6AE]/70 rounded-lg bg-[#42D6AE]/10 flex flex-col items-center justify-center p-2 text-center shadow-lg shadow-[#42D6AE]/15">
          <div className="w-3 h-3 rounded-full bg-[#42D6AE] animate-ping absolute -top-1.5 -right-1.5" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#42D6AE] absolute -top-1.5 -right-1.5" />
          <MapPin className="w-5 h-5 text-[#42D6AE] mb-1" />
          <span className="text-[11px] font-bold text-[#F0F7FA] leading-tight">
            Parcel Boundary
          </span>
          <span className="text-[10px] font-mono text-[#42D6AE]">
            {fieldSizeHa} ha
          </span>
        </div>

        {/* HUD Overlay details */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-[#A7C0CC] bg-[#031923]/80 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-[#49AABE]/20">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#49AABE]" />
            NASA Sentinel-2 / Landsat
          </span>
          <span>Elevation: {elevationMeters}m</span>
        </div>
      </div>
    </GlassCard>
  );
};

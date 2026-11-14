import React from 'react';
import { CloudRain, Sun, Wind, Droplets, Thermometer } from 'lucide-react';
import { GlassCard } from './GlassCard';

export interface WeatherCardProps {
  locationName: string;
  temperatureC: number;
  precipitationAnnualMm: number;
  soilMoisturePercent?: number;
  solarRadiationKwh?: number;
  aridityIndex?: number;
  lastUpdated?: string;
  className?: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  locationName,
  temperatureC,
  precipitationAnnualMm,
  soilMoisturePercent = 28,
  solarRadiationKwh = 5.4,
  aridityIndex = 0.42,
  lastUpdated = 'Live satellite feed',
  className = '',
}) => {
  return (
    <GlassCard variant="default" className={`p-4 space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-[#49AABE]/15">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-300" />
          <h4 className="text-xs font-bold text-[#F0F7FA] tracking-tight">
            Climate & Weather
          </h4>
        </div>
        <span className="text-[10px] font-mono text-[#42D6AE] bg-[#42D6AE]/10 px-1.5 py-0.5 rounded border border-[#42D6AE]/25">
          {lastUpdated}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#F0F7FA] font-sans tracking-tight tabular-nums">
            {temperatureC}°C
          </span>
          <span className="text-xs text-[#A7C0CC] ml-1.5">
            Mean Temperature
          </span>
        </div>
        <span className="text-xs font-mono text-[#A7C0CC]">
          {locationName}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#49AABE]/15 text-[11px] font-mono">
        <div className="space-y-0.5">
          <span className="text-[#718D9A] flex items-center gap-1">
            <CloudRain className="w-3 h-3 text-[#3BD9C2]" />
            Rainfall
          </span>
          <span className="text-[#F0F7FA] font-bold">
            {precipitationAnnualMm} mm/yr
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[#718D9A] flex items-center gap-1">
            <Droplets className="w-3 h-3 text-[#42D6AE]" />
            Moisture
          </span>
          <span className="text-[#42D6AE] font-bold">
            {soilMoisturePercent}%
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[#718D9A] flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-300" />
            Solar
          </span>
          <span className="text-[#F0F7FA] font-bold">
            {solarRadiationKwh} kWh/m²
          </span>
        </div>
      </div>
    </GlassCard>
  );
};

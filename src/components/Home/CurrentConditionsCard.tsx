import React from 'react';
import {
  Sun,
  MapPin,
  Droplets,
  Wind,
  CloudRain,
  AlertTriangle,
  Flame,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { GlassCard } from '../DesignSystem';
import { ClimateObservation, FarmAnswers } from '../../types';
import {
  compareCurrentVsHistoricalMoisture,
  evaluateDrainageAndWaterloggingRisk,
} from '../../engine/soilEngine';

interface CurrentConditionsCardProps {
  locationName?: string;
  climate?: ClimateObservation;
  answers?: FarmAnswers;
}

export const CurrentConditionsCard: React.FC<CurrentConditionsCardProps> = ({
  locationName = 'Ras Al Khaimah, UAE',
  climate = {
    annualPrecipitationMm: 142,
    gddAnnual: 3100,
    meanTempC: 28.4,
    maxSummerTempC: 42.0,
    minWinterTempC: 16.0,
    drySpellMaxDays: 65,
    referenceEt0AnnualMm: 1720,
    soilMoisturePercentile: 38,
    soilMoistureHistoricalBaseline: 52,
    vegetationNdviMean: 0.42,
    groundwaterTrendCoarse: 'depleting',
    warmingTrendDecadalC: 0.38,
    precipitationTrendPctDecade: -2.5,
    warmingTrendSignificance: 'statistically_significant_warming',
    warmingTrendPValue: 0.012,
    warmingTrendMethod: 'Mann-Kendall Trend Test',
    historicalYearsCount: 10,
    annualHistorySeries: [],
    imputedDataFields: [],
    et0Method: 'FAO-56 Penman-Monteith',
    gddMethod: 'Standard GDD (Base 10°C)',
  },
  answers = {
    locationName: 'Ras Al Khaimah, UAE',
    lat: 25.6741,
    lon: 55.9804,
    locationConfirmed: true,
    soilTexture: 'sandy_loam',
    soilTextureConfirmed: true,
    irrigationMode: 'irrigation_only',
    cropHistory: [],
    planningHorizon: '5_seasons',
    priorities: { waterSaving: 4, soilHealth: 3, climateResilience: 4, cropSuitability: 3, productivity: 3 },
    excludedCropIds: [],
    forcedCropIds: [],
  },
}) => {
  const moistureReport = compareCurrentVsHistoricalMoisture(climate);
  const drainageReport = evaluateDrainageAndWaterloggingRisk(answers, climate);

  return (
    <GlassCard variant="default" className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-[#42D6AE]" />
          <h2 className="text-[15px] font-bold text-[#F0F7FA] tracking-tight">Current Conditions</h2>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-[#A7C0CC]">
          <MapPin className="w-3 h-3 text-[#42D6AE]" />
          <span className="truncate max-w-[130px]">{locationName}</span>
        </div>
      </div>

      {/* Main Temperature & Abstract Graphic Display */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-[38px] font-bold tracking-tight text-[#F0F7FA] font-mono leading-none">
            {Math.round(climate.meanTempC)}°C
          </div>
          <div className="text-[13px] font-semibold text-[#A7C0CC]">
            Peak Summer: {climate.maxSummerTempC}°C
          </div>
          <div className="text-[11px] text-[#718D9A] font-mono">
            Annual Rain: {climate.annualPrecipitationMm} mm
          </div>
        </div>

        {/* Abstract Green Wireframe Weather Landscape Graphic */}
        <div className="w-24 h-16 relative flex items-center justify-center shrink-0">
          <svg viewBox="0 0 100 65" fill="none" className="w-full h-full opacity-85">
            <circle cx="50" cy="24" r="14" fill="#42D6AE" fillOpacity="0.25" />
            <circle cx="50" cy="24" r="9" fill="#42D6AE" fillOpacity="0.6" />
            <path
              d="M5 58 C 30 46, 70 46, 95 58"
              stroke="#42D6AE"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M12 50 C 35 40, 65 40, 88 50"
              stroke="#3BD9C2"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeOpacity="0.75"
            />
            <path
              d="M20 42 C 40 34, 60 34, 80 42"
              stroke="#42D6AE"
              strokeWidth="0.9"
              strokeLinecap="round"
              strokeOpacity="0.5"
            />
          </svg>
        </div>
      </div>

      {/* Item 10: Current vs Historical Moisture Card */}
      <div className="p-3 rounded-xl bg-[#031520]/80 border border-[#27D7B2]/25 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
            <Droplets className="w-3.5 h-3.5 text-[#27D7B2]" />
            <span>Root-Zone Soil Moisture</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              moistureReport.statusColor === 'rose'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : moistureReport.statusColor === 'amber'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-[#27D7B2]/20 text-[#27D7B2] border border-[#27D7B2]/30'
            }`}
          >
            {moistureReport.conditionLabel}
          </span>
        </div>

        <div className="flex items-baseline justify-between text-xs font-mono pt-0.5">
          <span className="text-[#A7C0CC]">
            Current: <strong className="text-white">{moistureReport.currentMoisturePercentile}th %ile</strong>
          </span>
          <span className="text-[#A7C0CC]">
            10-Yr Baseline: <strong className="text-white">{moistureReport.historicalBaselinePercentile}th %ile</strong>
          </span>
          <span
            className={`font-bold ${
              moistureReport.anomalyDelta < 0 ? 'text-rose-400' : 'text-[#27D7B2]'
            }`}
          >
            {moistureReport.anomalyDelta > 0 ? `+${moistureReport.anomalyDelta}` : moistureReport.anomalyDelta}%
          </span>
        </div>
      </div>

      {/* Item 11: Root-Zone Water Warning */}
      {moistureReport.rootZoneWarning && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-400/40 text-rose-200 text-xs space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold text-rose-300 text-[11px]">
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span>{moistureReport.rootZoneWarning.title}</span>
          </div>
          <p className="text-[11px] text-rose-100/90 leading-tight">
            {moistureReport.rootZoneWarning.detail}
          </p>
          <p className="text-[10px] text-rose-300 font-semibold pt-0.5">
            {moistureReport.rootZoneWarning.actionAdvice}
          </p>
        </div>
      )}

      {/* Item 13: Waterlogging Warning */}
      {drainageReport.waterloggingWarning && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-200 text-xs space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{drainageReport.waterloggingWarning.title}</span>
          </div>
          <p className="text-[11px] text-amber-100/90 leading-tight">
            {drainageReport.waterloggingWarning.anoxiaRisk}
          </p>
        </div>
      )}

      {/* Bottom 3-column Weather Metrics with subtle separators */}
      <div className="grid grid-cols-3 pt-3 border-t border-[#49AABE]/20 text-center divide-x divide-[#49AABE]/20">
        {/* Humidity */}
        <div className="px-2 space-y-1">
          <div className="flex items-center justify-center gap-1 text-[11px] text-[#718D9A]">
            <Droplets className="w-3 h-3 text-[#42D6AE]" />
            <span>Humidity</span>
          </div>
          <div className="text-[14px] font-bold text-[#F0F7FA] font-mono">
            64%
          </div>
        </div>

        {/* Wind */}
        <div className="px-2 space-y-1">
          <div className="flex items-center justify-center gap-1 text-[11px] text-[#718D9A]">
            <Wind className="w-3 h-3 text-[#3BD9C2]" />
            <span>Wind</span>
          </div>
          <div className="text-[14px] font-bold text-[#F0F7FA] font-mono">
            12 km/h
          </div>
        </div>

        {/* Precipitation */}
        <div className="px-2 space-y-1">
          <div className="flex items-center justify-center gap-1 text-[11px] text-[#718D9A]">
            <CloudRain className="w-3 h-3 text-[#42D6AE]" />
            <span>Precipitation</span>
          </div>
          <div className="text-[14px] font-bold text-[#F0F7FA] font-mono">
            0 mm
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

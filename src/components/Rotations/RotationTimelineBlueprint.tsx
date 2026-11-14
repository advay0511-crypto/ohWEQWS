import React from 'react';
import {
  Calendar,
  Layers,
  Droplets,
  Sprout,
  Clock,
  ArrowRight,
  Info,
  RefreshCw,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import { RotationResult, RotationSeasonPlan } from '../../types';
import { getCropImage } from '../../services/cropImages';

interface RotationTimelineBlueprintProps {
  rotation: RotationResult;
  soilTexture?: string;
  annualPrecipitationMm?: number;
}

export const RotationTimelineBlueprint: React.FC<RotationTimelineBlueprintProps> = ({
  rotation,
  soilTexture = 'Loam',
  annualPrecipitationMm = 820,
}) => {
  const sequence: RotationSeasonPlan[] = rotation.sequence || [];

  // Calculate dynamic rotation length based on selected crops
  const totalYears = sequence.reduce((acc, curr) => acc + (curr.durationSeasons || 1), 0);
  const totalPhases = sequence.length;
  const hasPerennial = sequence.some((s) => (s.durationSeasons || 1) > 1);

  // Compute timeline labels dynamically
  let runningYear = 1;
  const seasons = ['Winter', 'Spring', 'Summer', 'Autumn'];

  const timelineItems = sequence.map((seq, idx) => {
    const duration = seq.durationSeasons || 1;
    const isMultiYear = duration > 1;
    const yearStart = runningYear;
    const yearEnd = runningYear + duration - 1;
    runningYear += duration;

    const timelineLabel = isMultiYear
      ? `Years ${yearStart}–${yearEnd}`
      : `Year ${yearStart}`;

    const seasonName = seq.seasonName || seasons[idx % 4];
    const durationDays = seq.durationDays || (duration > 1 ? duration * 365 : 115);

    return {
      seq,
      idx,
      timelineLabel,
      seasonName,
      isMultiYear,
      duration,
      durationDays,
    };
  });

  return (
    <div className="space-y-4 pt-2">
      {/* 1. TIMELINE HEADER & ROTATION DURATION EXPLANATION */}
      <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.12] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#27D7B2]" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Rotation Timeline &amp; Duration Breakdown
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/30">
              {totalYears}-Year Cycle ({totalPhases} Crop {totalPhases === 1 ? 'Phase' : 'Phases'})
            </span>
          </div>
        </div>

        {/* Clear Agronomic Explanation of Duration */}
        <div className="flex items-start gap-2.5 text-xs text-[#8EA3AF] leading-relaxed">
          <Info className="w-4 h-4 text-[#27D7B2] shrink-0 mt-0.5" />
          <div>
            <p>
              <strong className="text-white">Rotation Duration:</strong> This sequence spans{' '}
              <span className="text-[#27D7B2] font-semibold font-mono">
                {totalYears} {totalYears === 1 ? 'year' : 'years'}
              </span>{' '}
              across {totalPhases} distinct crop {totalPhases === 1 ? 'phase' : 'phases'}.{' '}
              {hasPerennial ? (
                <span>
                  Deep-rooted perennial crops (such as Alfalfa) occupy the field for multiple years (Years 1–3) to rebuild deep soil organic matter, followed by annual rotational crops.
                </span>
              ) : (
                <span>
                  Each annual crop occupies the field for one full growing season.
                </span>
              )}{' '}
              After Year {totalYears}, this rotation can restart from Year 1 if seasonal moisture and market conditions remain favorable.
            </p>
          </div>
        </div>
      </div>

      {/* 2. BLUEPRINT CARDS WITH PLANTING & HARVEST WINDOWS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {timelineItems.map(({ seq, idx, timelineLabel, seasonName, isMultiYear, duration, durationDays }) => {
          const imgUrl = getCropImage(seq.cropName);
          const isPositiveN = seq.nitrogenCarryoverKgHa >= 0;

          return (
            <div
              key={idx}
              className="p-4 rounded-xl glass-card border border-white/[0.1] hover:border-[#27D7B2]/40 space-y-3 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Top Badge: Year Label + Season Tag */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#27D7B2] bg-[#27D7B2]/10 px-2 py-0.5 rounded border border-[#27D7B2]/30">
                    {timelineLabel}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#A7C0CC] font-mono">
                    {seasonName}
                  </span>
                </div>

                {/* Crop Image & Name */}
                <div className="flex items-center gap-2.5">
                  <div
                    title={`Planted for ~${durationDays} days in field`}
                    className="w-12 h-12 rounded-lg overflow-hidden border border-[#27D7B2]/30 bg-[#020A10] shrink-0 relative group/img cursor-pointer"
                  >
                    <img
                      src={imgUrl}
                      alt={seq.cropName}
                      className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 py-0.5 bg-black/85 text-[8px] font-mono font-bold text-[#27D7B2] text-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                      ~{durationDays}d
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight leading-tight">
                      {seq.cropName}
                    </h4>
                    <span className="text-[11px] text-[#718D9A] font-mono block">
                      {seq.cropFamily || (seq.isLegume ? 'Fabaceae' : 'Poaceae')}
                    </span>
                  </div>
                </div>

                {/* DYNAMIC PLANTING & HARVEST WINDOWS (Clean unnested layout) */}
                <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#718D9A] block uppercase font-mono font-semibold">
                        Planting
                      </span>
                      <span className="font-bold text-white block font-mono text-xs">
                        {seq.plantingWindow || 'Spring'}
                      </span>
                    </div>
                    <div className="border-l border-white/[0.08] pl-2">
                      <span className="text-[10px] text-[#718D9A] block uppercase font-mono font-semibold">
                        Harvest
                      </span>
                      <span className="font-bold text-[#27D7B2] block font-mono text-xs">
                        {seq.harvestWindow || 'Autumn'}
                      </span>
                    </div>
                  </div>

                  {seq.transitionGap && (
                    <div className="pt-1 text-[11px] text-slate-300 leading-tight">
                      <span className="text-[#27D7B2] font-semibold font-mono text-[10px] mr-1">Gap:</span>
                      {seq.transitionGap}
                    </div>
                  )}
                </div>

                {/* Crop description / rationale */}
                <p className="text-[11px] text-[#A7C0CC] leading-relaxed">
                  {seq.whyThisCrop ||
                    (seq.isLegume
                      ? 'Fixes atmospheric nitrogen through root nodule symbiosis, replenishing soil fertility.'
                      : 'Builds protective surface armor and scavenges deep nutrients with high residue biomass.')}
                </p>
              </div>

              {/* Bottom Metrics: Nitrogen Carryover & Water Demand */}
              <div className="pt-2 border-t border-[#27D7B2]/15 space-y-1 text-xs font-mono">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#718D9A]">Net Nitrogen:</span>
                  <span className={`font-bold ${isPositiveN ? 'text-emerald-400' : 'text-white'}`}>
                    {isPositiveN ? `+${seq.nitrogenCarryoverKgHa}` : seq.nitrogenCarryoverKgHa} kg N/ha
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#718D9A]">Water Need:</span>
                  <span className="font-bold text-[#27D7B2]">{seq.waterDemandMm || 350} mm</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

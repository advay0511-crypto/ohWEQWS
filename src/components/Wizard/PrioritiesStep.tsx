import React, { useMemo } from 'react';
import { Droplet, Sprout, ShieldCheck, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { PrioritiesState, FarmAnswers, ClimateObservation } from '../../types';
import { calculateNormalizedWeights, generateAndScoreRotations } from '../../engine/scoring';

interface PrioritiesStepProps {
  priorities: PrioritiesState;
  onChangePriorities: (newPriorities: PrioritiesState) => void;
  farmAnswers: FarmAnswers;
  climateData: ClimateObservation;
}

const PRESETS: { id: string; label: string; values: PrioritiesState }[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    values: { waterSaving: 2, soilHealth: 3, climateResilience: 3, cropSuitability: 2, productivity: 2 },
  },
  {
    id: 'save_water',
    label: 'Save Water',
    values: { waterSaving: 4, soilHealth: 2, climateResilience: 3, cropSuitability: 2, productivity: 1 },
  },
  {
    id: 'build_soil',
    label: 'Build Soil',
    values: { waterSaving: 2, soilHealth: 4, climateResilience: 2, cropSuitability: 2, productivity: 1 },
  },
  {
    id: 'climate_proof',
    label: 'Climate-Proof',
    values: { waterSaving: 3, soilHealth: 3, climateResilience: 4, cropSuitability: 2, productivity: 1 },
  },
  {
    id: 'max_harvest',
    label: 'Max Harvest',
    values: { waterSaving: 1, soilHealth: 1, climateResilience: 2, cropSuitability: 3, productivity: 4 },
  },
];

const SNAP_LABELS = ['Not a concern', 'Somewhat', 'Important', 'Very important', 'Top priority'];

export const PrioritiesStep: React.FC<PrioritiesStepProps> = ({
  priorities,
  onChangePriorities,
  farmAnswers,
  climateData,
}) => {
  const normalizedWeights = useMemo(() => calculateNormalizedWeights(priorities), [priorities]);

  // Live preview calculation using pure function
  const livePreview = useMemo(() => {
    try {
      const answersWithCurrentPriorities = { ...farmAnswers, priorities };
      const { rotations } = generateAndScoreRotations(answersWithCurrentPriorities, climateData);
      return rotations[0];
    } catch {
      return null;
    }
  }, [farmAnswers, climateData, priorities]);

  const updatePriority = (key: keyof PrioritiesState, val: number) => {
    onChangePriorities({
      ...priorities,
      [key]: val,
    });
  };

  // Conflict detection
  const hasConflict = priorities.productivity >= 3 && priorities.waterSaving >= 3;

  return (
    <div className="space-y-6">
      {/* Preset Chips */}
      <div>
        <label className="text-xs uppercase font-mono tracking-wider text-slate-400 block mb-2">
          Preset Profiles
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const isMatch =
              priorities.waterSaving === p.values.waterSaving &&
              priorities.soilHealth === p.values.soilHealth &&
              priorities.climateResilience === p.values.climateResilience &&
              priorities.cropSuitability === p.values.cropSuitability &&
              priorities.productivity === p.values.productivity;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChangePriorities(p.values)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isMatch
                    ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 Slider Cards */}
      <div className="space-y-4">
        {/* 1. Water Saving */}
        <PrioritySliderCard
          title="Water Saving"
          description="Prioritize drought-tolerant pulses, cover rest, and lower irrigation draw."
          icon={<Droplet className="w-4 h-4 text-sky-400" />}
          value={priorities.waterSaving}
          effectiveWeightPct={Math.round(normalizedWeights.waterSaving * 100)}
          onChange={(v) => updatePriority('waterSaving', v)}
        />

        {/* 2. Soil Health */}
        <PrioritySliderCard
          title="Soil Health"
          description="Build organic matter, biological nitrogen fixation, and root diversity."
          icon={<Sprout className="w-4 h-4 text-emerald-400" />}
          value={priorities.soilHealth}
          effectiveWeightPct={Math.round(normalizedWeights.soilHealth * 100)}
          onChange={(v) => updatePriority('soilHealth', v)}
        />

        {/* 3. Climate Resilience */}
        <PrioritySliderCard
          title="Climate Resilience"
          description="Buffer against extreme heatwaves, dry spells, and unpredictable frost."
          icon={<ShieldCheck className="w-4 h-4 text-indigo-400" />}
          value={priorities.climateResilience}
          effectiveWeightPct={Math.round(normalizedWeights.climateResilience * 100)}
          onChange={(v) => updatePriority('climateResilience', v)}
        />

        {/* 4. Crop Suitability */}
        <PrioritySliderCard
          title="Crop Suitability"
          description="Favor crops that naturally align with your local temperatures and soil pH."
          icon={<CheckCircle2 className="w-4 h-4 text-teal-400" />}
          value={priorities.cropSuitability}
          effectiveWeightPct={Math.round(normalizedWeights.cropSuitability * 100)}
          onChange={(v) => updatePriority('cropSuitability', v)}
        />

        {/* 5. Productivity */}
        <PrioritySliderCard
          title="Productivity & Yield"
          description="Maximize biomass and expected harvest potential per season."
          icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
          value={priorities.productivity}
          effectiveWeightPct={Math.round(normalizedWeights.productivity * 100)}
          onChange={(v) => updatePriority('productivity', v)}
        />
      </div>

      {/* Conflict gentle nudge */}
      {hasConflict && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Trade-off Notice:</strong> High productivity and maximum water saving often pull in
            opposite directions. Field Shift balances both while protecting soil health floors.
          </span>
        </div>
      )}

      {/* Live Preview Strip */}
      <div className="p-4 rounded-xl glass-card shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Live Dynamic Prediction
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">
              Leading Sequence:{' '}
              <span className="text-sky-300">
                {livePreview
                  ? livePreview.sequence.map((s) => `${s.cropName} (${s.durationSeasons}s)`).join(' → ')
                  : 'Computing optimal sequence…'}
              </span>
            </div>
          </div>
          {livePreview && (
            <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
              <span className="text-slate-300">
                Score: <strong className="text-emerald-400 text-sm">{livePreview.totalScore}</strong>/100
              </span>
              <span className="text-slate-400">· {livePreview.cycleLengthSeasons}-Season Cycle</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface PrioritySliderCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: number;
  effectiveWeightPct: number;
  onChange: (v: number) => void;
}

const PrioritySliderCard: React.FC<PrioritySliderCardProps> = ({
  title,
  description,
  icon,
  value,
  effectiveWeightPct,
  onChange,
}) => {
  return (
    <div className="p-4 rounded-xl glass-card glass-card-hover transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-indigo-300 font-semibold">{effectiveWeightPct}% share</span>
          <span className="text-xs text-slate-400 font-medium">({SNAP_LABELS[value]})</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3">{description}</p>

      {/* Snap slider */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max="4"
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>Not a concern</span>
          <span>Somewhat</span>
          <span>Important</span>
          <span>Very high</span>
          <span>Top priority</span>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Check, Satellite, Cpu, ShieldCheck } from 'lucide-react';

interface AnalyzingScreenProps {
  onComplete: () => void;
  onCancel: () => void;
  currentStage?: string;
  progressPercent?: number;
  activeSourceNames?: string[];
}

const DEFAULT_STAGES = [
  { label: 'Validating farm parcel geometry…', source: 'FARMER' },
  { label: 'Gathering 10-year NASA POWER climate & solar data…', source: 'POWER' },
  { label: 'Analyzing ECMWF multi-depth soil moisture telemetry…', source: 'OPEN_METEO' },
  { label: 'Checking terrain, elevation and slope gradient…', source: 'NASADEM' },
  { label: 'Evaluating FAO-56 Penman-Monteith water ledger…', source: null },
  { label: 'Scoring crop tolerances across temperature, pH & drainage…', source: null },
  { label: 'Generating and testing rotation sequences…', source: null },
  { label: 'Applying farmer priorities and risk floors…', source: null },
  { label: 'Calculating honest evidence confidence levels…', source: null },
  { label: 'Synthesizing agronomic rationale…', source: null },
];

export const AnalyzingScreen: React.FC<AnalyzingScreenProps> = ({
  onComplete,
  onCancel,
  currentStage,
  progressPercent: propProgress,
  activeSourceNames = ['FARMER', 'POWER'],
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  useEffect(() => {
    if (propProgress !== undefined) {
      if (propProgress >= 100) {
        const t = setTimeout(onComplete, 400);
        return () => clearTimeout(t);
      }
      return;
    }

    const interval = setInterval(() => {
      setCurrentStageIdx((prev) => {
        if (prev < DEFAULT_STAGES.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 500);
          return prev;
        }
      });
    }, 400);

    return () => clearInterval(interval);
  }, [onComplete, propProgress]);

  const progressPercent =
    propProgress !== undefined
      ? propProgress
      : Math.min(100, Math.round(((currentStageIdx + 1) / DEFAULT_STAGES.length) * 100));

  const activeLabel = currentStage || DEFAULT_STAGES[currentStageIdx]?.label;

  const displaySources = propProgress !== undefined && activeSourceNames.length > 0
    ? activeSourceNames
    : Array.from(new Set(DEFAULT_STAGES.slice(0, currentStageIdx + 1).map((s) => s.source).filter(Boolean))) as string[];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Central Progress Card */}
      <div className="w-full max-w-xl p-8 rounded-2xl glass-panel relative z-10 text-center space-y-6">
        {/* Count-up header */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider text-sky-400 uppercase mb-2">
            <Cpu className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Deterministic Agronomic Engine</span>
          </div>
          <div className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight font-mono">
            {progressPercent}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-[1px]">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Active Stage Label */}
        <div className="h-10 flex items-center justify-center">
          <p className="text-sm sm:text-base font-medium text-slate-200 animate-in fade-in duration-200">
            {activeLabel}
          </p>
        </div>

        {/* Illuminating NASA & Environmental Data Source Strip */}
        <div className="pt-4 border-t border-white/10">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5">
            Active Satellite &amp; Earth Data Connectors
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {['FARMER', 'POWER', 'OPEN_METEO', 'NASADEM'].map((src) => {
              const isLit = displaySources.includes(src);
              return (
                <div
                  key={src}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono border transition-all duration-300 ${
                    isLit
                      ? 'bg-sky-500/15 border-sky-400/40 text-sky-300 shadow-sm shadow-sky-500/20'
                      : 'bg-white/[0.02] border-white/5 text-slate-400'
                  }`}
                >
                  <Satellite className={`w-3.5 h-3.5 ${isLit ? 'text-sky-400' : 'text-slate-600'}`} />
                  <span>{src}</span>
                  {isLit && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action strip */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="text-xs text-indigo-300 hover:text-indigo-200 font-medium"
          >
            Continue in background →
          </button>
        </div>
      </div>
    </div>
  );
};

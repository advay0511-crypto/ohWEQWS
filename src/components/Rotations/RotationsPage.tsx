import React, { useState, useMemo } from 'react';
import {
  Sprout,
  Droplets,
  ArrowRight,
  Check,
  Sliders,
  Sparkles,
  Info,
  Calendar,
  Layers,
  FlaskConical,
  TrendingUp,
  X,
  Plus,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  SavedFarmPlan,
  RotationResult,
  AppViewMode,
  AppUnits,
  RotationSeasonPlan,
} from '../../types';
import { getCropImage } from '../../services/cropImages';
import { CROP_KNOWLEDGE_BASE } from '../../engine/crops';
import { generateAndScoreRotations } from '../../engine/scoring';

interface RotationsPageProps {
  farm: SavedFarmPlan;
  viewMode: AppViewMode;
  units: AppUnits;
  onOpenWhatIf: (farmId: string) => void;
  onSaveAsPlan: (rotation: RotationResult) => void;
}

export const RotationsPage: React.FC<RotationsPageProps> = ({
  farm,
  onOpenWhatIf,
  onSaveAsPlan,
}) => {
  const analysis = farm.analysis;
  const initialRotations = useMemo(() => analysis?.rotations || [], [analysis]);
  const [rotations, setRotations] = useState<RotationResult[]>(initialRotations);
  const [selectedRotationId, setSelectedRotationId] = useState<string>(
    farm.activeRotationPlanId || initialRotations[0]?.id || ''
  );
  const [filter, setFilter] = useState<'all' | 'recommended' | 'water_saving'>('all');
  const [inspectingCrop, setInspectingCrop] = useState<RotationSeasonPlan | null>(null);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  const selectedRotation = rotations.find((r) => r.id === selectedRotationId) || rotations[0];

  const filteredRotations = useMemo(() => {
    let list = [...rotations];
    if (filter === 'recommended') {
      list = list.filter((r) => r.isRecommended);
    } else if (filter === 'water_saving') {
      list.sort((a, b) => (a.waterDemandAnnualMm || 0) - (b.waterDemandAnnualMm || 0));
    }
    return list;
  }, [rotations, filter]);

  const handleApplyPlan = (rot: RotationResult) => {
    onSaveAsPlan(rot);
    setSelectedRotationId(rot.id);
    setSavedNotification(`Plan "${rot.name}" applied as active rotation.`);
    setTimeout(() => setSavedNotification(null), 3000);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {savedNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-[#27D7B2] text-white text-xs font-semibold shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-[#27D7B2]" />
          <span>{savedNotification}</span>
        </div>
      )}

      {/* TOP COMMAND STRIP: Farm Title + Filter Segment (NO CARD SPAM) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#27D7B2]/20 border border-[#27D7B2]/40 flex items-center justify-center text-[#27D7B2]">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>Multi-Season Rotations</span>
              <span className="text-xs font-mono text-slate-400">({rotations.length} Sequences)</span>
            </h1>
            <p className="text-xs text-slate-400">
              Evaluated against {farm.locationName || 'regional climate'} &amp; soil profile
            </p>
          </div>
        </div>

        {/* Connected Filter Segment */}
        <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#27D7B2] text-[#020A10] font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All Sequences
          </button>
          <button
            type="button"
            onClick={() => setFilter('recommended')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filter === 'recommended'
                ? 'bg-[#27D7B2] text-[#020A10] font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Top Matches
          </button>
          <button
            type="button"
            onClick={() => setFilter('water_saving')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filter === 'water_saving'
                ? 'bg-[#27D7B2] text-[#020A10] font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Lowest Water Demand
          </button>
        </div>
      </div>

      {/* ROTATION SEQUENCES LIST: VISUAL FLOW WITH REAL CROP IMAGERY */}
      <div className="space-y-4">
        {filteredRotations.map((rot, rIdx) => {
          const isSelected = rot.id === selectedRotationId;
          const isActiveOnFarm = farm.activeRotationPlanId === rot.id;

          return (
            <div
              key={rot.id}
              onClick={() => setSelectedRotationId(rot.id)}
              className={`rounded-2xl border backdrop-blur-xl p-5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-black/75 border-[#27D7B2] shadow-2xl shadow-[#27D7B2]/15'
                  : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-black/60'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Score Badge + Sequence Title */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shrink-0 ${
                      rot.totalScore >= 80
                        ? 'bg-[#27D7B2] text-[#020A10]'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <span className="text-base leading-none">{rot.totalScore}</span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">Score</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{rot.name}</h3>
                      {isActiveOnFarm && (
                        <span className="px-2 py-0.5 rounded-full bg-[#27D7B2]/20 border border-[#27D7B2]/40 text-[#27D7B2] text-[10px] font-bold">
                          Active Plan
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                      <span>{rot.cycleLengthSeasons} Seasons ({rot.cycleLengthYears || 2} Years)</span>
                      <span>·</span>
                      <span className="text-sky-300 flex items-center gap-1">
                        <Droplets className="w-3 h-3" />
                        {rot.waterDemandAnnualMm} mm/yr
                      </span>
                      <span>·</span>
                      <span className="text-emerald-300 flex items-center gap-1">
                        <FlaskConical className="w-3 h-3" />
                        +{rot.nitrogenBalanceNetKgHa} kg N/ha
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Connected Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWhatIf(farm.id);
                    }}
                    title="Simulate Climate Scenarios"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyPlan(rot);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActiveOnFarm
                        ? 'bg-white/10 text-slate-300'
                        : 'bg-[#27D7B2] hover:bg-[#20C09E] text-[#020A10] shadow-md shadow-[#27D7B2]/20'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isActiveOnFarm ? 'Applied' : 'Apply Plan'}</span>
                  </button>
                </div>
              </div>

              {/* HORIZONTAL PHOTOGRAPHIC CROP FLOW */}
              <div className="mt-4 pt-4 border-t border-white/10 overflow-x-auto pb-1">
                <div className="flex items-center gap-2 sm:gap-3 min-w-[550px]">
                  {rot.sequence.map((step, sIdx) => {
                    const isLast = sIdx === rot.sequence.length - 1;
                    const cropPhoto = getCropImage(step.cropName);

                    return (
                      <React.Fragment key={sIdx}>
                        {/* Crop Visual Card */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingCrop(step);
                          }}
                          className="flex-1 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group flex items-center gap-3"
                        >
                          <img
                            src={cropPhoto}
                            alt={step.cropName}
                            className="w-10 h-10 rounded-lg object-cover border border-white/20 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] text-[#27D7B2] font-semibold uppercase tracking-wider">
                              Season {step.seasonIndex + 1}
                            </div>
                            <div className="text-xs font-bold text-white truncate group-hover:text-[#27D7B2] transition-colors">
                              {step.cropName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {step.cropFamily} · {step.waterDemandMm}mm
                            </div>
                          </div>
                        </div>

                        {/* Transition Arrow */}
                        {!isLast && (
                          <div className="text-slate-500 shrink-0">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CROP INSPECTION POPUP (WHEN A CROP IS TAPPED IN THE FLOW) */}
      {inspectingCrop && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setInspectingCrop(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#031826] border border-[#27D7B2]/40 p-5 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={getCropImage(inspectingCrop.cropName)}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border border-[#27D7B2]/40"
                />
                <div>
                  <h3 className="text-base font-bold text-white">{inspectingCrop.cropName}</h3>
                  <div className="text-xs text-slate-400">
                    {inspectingCrop.cropFamily} · {inspectingCrop.seasonName}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingCrop(null)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] text-slate-400">Water Demand</div>
                <div className="text-sm font-bold text-sky-400 font-mono mt-0.5">
                  {inspectingCrop.waterDemandMm} mm
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] text-slate-400">Nitrogen Carryover</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                  +{inspectingCrop.nitrogenCarryoverKgHa} kg/ha
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white block mb-1">Rotational Function:</span>
              {inspectingCrop.whyThisCrop || 'Balances soil biological activity and suppresses cereal pathogens.'}
            </div>

            <button
              type="button"
              onClick={() => setInspectingCrop(null)}
              className="w-full py-2 rounded-xl bg-[#27D7B2] text-[#020A10] font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

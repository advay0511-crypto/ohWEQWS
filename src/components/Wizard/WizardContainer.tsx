import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  HelpCircle,
  Sparkles,
  Layers,
  Droplet,
  History,
  Calendar,
  Sliders,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Edit2,
  Sprout,
  AlertTriangle,
} from 'lucide-react';
import { FarmAnswers, SoilTextureType, IrrigationMode, PlanningHorizon, RiskAttitude } from '../../types';
import { FarmMapPicker } from './FarmMapPicker';
import { PrioritiesStep } from './PrioritiesStep';
import { CROP_KNOWLEDGE_BASE } from '../../engine/crops';
import { ClimateObservation } from '../../types';
import { ProvenanceTag } from '../Common/ProvenanceTag';
import { ConfidenceBadge } from '../Common/ConfidenceBadge';
import { QuestionsTopBar } from './QuestionsTopBar';
import {
  loadWizardDraft,
  saveWizardDraft,
  clearWizardDraft,
  determineWizardResumeStep,
} from '../../store/farmStorage';
import { getSoilTextureProfile } from '../../engine/soilEngine';

interface WizardContainerProps {
  answers: FarmAnswers;
  onChangeAnswers: (newAnswers: FarmAnswers) => void;
  onRunAnalysis: () => void;
  onExit: () => void;
  climateData: ClimateObservation;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenGuide?: () => void;
  initialStep?: StepKey;
}

type StepKey =
  | 'location'
  | 'soil'
  | 'water'
  | 'crops'
  | 'horizon'
  | 'priorities'
  | 'sharpen_intro'
  | 'sharpen_exclusions'
  | 'sharpen_ph'
  | 'sharpen_drainage'
  | 'sharpen_tillage'
  | 'sharpen_risk'
  | 'review';

const STEP_SEQUENCE: StepKey[] = [
  'location',
  'soil',
  'water',
  'crops',
  'horizon',
  'priorities',
  'sharpen_intro',
  'sharpen_exclusions',
  'sharpen_ph',
  'sharpen_drainage',
  'sharpen_tillage',
  'sharpen_risk',
  'review',
];

const STEP_TITLES: Record<StepKey, string> = {
  location: 'Farm Location',
  soil: 'Soil Texture',
  water: 'Water Supply',
  crops: 'Crop History',
  horizon: 'Planning Horizon',
  priorities: 'Farm Priorities',
  sharpen_intro: 'Optional Tuning',
  sharpen_exclusions: 'Excluded Crops',
  sharpen_ph: 'Soil pH',
  sharpen_drainage: 'Field Drainage',
  sharpen_tillage: 'Tillage Method',
  sharpen_risk: 'Risk Preference',
  review: 'Review & Confirm',
};

export const WizardContainer: React.FC<WizardContainerProps> = ({
  answers,
  onChangeAnswers,
  onRunAnalysis,
  onExit,
  climateData,
  theme = 'dark',
  onToggleTheme,
  onOpenGuide,
  initialStep,
}) => {
  const [currentStep, setCurrentStep] = useState<StepKey>(initialStep || 'location');
  const [inlineEditingField, setInlineEditingField] = useState<string | null>(null);
  const [hasResumedDraft, setHasResumedDraft] = useState(false);

  // Resume Draft on Mount (unless an explicit initialStep like 'review' is given)
  React.useEffect(() => {
    if (initialStep) {
      setCurrentStep(initialStep);
      return;
    }
    const draft = loadWizardDraft();
    if (draft && draft.answers) {
      onChangeAnswers(draft.answers);
      if (draft.isComplete) {
        setCurrentStep('review');
      } else {
        const stepNum = determineWizardResumeStep(draft.answers);
        const targetStep = STEP_SEQUENCE[Math.min(STEP_SEQUENCE.length - 1, stepNum - 1)];
        setCurrentStep(targetStep);
      }
      setHasResumedDraft(true);
    }
  }, [initialStep]);

  const stepIndex = STEP_SEQUENCE.indexOf(currentStep);
  const totalCoreSteps = 6;
  const isCore = stepIndex < totalCoreSteps;

  // Persist draft on every step or answer change
  React.useEffect(() => {
    saveWizardDraft({
      currentStep: stepIndex,
      answers,
      isComplete: currentStep === 'review',
      lastSavedAt: new Date().toISOString(),
    });
  }, [answers, currentStep, stepIndex]);

  const handleStartFresh = () => {
    clearWizardDraft();
    setHasResumedDraft(false);
    setCurrentStep('location');
  };

  const goNext = () => {
    if (stepIndex < STEP_SEQUENCE.length - 1) {
      setCurrentStep(STEP_SEQUENCE[stepIndex + 1]);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setCurrentStep(STEP_SEQUENCE[stepIndex - 1]);
    } else {
      onExit();
    }
  };

  const jumpToReview = () => {
    setCurrentStep('review');
  };

  const handleRunAnalysisWrapped = () => {
    if (!answers.farmName?.trim()) {
      setCurrentStep('location');
      return;
    }
    clearWizardDraft();
    onRunAnalysis();
  };

  // Answer updater helper
  const update = (patch: Partial<FarmAnswers>) => {
    onChangeAnswers({
      ...answers,
      ...patch,
    });
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Backspace' || (e.shiftKey && e.key === 'Enter')) {
        goBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepIndex]);

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* Dedicated Clean Glassified Questions Nav Bar */}
      <QuestionsTopBar
        currentStepIndex={stepIndex}
        totalSteps={totalCoreSteps}
        stepTitle={STEP_TITLES[currentStep] || 'Question'}
        isReview={currentStep === 'review'}
        onBack={goBack}
        onExit={onExit}
        onJumpToReview={jumpToReview}
        theme={theme}
        onToggleTheme={onToggleTheme || (() => {})}
        onOpenGuide={onOpenGuide}
      />

      <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex-1 space-y-4">
        {hasResumedDraft && (
          <div className="px-4 py-2.5 rounded-xl bg-[#27D7B2]/15 border border-[#27D7B2]/40 text-xs text-[#27D7B2] flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Resumed from your saved progress. All answers automatically preserved.</span>
            </div>
            <button
              type="button"
              onClick={handleStartFresh}
              className="text-xs text-white/80 hover:text-white underline font-semibold ml-4 cursor-pointer"
            >
              Start Fresh
            </button>
          </div>
        )}

        {/* Main Card with Smooth Animated Step Transitions and Glass Layers */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl border border-emerald-500/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
            {/* Render question based on currentStep */}
            {currentStep === 'location' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Name Your Farm &amp; Location
                  </h1>
                  <p className="text-sm text-slate-400 mt-1.5">
                    Before testing any analysis, you must name your farm so it always shows across My Farms and in all recommendations.
                  </p>
                </div>

                {/* Required Farm Name Input */}
                <div className="p-4 sm:p-5 rounded-2xl glass-card shadow-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-[#27D7B2]" />
                      <span>Farm Name <span className="text-[#27D7B2] font-mono">*</span></span>
                    </label>
                    <span className="text-[11px] font-mono text-[#27D7B2] font-semibold">
                      Required for My Farms
                    </span>
                  </div>
                  <input
                    type="text"
                    value={answers.farmName ?? ''}
                    placeholder="e.g. Al Marjan Farm, North Valley Parcel, Green Field 1"
                    onChange={(e) => update({ farmName: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#020A10]/90 border border-[#27D7B2]/40 focus:border-[#27D7B2] focus:ring-1 focus:ring-[#27D7B2] text-sm sm:text-base font-semibold text-white placeholder-slate-500 outline-none transition-all"
                  />
                  {!answers.farmName?.trim() && (
                    <p className="text-xs text-amber-300 flex items-center gap-1.5 pt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>Please name your farm before testing analysis so the name shows for My Farms always.</span>
                    </p>
                  )}
                </div>

                <FarmMapPicker
                  lat={answers.lat}
                  lon={answers.lon}
                  locationName={answers.locationName}
                  onChangeLocation={(lat, lon, name) => {
                    update({
                      lat,
                      lon,
                      locationName: name,
                      locationConfirmed: true,
                    });
                  }}
                />

                <div className="flex justify-end pt-4 border-t border-white/10">
                  <button
                    type="button"
                    disabled={!answers.farmName?.trim()}
                    onClick={() => {
                      if (!answers.farmName?.trim()) return;
                      goNext();
                    }}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all cursor-pointer shadow-lg ${
                      answers.farmName?.trim()
                        ? 'text-[#031923] bg-gradient-to-r from-[#27D7B2] to-[#3CCFB5] hover:brightness-110 shadow-[0_0_15px_rgba(39,215,178,0.3)]'
                        : 'text-slate-400 bg-white/10 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>Confirm Name &amp; Location</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

        {currentStep === 'soil' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                What is your soil texture like?
              </h1>
              <p className="text-sm text-slate-400 mt-1.5">
                Soil texture determines moisture-holding capacity, nutrient leaching rates, and root aeration.
              </p>
            </div>

            {/* Visual soil texture cards with tactile squeeze-test hint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <SoilCard
                title="Loam"
                hint="Crumbles easily, feels smooth and slightly gritty. Optimal balance."
                active={answers.soilTextureConfirmed && answers.soilTexture === 'loam'}
                onSelect={() => {
                  if (answers.soilTextureConfirmed && answers.soilTexture === 'loam') {
                    update({ soilTexture: 'unknown', soilTextureConfirmed: false });
                  } else {
                    update({ soilTexture: 'loam', soilTextureConfirmed: true });
                  }
                }}
              />
              <SoilCard
                title="Silt Loam"
                hint="Feels like flour or silk when dry, smooth when wet. High water retention."
                active={answers.soilTextureConfirmed && answers.soilTexture === 'silt_loam'}
                onSelect={() => {
                  if (answers.soilTextureConfirmed && answers.soilTexture === 'silt_loam') {
                    update({ soilTexture: 'unknown', soilTextureConfirmed: false });
                  } else {
                    update({ soilTexture: 'silt_loam', soilTextureConfirmed: true });
                  }
                }}
              />
              <SoilCard
                title="Clay Loam"
                hint="Forms a firm ball when squeezed; somewhat sticky when wet."
                active={answers.soilTextureConfirmed && answers.soilTexture === 'clay_loam'}
                onSelect={() => {
                  if (answers.soilTextureConfirmed && answers.soilTexture === 'clay_loam') {
                    update({ soilTexture: 'unknown', soilTextureConfirmed: false });
                  } else {
                    update({ soilTexture: 'clay_loam', soilTextureConfirmed: true });
                  }
                }}
              />
              <SoilCard
                title="Sandy Loam"
                hint="Gritty feel with enough silt/clay to hold together lightly."
                active={answers.soilTextureConfirmed && answers.soilTexture === 'sandy_loam'}
                onSelect={() => {
                  if (answers.soilTextureConfirmed && answers.soilTexture === 'sandy_loam') {
                    update({ soilTexture: 'unknown', soilTextureConfirmed: false });
                  } else {
                    update({ soilTexture: 'sandy_loam', soilTextureConfirmed: true });
                  }
                }}
              />
              <SoilCard
                title="Clay"
                hint="Heavy, sticky when wet, cracks when dry. Slow drainage."
                active={answers.soilTextureConfirmed && answers.soilTexture === 'clay'}
                onSelect={() => {
                  if (answers.soilTextureConfirmed && answers.soilTexture === 'clay') {
                    update({ soilTexture: 'unknown', soilTextureConfirmed: false });
                  } else {
                    update({ soilTexture: 'clay', soilTextureConfirmed: true });
                  }
                }}
              />
              <SoilCard
                title="Sandy"
                hint="Very gritty, falls apart immediately when squeezed dry."
                active={answers.soilTextureConfirmed && answers.soilTexture === 'sandy'}
                onSelect={() => {
                  if (answers.soilTextureConfirmed && answers.soilTexture === 'sandy') {
                    update({ soilTexture: 'unknown', soilTextureConfirmed: false });
                  } else {
                    update({ soilTexture: 'sandy', soilTextureConfirmed: true });
                  }
                }}
              />
            </div>

            {/* Item 1: Soil Texture Profile */}
            {answers.soilTexture && answers.soilTexture !== 'unknown' && answers.soilTextureConfirmed && (() => {
              const profile = getSoilTextureProfile(answers.soilTexture, answers.soilOrganicMatterPct ?? 2.4);
              return (
                <div className="p-4 sm:p-5 rounded-2xl glass-card space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                        Soil Texture Profile: {profile.label}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Selected by Farmer
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-xl glass-card space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">Water Retention (AWC)</span>
                      <span className="text-sm font-bold text-white">{profile.availableWaterCapacityMmPerM} mm/m</span>
                      <span className="text-[10px] text-emerald-400 block font-sans">Field Cap: {profile.fieldCapacityVolPct}%</span>
                    </div>

                    <div className="p-2.5 rounded-xl glass-card space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">Drainage Rate (Ksat)</span>
                      <span className="text-sm font-bold text-white">{profile.saturatedHydraulicConductivityMmHr} mm/hr</span>
                      <span className="text-[10px] text-slate-300 block font-sans">{profile.drainageClass}</span>
                    </div>

                    <div className="p-2.5 rounded-xl glass-card space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">Drought Buffer</span>
                      <span className="text-sm font-bold text-emerald-400">~{profile.droughtBufferDays} Days</span>
                      <span className="text-[10px] text-slate-400 block font-sans">under peak 5mm/d ET</span>
                    </div>

                    <div className="p-2.5 rounded-xl glass-card space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">Aeration Rating</span>
                      <span className="text-sm font-bold text-white">{profile.aerationRating}</span>
                      <span className="text-[10px] text-slate-400 block font-sans">{profile.compactionSusceptibility} compaction</span>
                    </div>
                  </div>

                  {/* Crop Suitability & Water-Stress Context */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-xl glass-card space-y-1">
                      <span className="text-slate-200 font-semibold block text-xs">Crop Suitability:</span>
                      <div className="text-slate-400 text-[11px] leading-relaxed">
                        <strong className="text-emerald-400">High suitability:</strong> {profile.suitableCropTypes.join(', ')}.
                        {profile.challengingCropTypes.length > 0 && (
                          <span className="block mt-1 text-slate-400">
                            <strong className="text-amber-400">Watch:</strong> {profile.challengingCropTypes.join(', ')}.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl glass-card space-y-1">
                      <span className="text-slate-200 font-semibold block text-xs">Water-Stress Context:</span>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {profile.waterStressContext}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-4 border-t border-white/10 gap-3">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    update({ soilTexture: 'loam', soilTextureConfirmed: false });
                    goNext();
                  }}
                  className="text-xs text-slate-400 hover:text-slate-300 hidden sm:inline"
                >
                  Not sure? Use regional satellite estimate (Loam)
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'water' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                How do you water your crops?
              </h1>
              <p className="text-sm text-slate-400 mt-1.5">
                We calibrate drought stress penalties according to whether your crops rely strictly on rainfall
                or supplemental irrigation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <OptionCard
                title="Rain-fed Only"
                description="Rely entirely on seasonal rainfall and stored soil moisture."
                active={answers.irrigationMode === 'rain_only'}
                onSelect={() =>
                  update({
                    irrigationMode: answers.irrigationMode === 'rain_only' ? 'not_sure' : 'rain_only',
                  })
                }
              />
              <OptionCard
                title="Rain + Supplemental Irrigation"
                description="Irrigate during dry periods or critical crop growth stages."
                active={answers.irrigationMode === 'rain_and_irrigation'}
                onSelect={() =>
                  update({
                    irrigationMode:
                      answers.irrigationMode === 'rain_and_irrigation' ? 'not_sure' : 'rain_and_irrigation',
                  })
                }
              />
              <OptionCard
                title="Full Irrigation"
                description="High-frequency pivot, drip, or furrow irrigation system."
                active={answers.irrigationMode === 'irrigation_only'}
                onSelect={() =>
                  update({
                    irrigationMode:
                      answers.irrigationMode === 'irrigation_only' ? 'not_sure' : 'irrigation_only',
                  })
                }
              />
            </div>

            {/* Conditional Follow-up if irrigated */}
            {(answers.irrigationMode === 'rain_and_irrigation' ||
              answers.irrigationMode === 'irrigation_only') && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-4 animate-in fade-in duration-200">
                <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
                  Irrigation Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Water supply reliability</label>
                    <select
                      value={answers.waterReliability ?? 'mostly'}
                      onChange={(e) => update({ waterReliability: e.target.value as any })}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
                    >
                      <option value="very_reliable">Very reliable (unrestricted)</option>
                      <option value="mostly">Mostly reliable</option>
                      <option value="often_short">Often short during heatwaves</option>
                      <option value="unpredictable">Unpredictable / restricted</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Seasonal quota limit (optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="e.g. 350"
                        value={answers.seasonalWaterQuotaMm ?? ''}
                        onChange={(e) =>
                          update({
                            seasonalWaterQuotaMm: e.target.value ? parseInt(e.target.value, 10) : null,
                          })
                        }
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
                      />
                      <span className="text-xs text-slate-400 font-mono">mm/season</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'crops' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                What have you grown recently?
              </h1>
              <p className="text-sm text-slate-400 mt-1.5">
                This initializes your soil's nitrogen balance, disease carryover state, and root-break intervals.
              </p>
            </div>

            {/* Toggle between Historical Crops vs No crops (Fallow/New field) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  if (answers.cropHistory.length === 0) {
                    update({
                      cropHistory: [
                        { seasonIndex: 1, seasonLabel: 'Last Season', cropId: 'winter_wheat', performance: 'good' },
                        { seasonIndex: 2, seasonLabel: '2 Seasons Ago', cropId: 'soybean', performance: 'good' },
                      ],
                    });
                  }
                }}
                className={`p-5 rounded-2xl text-left border transition-all cursor-pointer ${
                  answers.cropHistory.length > 0
                    ? 'border-emerald-400/70 bg-emerald-500/[0.12] shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/50'
                    : 'border-white/[0.08] hover:border-white/[0.18] bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base sm:text-lg font-bold text-white">I have grown crops before</span>
                  {answers.cropHistory.length > 0 && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-sm text-slate-300">
                  Record crops from your last 1–3 seasons to model disease breaks and carryover fertility.
                </p>
              </button>

              <button
                type="button"
                onClick={() => update({ cropHistory: [] })}
                className={`p-5 rounded-2xl text-left border transition-all cursor-pointer ${
                  answers.cropHistory.length === 0
                    ? 'border-emerald-400/70 bg-emerald-500/[0.12] shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/50'
                    : 'border-white/[0.08] hover:border-white/[0.18] bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base sm:text-lg font-bold text-white">No crops recently · Rested Land or New Field</span>
                  {answers.cropHistory.length === 0 && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-sm text-slate-300">
                  Virgin ground, rested fallow parcel, or newly managed land without recent cultivation.
                </p>
              </button>
            </div>

            {/* If No Crops selected */}
            {answers.cropHistory.length === 0 ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-base">
                  <Sprout className="w-5 h-5 shrink-0" />
                  <span>Rested Fallow or Fresh Parcel Initialized</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  The rotation engine will model your field without disease or nematode carryover, assuming balanced baseline native nitrogen reserves.
                </p>
              </div>
            ) : (
              /* Crop History Repeater */
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase">Reported Seasons</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = answers.cropHistory.length + 1;
                      update({
                        cropHistory: [
                          ...answers.cropHistory,
                          {
                            seasonIndex: nextIdx,
                            seasonLabel: `${nextIdx} Seasons Ago`,
                            cropId: 'spring_barley',
                            performance: 'good',
                          },
                        ],
                      });
                    }}
                    className="text-xs font-semibold text-[#27D7B2] hover:underline cursor-pointer"
                  >
                    + Add another season
                  </button>
                </div>

                {answers.cropHistory.map((historyItem, idx) => (
                  <div
                    key={historyItem.seasonIndex}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex flex-wrap items-center justify-between gap-3"
                  >
                    <span className="text-xs font-mono text-slate-300 w-28 font-semibold">
                      {historyItem.seasonLabel}
                    </span>

                    <div className="flex-1 min-w-[200px]">
                      <select
                        aria-label={`Select crop for ${historyItem.seasonLabel}`}
                        value={historyItem.cropId}
                        onChange={(e) => {
                          const newHist = [...answers.cropHistory];
                          newHist[idx] = { ...newHist[idx], cropId: e.target.value };
                          update({ cropHistory: newHist });
                        }}
                        className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-sm text-white focus:outline-none"
                      >
                        {Object.values(CROP_KNOWLEDGE_BASE).map((crop) => (
                          <option key={crop.id} value={crop.id}>
                            {crop.name} ({crop.family})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 mr-1">Yield:</span>
                      {(['good', 'ok', 'poor'] as const).map((perf) => (
                        <button
                          key={perf}
                          type="button"
                          onClick={() => {
                            const newHist = [...answers.cropHistory];
                            newHist[idx] = { ...newHist[idx], performance: perf };
                            update({ cropHistory: newHist });
                          }}
                          className={`px-2.5 py-1 text-xs rounded border capitalize transition-colors cursor-pointer ${
                            historyItem.performance === perf
                              ? 'bg-indigo-600/30 border-indigo-400 text-white font-semibold'
                              : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {perf}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'horizon' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                How far ahead do you want to plan?
              </h1>
              <p className="text-sm text-slate-400 mt-1.5">
                Set your rotation timeline. Or let Field Shift calculate the natural steady-state agronomic cycle length.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <OptionCard
                title="Let Field Shift Decide (Recommended)"
                description="The engine identifies the natural agronomic cycle (typically 3–5 seasons) where soil N and SOM stabilize."
                active={answers.planningHorizon === 'auto'}
                onSelect={() => update({ planningHorizon: 'auto' })}
              />
              <OptionCard
                title="3 Seasons"
                description="Short-term planning horizon for quick rotation turnaround."
                active={answers.planningHorizon === '3_seasons'}
                onSelect={() =>
                  update({
                    planningHorizon: answers.planningHorizon === '3_seasons' ? 'auto' : '3_seasons',
                  })
                }
              />
              <OptionCard
                title="5 Seasons"
                description="Medium multi-year horizon allowing complete pulse-cereal-oilseed cycles."
                active={answers.planningHorizon === '5_seasons'}
                onSelect={() =>
                  update({
                    planningHorizon: answers.planningHorizon === '5_seasons' ? 'auto' : '5_seasons',
                  })
                }
              />
              <OptionCard
                title="3 Years"
                description="Calendar-based planning spanning 3 full agricultural years."
                active={answers.planningHorizon === '3_years'}
                onSelect={() =>
                  update({
                    planningHorizon: answers.planningHorizon === '3_years' ? 'auto' : '3_years',
                  })
                }
              />
              <OptionCard
                title="5 Years"
                description="Longer strategic perspective for building deep soil carbon pools."
                active={answers.planningHorizon === '5_years'}
                onSelect={() =>
                  update({
                    planningHorizon: answers.planningHorizon === '5_years' ? 'auto' : '5_years',
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'priorities' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                What matters most to you?
              </h1>
              <p className="text-sm text-slate-400 mt-1.5">
                Adjust the five priorities. The engine will transparently weight candidates while enforcing hard
                sustainability safety floors.
              </p>
            </div>

            <PrioritiesStep
              priorities={answers.priorities}
              onChangePriorities={(newP) => update({ priorities: newP })}
              farmAnswers={answers}
              climateData={climateData}
            />

            <div className="flex items-center justify-between pt-4 border-t border-white/10 gap-3">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={jumpToReview}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium hidden sm:inline"
                >
                  Skip optional details → Get recommendations now
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
                >
                  <span>Sharpen Accuracy (Optional)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'sharpen_intro' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-400 uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Optional Accuracy Stage
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Would you like to sharpen accuracy?
              </h1>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                You have answered all required core questions! You can either view your recommendations
                immediately or answer 4 quick optional questions (like soil pH, tillage, and exclusions)
                to boost confidence from <strong>Moderate</strong> to <strong>High</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <button
                type="button"
                onClick={jumpToReview}
                className="p-5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-white/20 text-left transition-all cursor-pointer group"
              >
                <div className="font-semibold text-white group-hover:text-indigo-200 text-base">
                  Get my recommendations now
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Jump directly to the review screen and generate rotations with satellite defaults.
                </div>
              </button>

              <button
                type="button"
                onClick={goNext}
                className="p-5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 hover:border-indigo-400 text-left transition-all cursor-pointer group"
              >
                <div className="font-semibold text-indigo-300 text-base flex items-center justify-between">
                  <span>Add a few details for higher accuracy</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Provide pH, drainage, or equipment limits to eliminate unsuitable crops.
                </div>
              </button>
            </div>
          </div>
        )}

        {currentStep === 'sharpen_exclusions' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Any crops you can't or won't grow?
              </h1>
              <p className="text-sm text-slate-400 mt-1.5">
                Hard-exclude crops due to missing machinery, seed unviability, or local marketing constraints.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.values(CROP_KNOWLEDGE_BASE).map((crop) => {
                const isExcluded = answers.excludedCropIds?.includes(crop.id);
                return (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => {
                      const current = answers.excludedCropIds || [];
                      update({
                        excludedCropIds: isExcluded
                          ? current.filter((id) => id !== crop.id)
                          : [...current, crop.id],
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isExcluded
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 line-through'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    {crop.name}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 border border-white/10 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-2">
                <button type="button" onClick={goNext} className="text-xs text-slate-400 hover:text-slate-300 mr-2">
                  Skip this question
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'sharpen_ph' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Do you know your soil pH?</h1>
              <p className="text-sm text-slate-400 mt-1.5">
                Most agricultural crops thrive between 6.0 and 7.5. Outside this range, nutrient availability shifts.
              </p>
            </div>

            <div className="max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300 font-medium">Soil pH Value</span>
                <span className="text-base font-mono font-bold text-sky-400">
                  {answers.soilPh ? answers.soilPh.toFixed(1) : 'Not specified'}
                </span>
              </div>
              <input
                type="range"
                min="4.5"
                max="9.0"
                step="0.1"
                value={answers.soilPh ?? 6.6}
                onChange={(e) => update({ soilPh: parseFloat(e.target.value), soilPhEstimated: false })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>4.5 (Acidic)</span>
                <span>6.5 (Neutral)</span>
                <span>8.5 (Alkaline)</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 border border-white/10 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    update({ soilPh: 6.6, soilPhEstimated: true });
                    goNext();
                  }}
                  className="text-xs text-slate-400 hover:text-slate-300 mr-2"
                >
                  I don't know (Estimate 6.6)
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'sharpen_drainage' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                How well does water drain from your field?
              </h1>
              <p className="text-sm text-slate-400 mt-1.5">
                Detects waterlogging risks for sensitive pulses and cereals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <OptionCard
                title="Drains Fast"
                description="Water infiltrates very quickly; drought-prone sandy character."
                active={answers.drainageClass === 'fast'}
                onSelect={() => update({ drainageClass: 'fast' })}
              />
              <OptionCard
                title="Drains Well (Optimal)"
                description="Puddles disappear within 12–24 hours after intense rains."
                active={answers.drainageClass === 'good'}
                onSelect={() => update({ drainageClass: 'good' })}
              />
              <OptionCard
                title="Slow, Stays Wet"
                description="Water stands in lower areas for several days."
                active={answers.drainageClass === 'slow'}
                onSelect={() => update({ drainageClass: 'slow' })}
              />
              <OptionCard
                title="Often Waterlogged"
                description="High water table or impermeable hardpan layer."
                active={answers.drainageClass === 'waterlogged'}
                onSelect={() => update({ drainageClass: 'waterlogged' })}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 border border-white/10 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-2">
                <button type="button" onClick={goNext} className="text-xs text-slate-400 hover:text-slate-300 mr-2">
                  Skip
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'sharpen_tillage' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">How do you prepare the soil?</h1>
              <p className="text-sm text-slate-400 mt-1.5">
                Tillage alters soil organic matter decomposition and moisture evaporation rates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <OptionCard
                title="Full / Inversion Tillage"
                description="Moldboard plow or deep disk tillage."
                active={answers.tillagePractice === 'full'}
                onSelect={() => update({ tillagePractice: 'full' })}
              />
              <OptionCard
                title="Reduced / Strip Tillage"
                description="Chisel plow, vertical tillage, or strip till."
                active={answers.tillagePractice === 'reduced'}
                onSelect={() => update({ tillagePractice: 'reduced' })}
              />
              <OptionCard
                title="No-Till / Continuous Cover"
                description="Zero disturbance direct seeding into standing residue."
                active={answers.tillagePractice === 'no_till'}
                onSelect={() => update({ tillagePractice: 'no_till' })}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 border border-white/10 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-2">
                <button type="button" onClick={goNext} className="text-xs text-slate-400 hover:text-slate-300 mr-2">
                  Skip
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'sharpen_risk' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                How do you feel about climate risk?
              </h1>
              <p className="text-sm text-slate-400 mt-1.5">
                Calibrates the downside penalty in your objective function across simulated historical drought years.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <OptionCard
                title="Steady & Predictable"
                description="Avoid downside shortfalls in dry years, even if mean harvest is slightly lower."
                active={answers.riskAttitude === 'steady'}
                onSelect={() => update({ riskAttitude: 'steady' })}
              />
              <OptionCard
                title="Balanced Approach"
                description="Reasonable balance between upside potential and drought buffering."
                active={answers.riskAttitude === 'balanced'}
                onSelect={() => update({ riskAttitude: 'balanced' })}
              />
              <OptionCard
                title="Willing to Gamble for Upside"
                description="Optimize for peak favorable-year harvest yields."
                active={answers.riskAttitude === 'upside'}
                onSelect={() => update({ riskAttitude: 'upside' })}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={jumpToReview}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
              >
                <span>Proceed to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* REVIEW PAGE (Section 5.2 MUST) */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Review & Confirm Profile
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Everything is editable in place. When ready, run the NASA Earth observation analysis engine.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <ConfidenceBadge level={answers.soilTexture === 'unknown' ? 'Moderate' : 'High'} />
              </div>
            </div>

            {/* Review sections */}
            <div className="space-y-4">
              {/* Farm Name Row */}
              <ReviewRow
                label="Farm Name"
                value={answers.farmName || 'Untitled Farm'}
                provenanceTag="You provided"
                onEdit={() => setCurrentStep('location')}
              />

              {/* Location Row */}
              <ReviewRow
                label="Farm Location"
                value={answers.locationName}
                provenanceTag="You confirmed"
                onEdit={() => setCurrentStep('location')}
              />

              {/* Soil Texture Row */}
              <ReviewRow
                label="Soil Texture"
                value={answers.soilTexture.replace('_', ' ').toUpperCase()}
                provenanceTag={answers.soilTextureConfirmed ? 'You provided' : 'Estimated prior'}
                onEdit={() => setCurrentStep('soil')}
              />

              {/* Water Mode Row */}
              <ReviewRow
                label="Water & Irrigation"
                value={
                  answers.irrigationMode === 'rain_only'
                    ? 'Rain-fed Only'
                    : answers.irrigationMode === 'rain_and_irrigation'
                    ? `Rain + Irrigation (${answers.waterReliability ?? 'mostly'})`
                    : 'Full Irrigation'
                }
                provenanceTag="You provided"
                onEdit={() => setCurrentStep('water')}
              />

              {/* Crop History */}
              <ReviewRow
                label="Recent Crop History"
                value={answers.cropHistory
                  .map((h) => CROP_KNOWLEDGE_BASE[h.cropId]?.name || h.cropId)
                  .join(' → ')}
                provenanceTag="You provided"
                onEdit={() => setCurrentStep('crops')}
              />

              {/* Planning Horizon */}
              <ReviewRow
                label="Planning Horizon"
                value={answers.planningHorizon === 'auto' ? 'Field Shift Decides (Auto Cycle)' : answers.planningHorizon}
                provenanceTag="You provided"
                onEdit={() => setCurrentStep('horizon')}
              />

              {/* Priorities */}
              <ReviewRow
                label="Primary Decision Driver"
                value={`Water: ${answers.priorities.waterSaving}/4 · Soil: ${answers.priorities.soilHealth}/4 · Resilience: ${answers.priorities.climateResilience}/4`}
                provenanceTag="You provided"
                onEdit={() => setCurrentStep('priorities')}
              />

              {/* Soil pH */}
              <ReviewRow
                label="Soil pH"
                value={answers.soilPh ? `${answers.soilPh.toFixed(1)}` : '6.6 (Estimated)'}
                provenanceTag={answers.soilPhEstimated ? 'Estimated' : 'You provided'}
                onEdit={() => setCurrentStep('sharpen_ph')}
              />

              {/* Tillage */}
              <ReviewRow
                label="Tillage Practice"
                value={answers.tillagePractice ? answers.tillagePractice.replace('_', ' ') : 'Reduced (Default)'}
                provenanceTag="You provided"
                onEdit={() => setCurrentStep('sharpen_tillage')}
              />
            </div>

            {/* Run Analysis Action Button */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep('priorities')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Questions</span>
              </button>

              <button
                type="button"
                onClick={handleRunAnalysisWrapped}
                className="w-full sm:w-auto px-8 py-3.5 rounded-[12px] font-bold text-[#07130C] bg-[#83C58E] hover:bg-[#97D4A2] shadow-lg shadow-[#83C58E]/25 transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-98"
              >
                <Sparkles className="w-5 h-5 text-[#07130C]" />
                <span className="text-base font-bold">Run NASA Multi-Season Analysis</span>
              </button>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  </div>
  );
};

interface ReviewRowProps {
  label: string;
  value: string;
  provenanceTag: string;
  onEdit: () => void;
}

const ReviewRow: React.FC<ReviewRowProps> = ({ label, value, provenanceTag, onEdit }) => {
  return (
    <div className="p-4 rounded-2xl glass-card-interactive flex items-center justify-between gap-4">
      <div>
        <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">{label}</div>
        <div className="text-base font-bold text-white mt-1">{value}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <ProvenanceTag label={provenanceTag} source="FARMER" />
        <button
          type="button"
          onClick={onEdit}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
          title={`Edit ${label}`}
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface SoilCardProps {
  title: string;
  hint: string;
  active: boolean;
  onSelect: () => void;
}

const SoilCard: React.FC<SoilCardProps> = ({ title, hint, active, onSelect }) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`p-5 sm:p-6 min-h-[130px] rounded-[16px] text-left transition-all cursor-pointer flex flex-col justify-between glass-card ${
        active
          ? 'border-[#27D7B2] shadow-md ring-1 ring-[#27D7B2]/40 bg-emerald-500/15'
          : 'glass-card-hover'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-base sm:text-lg font-bold text-[#F1F6EF] tracking-tight">{title}</span>
        {active && <CheckCircle2 className="w-5 h-5 text-[#27D7B2] shrink-0" />}
      </div>
      <p className="text-xs sm:text-sm text-[#C0CEC2] leading-relaxed mt-1">{hint}</p>
    </button>
  );
};

interface OptionCardProps {
  title: string;
  description: string;
  active: boolean;
  onSelect: () => void;
}

const OptionCard: React.FC<OptionCardProps> = ({ title, description, active, onSelect }) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`p-5 sm:p-6 min-h-[130px] rounded-[16px] text-left transition-all cursor-pointer flex flex-col justify-between glass-card ${
        active
          ? 'border-[#27D7B2] shadow-md ring-1 ring-[#27D7B2]/40 bg-emerald-500/15'
          : 'glass-card-hover'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-base sm:text-lg font-bold text-[#F1F6EF] tracking-tight">{title}</span>
        {active && <Check className="w-5 h-5 text-[#27D7B2] shrink-0" />}
      </div>
      <p className="text-xs sm:text-sm text-[#C0CEC2] leading-relaxed mt-1">{description}</p>
    </button>
  );
};

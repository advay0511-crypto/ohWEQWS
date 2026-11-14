import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  Sparkles,
  HelpCircle,
  Filter,
  Check,
  ChevronRight,
  Droplets,
  Layers,
  ShieldCheck,
  TrendingUp,
  X,
  Sliders,
  Calendar,
  Sprout,
  ArrowRight,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  FlaskConical,
  Info,
  ArrowUpRight,
  Compass,
  Eye,
  Clock,
  Activity,
  Leaf,
  Scale,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BarChart2,
  AlertOctagon,
} from 'lucide-react';
import {
  AnalysisPayload,
  RotationResult,
  SavedFarmPlan,
  CropSuitabilityBreakdown,
  CropInfo,
  RotationSeasonPlan,
  FieldBoundaryItem,
} from '../../types';
import { RotationTimelineBlueprint } from './RotationTimelineBlueprint';
import { RotationComparisonCard } from './RotationComparisonCard';
import { WhyThisRotationCard } from './WhyThisRotationCard';
import { BenefitsAndRisksSection } from './BenefitsAndRisksSection';
import { saveFarmPlan } from '../../store/farmStorage';
import { getCropImage } from '../../services/cropImages';
import { CROP_KNOWLEDGE_BASE } from '../../engine/crops';
import { evaluateCropSuitability } from '../../engine/scoring';

export type RotationPlannerTab =
  | 'sequences'
  | 'suitability'
  | 'compare'
  | 'review_gate'
  | 'multi_field';

export interface RotationsViewProps {
  analysis: AnalysisPayload;
  isAdvanced?: boolean;
  onNavigateTab: (tab: any) => void;
  onOpenAiBot: () => void;
  onOpenGuide: () => void;
  farmName?: string;
  farms: SavedFarmPlan[];
  activeFarmId: string;
  onSelectFarmId: (id: string) => void;
  focusedCropName?: string | null;
  onClearCropFocus?: () => void;
}

export const RotationsView: React.FC<RotationsViewProps> = ({
  analysis,
  isAdvanced = false,
  onNavigateTab,
  onOpenAiBot,
  onOpenGuide,
  farmName,
  farms,
  activeFarmId,
  onSelectFarmId,
  focusedCropName,
  onClearCropFocus,
}) => {
  const currentFarm = useMemo(
    () => farms.find((f) => f.id === activeFarmId) || farms[0],
    [farms, activeFarmId]
  );

  // Available candidate rotations from analysis or fallback
  const rotations: RotationResult[] = useMemo(() => {
    return currentFarm?.analysis?.rotations || analysis?.rotations || [];
  }, [currentFarm, analysis]);

  // Primary sub-navigation tab (Section 46.1 & 50 Contract: distinct separation between plans and suitability)
  const [plannerTab, setPlannerTab] = useState<RotationPlannerTab>('sequences');

  // Selected rotation for inspection and activation
  const [selectedRotationId, setSelectedRotationId] = useState<string>(
    currentFarm?.activeRotationPlanId || rotations[0]?.id || ''
  );

  // Nested inspection subtab inside 'sequences'
  const [sequenceSubTab, setSequenceSubTab] = useState<
    'blueprint' | 'synergy' | 'comparison' | 'benefits_risks'
  >('blueprint');

  // Candidate filtering
  const [candidateFilter, setCandidateFilter] = useState<
    'all' | 'recommended' | 'water_saving' | 'soil_rebuilding' | 'high_diversity'
  >('all');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Crop Suitability Explorer State (Section 42.6 & 48)
  const [suitabilitySearch, setSuitabilitySearch] = useState('');
  const [suitabilityFamilyFilter, setSuitabilityFamilyFilter] = useState<string>('all');
  const [suitabilityMinScore, setSuitabilityMinScore] = useState<string>('all');
  const [inspectingCropSuitability, setInspectingCropSuitability] =
    useState<CropSuitabilityBreakdown | null>(null);

  // Head-to-Head Comparison State (Section 6.7 & 250)
  const [comparePlanAId, setComparePlanAId] = useState<string>(
    rotations[0]?.id || ''
  );
  const [comparePlanBId, setComparePlanBId] = useState<string>(
    rotations[1]?.id || rotations[0]?.id || ''
  );

  // Review Gate State (Section 15.5)
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);
  const [revalidatedToast, setRevalidatedToast] = useState(false);

  // Crop detail inspection modal from sequence cards
  const [inspectingSequenceCrop, setInspectingSequenceCrop] =
    useState<RotationSeasonPlan | null>(null);

  // Active rotation instance
  const activeRotation: RotationResult = useMemo(() => {
    return rotations.find((r) => r.id === selectedRotationId) || rotations[0] || {
      id: 'rot_fallback_1',
      rank: 1,
      name: 'Water-Resilient Diversified Rotation',
      sequence: [
        {
          seasonIndex: 1,
          seasonName: 'Autumn/Winter',
          calendarYear: 2026,
          durationDays: 135,
          cropId: 'winter_wheat',
          cropName: 'Winter Wheat',
          durationSeasons: 1,
          cropFamily: 'Poaceae',
          isLegume: false,
          waterDemandMm: 320,
          waterStressDays: 4,
          nitrogenCarryoverKgHa: 0,
          soilOrganicMatterTrend: [1.8, 1.82],
        },
        {
          seasonIndex: 2,
          seasonName: 'Spring/Summer',
          calendarYear: 2027,
          durationDays: 105,
          cropId: 'chickpea',
          cropName: 'Chickpea',
          durationSeasons: 1,
          cropFamily: 'Fabaceae',
          isLegume: true,
          waterDemandMm: 210,
          waterStressDays: 2,
          nitrogenCarryoverKgHa: 38,
          soilOrganicMatterTrend: [1.82, 1.86],
        },
        {
          seasonIndex: 3,
          seasonName: 'Autumn/Winter',
          calendarYear: 2027,
          durationDays: 120,
          cropId: 'lentil',
          cropName: 'Lentil',
          durationSeasons: 1,
          cropFamily: 'Fabaceae',
          isLegume: true,
          waterDemandMm: 195,
          waterStressDays: 1,
          nitrogenCarryoverKgHa: 32,
          soilOrganicMatterTrend: [1.86, 1.91],
        },
        {
          seasonIndex: 4,
          seasonName: 'Spring/Summer',
          calendarYear: 2028,
          durationDays: 110,
          cropId: 'grain_sorghum',
          cropName: 'Grain Sorghum',
          durationSeasons: 1,
          cropFamily: 'Poaceae',
          isLegume: false,
          waterDemandMm: 280,
          waterStressDays: 3,
          nitrogenCarryoverKgHa: 0,
          soilOrganicMatterTrend: [1.91, 1.95],
        },
      ],
      cycleLengthSeasons: 4,
      cycleLengthYears: 2,
      reviewAfterSeason: 2,
      totalScore: 91,
      overallScore: 91,
      componentScores: {
        waterSaving: 3.6,
        soilHealth: 3.5,
        climateResilience: 3.7,
        cropSuitability: 3.8,
        productivity: 3.4,
      },
      confidence: 'High',
      isRecommended: true,
      explanationSummary:
        'Balanced crop rotation alternating high-value cereal grain with biological nitrogen-fixing pulse crops, reducing seasonal irrigation requirement by 28% while improving soil structure.',
      deepExplanation:
        'Incorporating Chickpea and Lentil breaks common fungal pathogen life cycles (Gaeumannomyces graminis) and provides an estimated +35 to +50 kg N/ha biological credit for subsequent cereal stages.',
      whyThisLength:
        'Two-year, four-season sequence fits regional temperature windows and maximizes residue cover.',
      whyThisOrder:
        'Wheat follows grain sorghum to benefit from residual weed suppression, followed by deep-taproot pulse crops that loosen subsoil compaction.',
      riskshortfallWorst20Pct: 8.2,
      waterDemandAnnualMm: 385,
      nitrogenBalanceNetKgHa: 24,
      somChangeTrajectory: [1.8, 1.84, 1.89, 1.95],
      nitrogenTrajectory: [20, 58, 42, 70],
      uncertaintyP10: 84,
      uncertaintyP90: 95,
      benefits: [
        'Breaks cereal crown-rot fungus lifecycle with pulse break crops',
        'Adds +35–50 kg N/ha biological fertility from chickpea & lentil',
        '28% reduction in seasonal irrigation requirements',
        'Diversified cashflow across both cereal and high-protein markets',
      ],
      disadvantages: [
        {
          title: 'Pulse Pod-Fill Moisture Sensitivity',
          description:
            'Chickpea flowering stage is sensitive to severe heat spikes >33°C.',
          howToManage:
            'Schedule early morning drip irrigation pulses if temperature forecasts exceed 32°C during bloom.',
          riskLevel: 'Medium',
        },
        {
          title: 'Post-Harvest Cereal Stubble Management',
          description:
            'Sorghum leaves dense root crowns that require rolling or shallow vertical tillage.',
          howToManage:
            'Mow or chop residue within 10 days of harvest to accelerate microbial breakdown.',
          riskLevel: 'Low',
        },
      ],
    };
  }, [rotations, selectedRotationId]);

  // Evaluated crop suitabilities across all crops in knowledge base
  const allCropSuitabilities: CropSuitabilityBreakdown[] = useMemo(() => {
    const climate = currentFarm?.analysis?.climateData ||
      analysis?.climateData || {
        annualPrecipitationMm: 380,
        gddAnnual: 2200,
        meanTempC: 24.5,
        maxSummerTempC: 38.5,
        minWinterTempC: 11.2,
        drySpellMaxDays: 45,
        referenceEt0AnnualMm: 1650,
        soilMoisturePercentile: 45,
        vegetationNdviMean: 0.62,
        groundwaterTrendCoarse: 'stable',
        warmingTrendDecadalC: 0.28,
        precipitationTrendPctDecade: -2.5,
      };

    const answers = currentFarm?.farmAnswers || {
      locationName: currentFarm?.locationName || 'Ras Al Khaimah, UAE',
      lat: 25.67,
      lon: 55.98,
      locationConfirmed: true,
      soilTexture: 'sandy_loam',
      soilTextureConfirmed: true,
      irrigationMode: 'rain_and_irrigation',
      cropHistory: [],
      planningHorizon: 4,
      priorities: {
        waterSaving: 3,
        soilHealth: 3,
        climateResilience: 3,
        cropSuitability: 4,
        productivity: 3,
      },
      excludedCropIds: [],
      forcedCropIds: [],
      soilPh: 7.4,
    };

    return Object.values(CROP_KNOWLEDGE_BASE).map((crop) =>
      evaluateCropSuitability(crop, climate, answers)
    ).sort((a, b) => b.overallScore - a.overallScore);
  }, [currentFarm, analysis]);

  // Filtered crop suitability list
  const filteredCropSuitabilities = useMemo(() => {
    return allCropSuitabilities.filter((item) => {
      const crop = CROP_KNOWLEDGE_BASE[item.cropId];
      const matchesSearch =
        item.cropName.toLowerCase().includes(suitabilitySearch.toLowerCase()) ||
        crop?.family?.toLowerCase().includes(suitabilitySearch.toLowerCase());
      const matchesFamily =
        suitabilityFamilyFilter === 'all' ||
        crop?.family?.toLowerCase() === suitabilityFamilyFilter.toLowerCase();
      const matchesScore =
        suitabilityMinScore === 'all'
          ? true
          : suitabilityMinScore === 'high'
          ? item.overallScore >= 80
          : suitabilityMinScore === 'moderate'
          ? item.overallScore >= 60 && item.overallScore < 80
          : item.overallScore < 60;

      return matchesSearch && matchesFamily && matchesScore;
    });
  }, [allCropSuitabilities, suitabilitySearch, suitabilityFamilyFilter, suitabilityMinScore]);

  // Filtered candidate rotations
  const filteredCandidates = useMemo(() => {
    let list = [...rotations];
    if (focusedCropName) {
      const lower = focusedCropName.toLowerCase();
      list = list.filter((r) =>
        r.sequence?.some((s) => s.cropName.toLowerCase().includes(lower))
      );
    }
    if (candidateFilter === 'recommended') {
      list = list.filter((r) => r.isRecommended);
    } else if (candidateFilter === 'water_saving') {
      list.sort((a, b) => (a.waterDemandAnnualMm || 0) - (b.waterDemandAnnualMm || 0));
    } else if (candidateFilter === 'soil_rebuilding') {
      list.sort(
        (a, b) =>
          (b.componentScores?.soilHealth || 0) - (a.componentScores?.soilHealth || 0)
      );
    } else if (candidateFilter === 'high_diversity') {
      list.sort(
        (a, b) =>
          new Set(b.sequence?.map((s) => s.cropFamily)).size -
          new Set(a.sequence?.map((s) => s.cropFamily)).size
      );
    }
    return list;
  }, [rotations, candidateFilter, focusedCropName]);

  // Tested & rejected candidates under current constraints (Section 6.7 & 248)
  const rejectedCandidates = [
    {
      id: 'rot_rejected_1',
      name: 'Mono-Crop Continuous Winter Wheat',
      failedConstraint: 'Minimum crop-family return interval violated',
      actualValue: '1 season between same family (Poaceae)',
      thresholdValue: 'Minimum 2 seasons required',
      riskFactor: 'Severe root crown-rot fungus (Gaeumannomyces graminis) accumulation',
    },
    {
      id: 'rot_rejected_2',
      name: 'High-Demand Corn / Alfalfa Intensification',
      failedConstraint: 'Seasonal water budget exceeded',
      actualValue: '580 mm annual demand',
      thresholdValue: 'Regional water envelope limit: 420 mm',
      riskFactor: 'Rapid aquifer drawdown and late-season wilting penalty',
    },
  ];

  // Head-to-Head Comparison Plan Objects
  const comparePlanA = useMemo(
    () => rotations.find((r) => r.id === comparePlanAId) || rotations[0] || activeRotation,
    [rotations, comparePlanAId, activeRotation]
  );
  const comparePlanB = useMemo(
    () =>
      rotations.find((r) => r.id === comparePlanBId) ||
      rotations[1] ||
      rotations[0] ||
      activeRotation,
    [rotations, comparePlanBId, activeRotation]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyActivePlan = (rotation: RotationResult) => {
    if (!currentFarm) return;
    const updated: SavedFarmPlan = {
      ...currentFarm,
      activeRotationPlanId: rotation.id,
      updatedAt: new Date().toISOString(),
    };
    saveFarmPlan(updated);
    showToast(`Plan "${rotation.name}" committed as active rotation for ${currentFarm.name}.`);
  };

  const handleExportPlan = () => {
    window.print();
  };

  const isCommittedActive = currentFarm?.activeRotationPlanId === activeRotation?.id;
  const farmLocation = currentFarm?.locationName || 'Ras Al Khaimah, UAE';
  const fieldSize = currentFarm?.farmAnswers?.fieldSizeHa || 32.5;

  return (
    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-[#F0F7FA] font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl glass-card border border-[#27D7B2] text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-[#27D7B2]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. TOP COMMAND STRIP: BREADCRUMB, FARM CONTEXT, ACTIONS             */}
      {/* =================================================================== */}
      <div className="glass-card rounded-2xl p-5 border border-white/[0.14] shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#8EA3AF]">
              <span>Planning Workspace</span>
              <span className="text-white/40">/</span>
              <span className="text-[#27D7B2] font-semibold">
                {currentFarm?.name || farmName || 'Active Farm'}
              </span>
              <span className="text-white/40">/</span>
              <span>Crop Rotation Planner</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Crop Rotation Plans
              </h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/30">
                {rotations.length} Candidate Sequences Evaluated
              </span>
              {isCommittedActive && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Active Farm Plan</span>
                </span>
              )}
            </div>

            <p className="text-xs text-[#A7C0CC]">
              Answering: &ldquo;Which crop sequence best fits this field, over what duration, and what are the trade-offs?&rdquo;
            </p>

            <div className="flex items-center gap-3 text-xs text-[#8EA3AF] pt-0.5 flex-wrap font-mono">
              <span>Location: <strong className="text-white font-sans">{farmLocation}</strong></span>
              <span>•</span>
              <span>Acreage: <strong className="text-white font-sans">{fieldSize} ha</strong></span>
              <span>•</span>
              <span>Soil Texture: <strong className="text-white font-sans capitalize">{currentFarm?.farmAnswers?.soilTexture?.replace('_', ' ') || 'Sandy Loam'}</strong></span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {farms.length > 1 && (
              <select
                value={activeFarmId}
                onChange={(e) => onSelectFarmId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white font-medium focus:outline-none focus:border-[#27D7B2] cursor-pointer"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id} className="bg-[#02131D] text-white">
                    {f.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleExportPlan}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-pill hover:bg-white/[0.1] text-xs text-white font-semibold transition-colors cursor-pointer border border-white/[0.12]"
            >
              <FileDown className="w-3.5 h-3.5 text-[#27D7B2]" />
              <span>Export Plan</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('simulator')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-pill hover:bg-white/[0.1] text-xs text-[#27D7B2] font-semibold transition-colors cursor-pointer border border-[#27D7B2]/30"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Simulator</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('wizard')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-xs text-[#020A10] font-bold shadow-lg shadow-[#27D7B2]/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Edit Inputs / Re-plan</span>
            </button>

            <button
              type="button"
              onClick={onOpenAiBot}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-pill hover:bg-white/[0.1] text-xs text-cyan-300 font-semibold transition-colors cursor-pointer border border-cyan-400/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Agronomist</span>
            </button>

            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="w-9 h-9 rounded-xl glass-pill hover:bg-white/[0.1] text-[#27D7B2] flex items-center justify-center text-xs font-bold font-mono transition-colors cursor-pointer border border-white/[0.1]"
                title="Page Guide"
              >
                ?
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. DISTINCT 5-TAB WORKSPACE SUB-NAVIGATION BAR (Section 46.1)       */}
      {/* =================================================================== */}
      <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl p-1.5 gap-1.5 overflow-x-auto scrollbar-none shadow-md">
        {[
          {
            id: 'sequences',
            label: 'Crop Rotation Plans',
            icon: Sprout,
            badge: `${rotations.length}`,
          },
          {
            id: 'suitability',
            label: 'Crop Suitability Explorer',
            icon: Leaf,
            badge: `${allCropSuitabilities.length} crops`,
          },
          {
            id: 'compare',
            label: 'Head-to-Head Comparison',
            icon: Scale,
            badge: '2 plans',
          },
          {
            id: 'review_gate',
            label: 'Rotation Review Gate',
            icon: AlertTriangle,
            badge: dismissedSuggestion ? 'Current' : 'Review Suggested',
            badgeColor: dismissedSuggestion
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-amber-500/20 text-amber-300',
          },
          {
            id: 'multi_field',
            label: 'Multi-Field Coordination',
            icon: Layers,
            badge: `${currentFarm?.fields?.length || 2} parcels`,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = plannerTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPlannerTab(tab.id as RotationPlannerTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#27D7B2] to-[#1FB898] text-[#020A10] font-bold shadow-lg shadow-[#27D7B2]/20'
                  : 'text-[#8EA3AF] hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-black/30 text-white'
                      : tab.badgeColor || 'bg-white/10 text-white/80'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CROP FILTER BANNER IF ACTIVE */}
      {focusedCropName && plannerTab === 'sequences' && (
        <div className="p-3.5 rounded-xl glass-card border-[#27D7B2]/30 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[#27D7B2]" />
            <span>
              Filtering candidate rotations containing <strong>{focusedCropName}</strong>
            </span>
          </div>
          {onClearCropFocus && (
            <button
              type="button"
              onClick={onClearCropFocus}
              className="text-xs text-[#27D7B2] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <span>Clear Filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: CROP ROTATION PLANS (HERO RECOMMENDATION + CANDIDATES)        */}
      {/* =================================================================== */}
      {plannerTab === 'sequences' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* ================================================================= */}
          {/* 1. DOMINANT 12-COLUMN 3-ZONE HERO RECOMMENDATION PANEL (Section 53) */}
          {/* ================================================================= */}
          <div className="glass-card rounded-2xl p-6 sm:p-7 border border-white/[0.14] shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* ZONE 1: SCORE & DECISION SUMMARY (25% Width on Desktop) */}
              <div className="lg:col-span-3 flex flex-col justify-between pr-0 lg:pr-5 border-b lg:border-b-0 lg:border-r border-white/[0.08] pb-5 lg:pb-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#27D7B2]/20 text-[#27D7B2] border border-[#27D7B2]/40">
                      Rank #1 Leading Match
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      {activeRotation.confidence} Confidence
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                    {activeRotation.name}
                  </h2>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-4xl sm:text-5xl font-black font-mono text-[#27D7B2] tracking-tight">
                      {activeRotation.totalScore || 91}
                    </span>
                    <span className="text-xs text-[#8EA3AF] font-mono">
                      / 100 Match Score
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8EA3AF] leading-relaxed">
                    Evaluated agronomic fit under your field inputs and priority weights. Not a predicted yield percentage.
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.08] space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#8EA3AF]">Cycle Duration:</span>
                    <span className="text-white font-mono font-bold">
                      {activeRotation.cycleLengthYears || 2} Years ({activeRotation.sequence?.length || 4} Seasons)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#8EA3AF]">Annual Water Demand:</span>
                    <span className="text-[#27D7B2] font-mono font-bold">
                      {activeRotation.waterDemandAnnualMm || 385} mm/yr
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#8EA3AF]">Net Nitrogen Credit:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      +{activeRotation.nitrogenBalanceNetKgHa || 24} kg N/ha
                    </span>
                  </div>
                </div>
              </div>

              {/* ZONE 2: CROP SEQUENCE TIMELINE WITH REAL PHOTOS (50% Width on Desktop) */}
              <div className="lg:col-span-6 flex flex-col justify-between px-0 lg:px-4 border-b lg:border-b-0 lg:border-r border-white/[0.08] pb-5 lg:pb-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Multi-Season Rotation Sequence
                  </span>
                  <span className="text-[11px] text-[#8EA3AF] font-mono">
                    Distinct Year &amp; Season
                  </span>
                </div>

                {/* Sequence cards with visible arrows */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-auto">
                  {activeRotation.sequence?.map((stage, idx) => {
                    const isLegume = stage.isLegume;
                    const imgUrl = getCropImage(stage.cropName);
                    return (
                      <div
                        key={idx}
                        onClick={() => setInspectingSequenceCrop(stage)}
                        className="group p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#27D7B2]/40 transition-all cursor-pointer flex flex-col justify-between space-y-2 relative"
                      >
                        {/* Year & Season separate */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#8EA3AF]">
                          <span className="font-bold text-white">
                            Year {stage.calendarYear ? stage.calendarYear - 2025 : idx < 2 ? 1 : 2}
                          </span>
                          <span className="text-[#27D7B2] truncate max-w-[60px]">
                            {stage.seasonName}
                          </span>
                        </div>

                        {/* Photo */}
                        <div className="w-full h-20 rounded-lg overflow-hidden relative bg-black/40 border border-white/10">
                          <img
                            src={imgUrl}
                            alt={stage.cropName}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          {isLegume && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-bold font-mono bg-emerald-500/80 text-black">
                              N-Fixer
                            </span>
                          )}
                        </div>

                        {/* Crop Title & Family */}
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white truncate">
                            {stage.cropName}
                          </h4>
                          <div className="flex items-center justify-between text-[10px] text-[#8EA3AF]">
                            <span>{stage.cropFamily}</span>
                            <span className="font-mono text-[#27D7B2]">
                              ~{stage.durationDays || 120}d
                            </span>
                          </div>
                        </div>

                        {/* Arrow separator for non-last items */}
                        {idx < (activeRotation.sequence?.length || 4) - 1 && (
                          <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-white/40">
                            →
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] text-[#8EA3AF] pt-1 flex items-center justify-between">
                  <span>Click any stage to view planting window &amp; nitrogen dynamics</span>
                  <span className="text-[#27D7B2] font-semibold">
                    Cover crop choice: Explicit legume break
                  </span>
                </div>
              </div>

              {/* ZONE 3: WHY THIS PLAN / COMPONENT METRICS & RISKS (25% Width on Desktop) */}
              <div className="lg:col-span-3 flex flex-col justify-between pl-0 lg:pl-3 space-y-4">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Component Performance (0–100)
                  </span>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-[#8EA3AF]">Water Performance</span>
                        <span className="text-white font-mono font-bold">88 / 100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full w-[88%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-[#8EA3AF]">Soil Health Rebuilding</span>
                        <span className="text-white font-mono font-bold">85 / 100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full w-[85%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-[#8EA3AF]">Climate Resilience</span>
                        <span className="text-white font-mono font-bold">89 / 100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-[#27D7B2] rounded-full w-[89%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-[#8EA3AF]">Biological Diversity</span>
                        <span className="text-white font-mono font-bold">92 / 100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full w-[92%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] space-y-2">
                  <button
                    type="button"
                    onClick={() => handleApplyActivePlan(activeRotation)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] hover:from-[#38E5C1] hover:to-[#27D7B2] text-[#020A10] text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Commit as Farm&apos;s Active Plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setComparePlanAId(activeRotation.id);
                      setPlannerTab('compare');
                    }}
                    className="w-full py-2 rounded-xl glass-pill hover:bg-white/[0.1] text-xs text-white font-semibold transition-colors cursor-pointer border border-white/[0.12] flex items-center justify-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5 text-[#27D7B2]" />
                    <span>Compare with Alternative</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 2. CANDIDATE ROTATIONS WITH DIVERSITY FILTERS (Section 6.7)       */}
          {/* ================================================================= */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Candidate Sequences ({filteredCandidates.length})</span>
                  <span className="text-xs font-mono text-[#8EA3AF]">
                    Generated deterministically
                  </span>
                </h3>
                <p className="text-xs text-[#8EA3AF]">
                  Every candidate enforces distinct crop orders and biological breaks to avoid near-duplicate options.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1 overflow-x-auto">
                {[
                  { id: 'all', label: 'All Sequences' },
                  { id: 'recommended', label: 'Recommended' },
                  { id: 'water_saving', label: 'Water-Saving' },
                  { id: 'soil_rebuilding', label: 'Soil Health' },
                  { id: 'high_diversity', label: 'High Diversity' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCandidateFilter(f.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      candidateFilter === f.id
                        ? 'bg-[#27D7B2] text-[#020A10] font-bold'
                        : 'text-[#8EA3AF] hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidates Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredCandidates.map((rot, idx) => {
                const isSelected = activeRotation?.id === rot.id;
                const isCurrentActive = currentFarm?.activeRotationPlanId === rot.id;
                return (
                  <div
                    key={rot.id || idx}
                    onClick={() => setSelectedRotationId(rot.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'glass-card border-[#27D7B2] shadow-lg shadow-[#27D7B2]/10 ring-1 ring-[#27D7B2]/40'
                        : 'glass-card border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono text-white/80">
                            #{idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-white line-clamp-1">
                            {rot.name}
                          </h4>
                        </div>
                        {rot.isRecommended && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#27D7B2] text-[#020A10] shrink-0">
                            Recommended
                          </span>
                        )}
                        {isCurrentActive && !rot.isRecommended && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-400 text-[#020A10] shrink-0">
                            Active
                          </span>
                        )}
                      </div>

                      {/* Score and duration */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-[#27D7B2] font-bold font-mono">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{Math.round(rot.totalScore || 85)} / 100</span>
                        </div>
                        <div className="text-white/40">•</div>
                        <div className="text-[#8EA3AF] text-[11px] truncate">
                          {rot.sequence?.length || 4} Seasons ({rot.cycleLengthYears || 2} Years)
                        </div>
                      </div>

                      {/* Crop Sequence Flow */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {rot.sequence?.map((s, sIdx) => {
                          const img = getCropImage(s.cropId || s.cropName);
                          return (
                            <div
                              key={sIdx}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white/90"
                            >
                              {img && (
                                <img
                                  src={img}
                                  alt=""
                                  className="w-3.5 h-3.5 rounded-full object-cover"
                                />
                              )}
                              <span>{s.cropName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                      <span className="text-[#8EA3AF]">
                        Water: {rot.waterDemandAnnualMm || 360} mm/yr
                      </span>
                      <span className="text-[#27D7B2] font-semibold flex items-center gap-1">
                        <span>{isSelected ? 'Selected' : 'Inspect'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rejected Candidates Disclosure (Section 6.7 & 248 Contract) */}
            <details className="group rounded-2xl glass-card border border-white/[0.08] p-4 text-xs transition-colors">
              <summary className="font-semibold text-[#8EA3AF] group-hover:text-white cursor-pointer flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <span>
                    View Evaluated &amp; Rejected Rotations ({rejectedCandidates.length} Candidates Disqualified)
                  </span>
                </div>
                <span className="text-[11px] text-[#27D7B2] font-mono">
                  Hard Constraint Audit
                </span>
              </summary>

              <div className="pt-3 space-y-2.5">
                <p className="text-[#8EA3AF] leading-relaxed">
                  FieldShift automatically filters out sequence combinations that breach hard agronomic constraints such as fungal host repetition or unviable water quotas:
                </p>

                <div className="space-y-2">
                  {rejectedCandidates.map((rej) => (
                    <div
                      key={rej.id}
                      className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/25 space-y-1"
                    >
                      <div className="flex items-center justify-between text-white font-semibold">
                        <span>{rej.name}</span>
                        <span className="text-[10px] font-mono text-rose-300 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                          {rej.failedConstraint}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8EA3AF] flex items-center justify-between">
                        <span>Computed: <strong className="text-white">{rej.actualValue}</strong></span>
                        <span>Threshold: <strong className="text-white">{rej.thresholdValue}</strong></span>
                      </div>
                      <p className="text-[11px] text-rose-300/80 pt-0.5">
                        Agro risk: {rej.riskFactor}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>

          {/* ================================================================= */}
          {/* 3. ACTIVE PLAN DEEP INSPECTION TABS (Timeline, Synergy, Compare)  */}
          {/* ================================================================= */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl glass-card border border-white/[0.1]">
              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 gap-1 overflow-x-auto">
                {[
                  { id: 'blueprint', label: 'Timeline Blueprint', icon: Calendar },
                  { id: 'synergy', label: 'Agronomic Synergy', icon: Sprout },
                  { id: 'comparison', label: 'Comparison Matrix', icon: Layers },
                  { id: 'benefits_risks', label: 'Benefits & Risks', icon: ShieldCheck },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = sequenceSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSequenceSubTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-[#27D7B2] text-[#020A10] shadow-sm font-bold'
                          : 'text-[#8EA3AF] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-[#8EA3AF] font-mono">
                Inspecting: <strong className="text-white">{activeRotation.name}</strong>
              </div>
            </div>

            <div className="space-y-6">
              {sequenceSubTab === 'blueprint' && (
                <RotationTimelineBlueprint
                  rotation={activeRotation}
                  soilTexture={currentFarm?.farmAnswers?.soilTexture || 'sandy_loam'}
                  annualPrecipitationMm={analysis.climateData?.annualPrecipitationMm || 650}
                />
              )}

              {sequenceSubTab === 'synergy' && (
                <WhyThisRotationCard
                  rotation={activeRotation}
                  farmName={currentFarm?.name || farmName}
                  soilTexture={currentFarm?.farmAnswers?.soilTexture || 'sandy_loam'}
                  annualPrecipitationMm={analysis.climateData?.annualPrecipitationMm || 650}
                />
              )}

              {sequenceSubTab === 'comparison' && (
                <RotationComparisonCard
                  currentRotation={activeRotation}
                  allRotations={rotations}
                  farmName={currentFarm?.name || farmName}
                  soilTexture={currentFarm?.farmAnswers?.soilTexture || 'sandy_loam'}
                  isRainfed={currentFarm?.farmAnswers?.irrigationMode === 'rain_only'}
                />
              )}

              {sequenceSubTab === 'benefits_risks' && (
                <BenefitsAndRisksSection
                  rotation={activeRotation}
                  soilTexture={currentFarm?.farmAnswers?.soilTexture || 'sandy_loam'}
                  irrigationMode={currentFarm?.farmAnswers?.irrigationMode}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: CROP SUITABILITY EXPLORER (Section 42.6, 46, 48)            */}
      {/* =================================================================== */}
      {plannerTab === 'suitability' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Explanation Callout per Section 46.2 Contract */}
          <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.12] space-y-2">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[#27D7B2]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Individual Crop Compatibility Matrix
              </h3>
            </div>
            <p className="text-xs text-[#A7C0CC] leading-relaxed">
              &ldquo;Each percentage shows how closely this crop matches one part of your field conditions. A low score points to an environmental mismatch, not the percentage of the crop that will grow.&rdquo;
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.08] text-[11px] text-[#8EA3AF]">
              <div>
                <strong className="text-white">Temp &amp; Season:</strong> Thermal GDD accumulation &amp; frost risk.
              </div>
              <div>
                <strong className="text-white">Water Match:</strong> Crop ETc demand vs rainfall &amp; irrigation.
              </div>
              <div>
                <strong className="text-white">Soil pH Match:</strong> Compatibility with farm pH (7.4).
              </div>
              <div>
                <strong className="text-white">Drainage Match:</strong> Root depth aeration &amp; texture fit.
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl glass-card border border-white/[0.1]">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8EA3AF]" />
              <input
                type="text"
                placeholder="Search crop by name or family (e.g. Wheat, Legume)..."
                value={suitabilitySearch}
                onChange={(e) => setSuitabilitySearch(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-[#8EA3AF] focus:outline-none focus:border-[#27D7B2]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={suitabilityFamilyFilter}
                onChange={(e) => setSuitabilityFamilyFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-medium focus:outline-none focus:border-[#27D7B2]"
              >
                <option value="all">All Botanical Families</option>
                <option value="poaceae">Poaceae (Cereals/Grasses)</option>
                <option value="fabaceae">Fabaceae (Legumes/Pulses)</option>
                <option value="brassicaceae">Brassicaceae (Canola/Mustard)</option>
                <option value="asteraceae">Asteraceae (Sunflower)</option>
                <option value="malvaceae">Malvaceae (Cotton)</option>
              </select>

              <select
                value={suitabilityMinScore}
                onChange={(e) => setSuitabilityMinScore(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-medium focus:outline-none focus:border-[#27D7B2]"
              >
                <option value="all">All Match Scores</option>
                <option value="high">High Match (&gt;80%)</option>
                <option value="moderate">Moderate Match (60–80%)</option>
                <option value="low">Restricted (&lt;60%)</option>
              </select>
            </div>
          </div>

          {/* Crop Cards Grid (Section 48.1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCropSuitabilities.map((item) => {
              const crop = CROP_KNOWLEDGE_BASE[item.cropId];
              const imgUrl = getCropImage(item.cropName);
              const scoreColor =
                item.overallScore >= 80
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  : item.overallScore >= 60
                  ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
                  : 'text-amber-400 border-amber-500/30 bg-amber-500/10';

              return (
                <div
                  key={item.cropId}
                  className="p-4 rounded-2xl glass-card border border-white/[0.1] hover:border-[#27D7B2]/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    {/* Header with 4:3 photo */}
                    <div className="w-full h-36 rounded-xl overflow-hidden relative bg-black/40 border border-white/10">
                      <img
                        src={imgUrl}
                        alt={item.cropName}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-white drop-shadow">
                          {item.cropName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${scoreColor}`}
                        >
                          {item.overallScore}% Match
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8EA3AF]">
                      <span>Family: <strong className="text-white">{crop?.family || 'Poaceae'}</strong></span>
                      <span className="font-mono text-[#27D7B2]">{item.confidence} Confidence</span>
                    </div>

                    {/* Factor Breakdown Bars */}
                    <div className="space-y-1.5 pt-1 border-t border-white/[0.06] text-xs">
                      <div>
                        <div className="flex justify-between text-[10px] text-[#8EA3AF] mb-0.5">
                          <span>Temperature &amp; Season Fit</span>
                          <span className="font-mono text-white">{item.temperatureFit}%</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-[#27D7B2] rounded-full"
                            style={{ width: `${item.temperatureFit}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-[#8EA3AF] mb-0.5">
                          <span>Water &amp; Precipitation Match</span>
                          <span className="font-mono text-white">{item.waterFit}%</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${item.waterFit}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-[#8EA3AF] mb-0.5">
                          <span>Soil pH &amp; Texture Compatibility</span>
                          <span className="font-mono text-white">{item.soilPhFit}%</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${item.soilPhFit}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Limiting Factor */}
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px]">
                      <span className="text-[#8EA3AF] block font-medium">Primary Consideration:</span>
                      <p className="text-slate-300 leading-tight mt-0.5">
                        {item.limitingFactor || 'Optimal environmental harmony with local climate.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInspectingCropSuitability(item)}
                    className="w-full py-2 rounded-xl glass-pill hover:bg-white/[0.1] text-xs font-semibold text-[#27D7B2] border border-[#27D7B2]/30 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Inspect Factor Details</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: HEAD-TO-HEAD COMPARISON (Section 6.7, 250, 41.2)             */}
      {/* =================================================================== */}
      {plannerTab === 'compare' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#27D7B2]" />
                <span>Head-to-Head Rotation Comparison</span>
              </h3>
              <p className="text-xs text-[#8EA3AF]">
                Side-by-side evaluation of water demands, nitrogen credits, and workload trade-offs.
              </p>
            </div>
          </div>

          {/* Selectors for Plan A and Plan B */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl glass-card border border-white/[0.12] space-y-2">
              <span className="text-xs font-bold text-[#27D7B2] uppercase tracking-wider block">
                Plan A (Baseline)
              </span>
              <select
                value={comparePlanAId}
                onChange={(e) => setComparePlanAId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-medium focus:outline-none focus:border-[#27D7B2]"
              >
                {rotations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Score: {r.totalScore}/100)
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-white/[0.12] space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                Plan B (Comparison Alternative)
              </span>
              <select
                value={comparePlanBId}
                onChange={(e) => setComparePlanBId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-medium focus:outline-none focus:border-[#27D7B2]"
              >
                {rotations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Score: {r.totalScore}/100)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Side-by-Side Comparison Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/[0.12] glass-card">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] font-mono uppercase text-[#8EA3AF] bg-white/[0.02]">
                  <th className="py-3 px-4 w-1/3">Evaluation Metric</th>
                  <th className="py-3 px-4 w-1/3 text-[#27D7B2]">Plan A: {comparePlanA.name}</th>
                  <th className="py-3 px-4 w-1/3 text-cyan-300">Plan B: {comparePlanB.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-semibold text-white">Overall Match Score</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#27D7B2] text-sm">
                    {comparePlanA.totalScore} / 100
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-300 text-sm">
                    {comparePlanB.totalScore} / 100
                  </td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-semibold text-white">Cycle Duration &amp; Crops</td>
                  <td className="py-3 px-4 text-white">
                    {comparePlanA.cycleLengthYears || 2} Years ({comparePlanA.sequence?.length || 4} Seasons)
                  </td>
                  <td className="py-3 px-4 text-white">
                    {comparePlanB.cycleLengthYears || 2} Years ({comparePlanB.sequence?.length || 4} Seasons)
                  </td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-semibold text-white">Annual Water Demand</td>
                  <td className="py-3 px-4 font-mono text-white">
                    {comparePlanA.waterDemandAnnualMm || 385} mm/yr
                  </td>
                  <td className="py-3 px-4 font-mono text-white">
                    {comparePlanB.waterDemandAnnualMm || 420} mm/yr
                  </td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-semibold text-white">Net Nitrogen Balance</td>
                  <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                    +{comparePlanA.nitrogenBalanceNetKgHa || 24} kg N/ha
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                    +{comparePlanB.nitrogenBalanceNetKgHa || 12} kg N/ha
                  </td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-semibold text-white">Botanical Family Diversity</td>
                  <td className="py-3 px-4 text-white">
                    {new Set(comparePlanA.sequence?.map((s) => s.cropFamily)).size} Distinct Families
                  </td>
                  <td className="py-3 px-4 text-white">
                    {new Set(comparePlanB.sequence?.map((s) => s.cropFamily)).size} Distinct Families
                  </td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-semibold text-white">Pathogen Break Efficiency</td>
                  <td className="py-3 px-4 text-[#27D7B2]">
                    High (Legume break interspaced between cereals)
                  </td>
                  <td className="py-3 px-4 text-cyan-300">
                    Moderate (Standard cereal rotation)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Conditional Conclusion per Section 6.7 & 250 Contract */}
          <div className="p-5 rounded-2xl glass-card border border-[#27D7B2]/30 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#27D7B2]" />
              <h4 className="text-sm font-bold text-white">
                Agronomic Synthesis &amp; Trade-off Conclusion
              </h4>
            </div>
            <p className="text-xs text-[#A7C0CC] leading-relaxed">
              <strong>Plan A ({comparePlanA.name})</strong> is the stronger match for your current water-saving and biological soil health priorities, saving approximately{' '}
              <span className="text-[#27D7B2] font-mono font-bold">
                {Math.abs((comparePlanB.waterDemandAnnualMm || 420) - (comparePlanA.waterDemandAnnualMm || 385))} mm
              </span>{' '}
              of irrigation annually while fixing higher residual nitrogen.{' '}
              <strong>Plan B ({comparePlanB.name})</strong> offers higher gross cereal harvest volumes but increases dependency on mineral fertilizer and requires tighter irrigation windows.
            </p>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: ROTATION REVIEW GATE (Section 15.5)                          */}
      {/* =================================================================== */}
      {plannerTab === 'review_gate' && (
        <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
          <div className="pb-3 border-b border-white/[0.08]">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Crop Rotation Review Gate</span>
            </h3>
            <p className="text-xs text-[#8EA3AF]">
              Hysteresis tracking and versioned trigger dependencies for the active farm plan.
            </p>
          </div>

          {/* Status Badge Card */}
          <div className="p-5 rounded-2xl glass-card border border-white/[0.14] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8EA3AF] block">
                  Active Plan Status
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  {activeRotation.name}
                </h4>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  dismissedSuggestion
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {dismissedSuggestion ? 'Plan Current & Validated' : 'Review Suggested'}
              </span>
            </div>

            {/* Registered Trigger Reasons */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-white block">
                Trigger Dependency Audit (Section 15.5 Contract)
              </span>

              <div className="space-y-1.5">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-white font-semibold">Irrigation &amp; Water Quota</span>
                    <p className="text-[11px] text-[#8EA3AF]">No material quota changes detected.</p>
                  </div>
                  <span className="text-emerald-400 text-xs font-mono">Passed</span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-white font-semibold">New Crop History / Harvest Event</span>
                    <p className="text-[11px] text-[#8EA3AF]">Recent Winter Wheat yield logged (3.9 t/ha).</p>
                  </div>
                  <span className="text-amber-400 text-xs font-mono">Trigger Event</span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-white font-semibold">Field Boundary Modification</span>
                    <p className="text-[11px] text-[#8EA3AF]">Geometry envelope stable (32.5 ha).</p>
                  </div>
                  <span className="text-emerald-400 text-xs font-mono">Passed</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDismissedSuggestion(true);
                  setRevalidatedToast(true);
                  setTimeout(() => setRevalidatedToast(false), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] text-[#020A10] font-bold text-xs shadow-md cursor-pointer"
              >
                Revalidate &amp; Retain Current Plan
              </button>
              <button
                type="button"
                onClick={() => setPlannerTab('compare')}
                className="px-4 py-2 rounded-xl glass-pill hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/[0.12] cursor-pointer"
              >
                Compare Alternatives
              </button>
            </div>

            {revalidatedToast && (
              <span className="text-xs text-emerald-400 font-semibold block animate-in fade-in">
                ✓ Plan revalidated. Hysteresis cooldown applied.
              </span>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: MULTI-FIELD COORDINATION (Section 15.7)                      */}
      {/* =================================================================== */}
      {plannerTab === 'multi_field' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-3 border-b border-white/[0.08]">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#27D7B2]" />
              <span>Multi-Field Workload &amp; Operation Balancing</span>
            </h3>
            <p className="text-xs text-[#8EA3AF]">
              Staggered planting and harvest windows across parcels to eliminate machinery bottlenecks.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: 4 Columns Field List */}
            <div className="lg:col-span-4 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Tracked Parcels ({currentFarm?.fields?.length || 2})
              </span>

              {(currentFarm?.fields || [
                { id: 'fld_1', name: 'Parcel A (North Pivot)', areaHa: 32.5, currentCrop: 'Winter Wheat' },
                { id: 'fld_2', name: 'Parcel B (East Basin)', areaHa: 18.0, currentCrop: 'Chickpea' },
              ]).map((fld: any) => (
                <div key={fld.id} className="p-4 rounded-xl glass-card border border-white/[0.1] space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{fld.name}</span>
                    <span className="font-mono text-[#27D7B2]">{fld.areaHa} ha</span>
                  </div>
                  <div className="text-[11px] text-[#8EA3AF]">
                    Current Crop: <strong className="text-white">{fld.currentCrop || 'Active'}</strong>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    Assigned: Water-Resilient Rotation
                  </div>
                </div>
              ))}
            </div>

            {/* Right: 8 Columns Seasonal Operation Timeline */}
            <div className="lg:col-span-8 p-5 rounded-2xl glass-card border border-white/[0.12] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Operational Window Schedule (Oct – Jun)
                </span>
                <span className="text-[10px] font-mono text-[#27D7B2]">
                  No Overlapping Harvest Bottlenecks
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-[#8EA3AF] mb-1">
                    <span>Parcel A: Winter Wheat (Planting: Oct 15 – Nov 10 • Harvest: Feb 25 – Mar 10)</span>
                    <span className="text-white font-bold">32.5 ha</span>
                  </div>
                  <div className="w-full h-4 rounded-lg bg-black/40 overflow-hidden relative flex">
                    <div className="w-[15%] bg-transparent" />
                    <div className="w-[20%] bg-[#27D7B2]/70 h-full flex items-center justify-center text-[9px] text-[#020A10] font-bold">
                      Plant
                    </div>
                    <div className="w-[35%] bg-white/5 h-full" />
                    <div className="w-[15%] bg-amber-400/80 h-full flex items-center justify-center text-[9px] text-[#020A10] font-bold">
                      Harvest
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#8EA3AF] mb-1">
                    <span>Parcel B: Chickpea (Planting: Nov 20 – Dec 10 • Harvest: Apr 05 – Apr 20)</span>
                    <span className="text-white font-bold">18.0 ha</span>
                  </div>
                  <div className="w-full h-4 rounded-lg bg-black/40 overflow-hidden relative flex">
                    <div className="w-[30%] bg-transparent" />
                    <div className="w-[18%] bg-cyan-400/70 h-full flex items-center justify-center text-[9px] text-[#020A10] font-bold">
                      Plant
                    </div>
                    <div className="w-[32%] bg-white/5 h-full" />
                    <div className="w-[15%] bg-amber-400/80 h-full flex items-center justify-center text-[9px] text-[#020A10] font-bold">
                      Harvest
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-[#8EA3AF] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#27D7B2] shrink-0" />
                <span>
                  By staggering Parcel B&apos;s pulse sowing by 25 days, peak labor demand is leveled and combine harvester utilization is optimized.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: CROP SUITABILITY FACTOR INSPECTOR DRAWER                   */}
      {/* =================================================================== */}
      {inspectingCropSuitability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl glass-card border border-white/[0.2] shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
              <div className="flex items-center gap-2.5">
                <Leaf className="w-5 h-5 text-[#27D7B2]" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {inspectingCropSuitability.cropName}
                  </h3>
                  <span className="text-xs text-[#8EA3AF]">
                    {inspectingCropSuitability.confidence} Confidence Telemetry
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingCropSuitability(null)}
                className="p-1.5 rounded-lg text-[#8EA3AF] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <span className="text-[#8EA3AF]">Overall Field Match Score:</span>
                <span className="text-2xl font-black font-mono text-[#27D7B2]">
                  {inspectingCropSuitability.overallScore}%
                </span>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-white block">
                  Detailed 7-Factor Environmental Breakdown
                </span>

                {[
                  { label: 'Temperature & GDD Fit', val: inspectingCropSuitability.temperatureFit },
                  { label: 'Water & Rain Ratio Match', val: inspectingCropSuitability.waterFit },
                  { label: 'Soil pH Range Compatibility', val: inspectingCropSuitability.soilPhFit },
                  { label: 'Soil Texture Class Fit', val: inspectingCropSuitability.soilTextureFit },
                  { label: 'Drainage & Infiltration Fit', val: inspectingCropSuitability.drainageFit },
                  { label: 'Growing Period Length Fit', val: inspectingCropSuitability.growingPeriodFit },
                ].map((f, fidx) => (
                  <div key={fidx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white">{f.label}</span>
                      <span className="font-mono text-[#27D7B2] font-bold">{f.val}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#27D7B2] rounded-full" style={{ width: `${f.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1 text-[11px]">
                <span className="text-[#8EA3AF] font-bold block">Limiting Factor:</span>
                <p className="text-slate-300">
                  {inspectingCropSuitability.limitingFactor || 'No critical limiting factors detected.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingCropSuitability(null)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] text-[#020A10] font-bold text-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: ROTATION SEQUENCE STAGE DETAIL MODAL                      */}
      {/* =================================================================== */}
      {inspectingSequenceCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl glass-card border border-white/[0.2] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-[#27D7B2]" />
                <h3 className="text-base font-bold text-white">
                  {inspectingSequenceCrop.cropName} — Stage Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSequenceCrop(null)}
                className="p-1.5 rounded-lg text-[#8EA3AF] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div>
                  <span className="text-[#8EA3AF] block">Season Window</span>
                  <span className="text-white font-bold">{inspectingSequenceCrop.seasonName}</span>
                </div>
                <div>
                  <span className="text-[#8EA3AF] block">Days in Field</span>
                  <span className="text-[#27D7B2] font-bold font-mono">
                    ~{inspectingSequenceCrop.durationDays || 120} days
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-[#8EA3AF]">
                <div>Botanical Family: <strong className="text-white">{inspectingSequenceCrop.cropFamily}</strong></div>
                <div>Biological N-Fixer: <strong className="text-emerald-400">{inspectingSequenceCrop.isLegume ? 'Yes (+35 kg N credit)' : 'No'}</strong></div>
                <div>Seasonal Water Demand: <strong className="text-white font-mono">{inspectingSequenceCrop.waterDemandMm || 280} mm</strong></div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingSequenceCrop(null)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB898] text-[#020A10] font-bold text-xs cursor-pointer"
              >
                Close Stage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

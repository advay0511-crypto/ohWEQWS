import React, { useState } from 'react';
import {
  Layers,
  Droplets,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Sprout,
  TrendingDown,
  TrendingUp,
  Info,
  CheckCircle2,
  Calendar,
  Compass,
  ArrowRight,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react';
import { FarmAnswers, ClimateObservation } from '../../types';
import {
  getSoilTextureProfile,
  calculateWaterHoldingCapacity,
  evaluateSoilPhCompatibility,
  evaluateSoilSalinityRisk,
  evaluateSoilOrganicMatter,
  generateSoilHealthDashboard,
  compareCurrentVsHistoricalMoisture,
  evaluateDrainageAndWaterloggingRisk,
  generateSoilBaselineProfile,
  generateSoilAnalysisExplanation,
} from '../../engine/soilEngine';
import { ConfidenceBadge } from '../Common/ConfidenceBadge';
import { ProvenanceTag } from '../Common/ProvenanceTag';

interface SoilBaselineViewProps {
  answers: FarmAnswers;
  climate: ClimateObservation;
  onEditSoil?: () => void;
  className?: string;
}

export const SoilBaselineView: React.FC<SoilBaselineViewProps> = ({
  answers,
  climate,
  onEditSoil,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'health' | 'water' | 'ph-salinity' | 'explanation'>('profile');

  // Compute all scientific models
  const texture = getSoilTextureProfile(answers.soilTexture, answers.soilOrganicMatterPct ?? 2.4);
  const waterCapacity = calculateWaterHoldingCapacity(answers.soilTexture, 1.0, answers.soilOrganicMatterPct ?? 2.4);
  const phReport = evaluateSoilPhCompatibility(answers.soilPh ?? 7.2, answers.soilPhEstimated, answers.hasSoilLabTest);
  const salinityReport = evaluateSoilSalinityRisk(answers.waterSalinity ?? 'good');
  const somReport = evaluateSoilOrganicMatter(answers.soilOrganicMatterPct ?? 2.4, climate.meanTempC);
  const healthDashboard = generateSoilHealthDashboard(answers, climate);
  const moistureComparison = compareCurrentVsHistoricalMoisture(climate);
  const drainageReport = evaluateDrainageAndWaterloggingRisk(answers, climate);
  const baselineProfile = generateSoilBaselineProfile(answers, climate);
  const soilExplanation = generateSoilAnalysisExplanation(answers, climate);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sub-navigation tabs: clean, professional, minimalistic */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#27D7B2]/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#27D7B2]/15 border border-[#27D7B2]/30 flex items-center justify-center text-[#27D7B2]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Field Profile &amp; Soil Baseline
            </h2>
            <p className="text-xs text-[#A7C0CC]">
              {texture.label} • {drainageReport.drainageClass} • pH {phReport.phValue.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#031520] border border-[#27D7B2]/30 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#27D7B2] text-[#020A10] shadow-sm'
                : 'text-[#A7C0CC] hover:text-white'
            }`}
          >
            Soil Baseline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'health'
                ? 'bg-[#27D7B2] text-[#020A10] shadow-sm'
                : 'text-[#A7C0CC] hover:text-white'
            }`}
          >
            Soil Health
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('water')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'water'
                ? 'bg-[#27D7B2] text-[#020A10] shadow-sm'
                : 'text-[#A7C0CC] hover:text-white'
            }`}
          >
            Water &amp; Drainage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ph-salinity')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'ph-salinity'
                ? 'bg-[#27D7B2] text-[#020A10] shadow-sm'
                : 'text-[#A7C0CC] hover:text-white'
            }`}
          >
            pH &amp; Salinity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('explanation')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'explanation'
                ? 'bg-[#27D7B2] text-[#020A10] shadow-sm'
                : 'text-[#A7C0CC] hover:text-white'
            }`}
          >
            Analysis Synthesis
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: SOIL BASELINE PROFILE (Item 14)                            */}
      {/* ================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Quick Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-xl bg-[#031522]/50 backdrop-blur-md border border-white/[0.08] space-y-1">
              <span className="text-[11px] font-mono text-[#A7C0CC] uppercase">Textural Class</span>
              <div className="text-sm font-bold text-white truncate">{texture.label}</div>
              <div className="text-[10px] text-[#27D7B2] font-mono">{texture.sandPct}% Sand • {texture.clayPct}% Clay</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#031522]/50 backdrop-blur-md border border-white/[0.08] space-y-1">
              <span className="text-[11px] font-mono text-[#A7C0CC] uppercase">Available Water Capacity</span>
              <div className="text-sm font-bold text-[#27D7B2] font-mono">{texture.availableWaterCapacityMmPerM} mm/m</div>
              <div className="text-[10px] text-[#A7C0CC]">~{texture.droughtBufferDays} days dry-spell buffer</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#031522]/50 backdrop-blur-md border border-white/[0.08] space-y-1">
              <span className="text-[11px] font-mono text-[#A7C0CC] uppercase">Soil pH Reaction</span>
              <div className="text-sm font-bold text-white font-mono">{phReport.phValue.toFixed(1)}</div>
              <div className="text-[10px] text-[#27D7B2]">{phReport.phCategory}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#031522]/50 backdrop-blur-md border border-white/[0.08] space-y-1">
              <span className="text-[11px] font-mono text-[#A7C0CC] uppercase">Organic Matter (SOM)</span>
              <div className="text-sm font-bold text-white font-mono">{somReport.somPct}%</div>
              <div className="text-[10px] text-emerald-400 font-mono">+{somReport.annualMineralizedNkgHa} kg N/ha/yr</div>
            </div>
          </div>

          {/* Major Soil Characteristics Table (Item 14: Persistent Profile with Sources & Confidence) */}
          <div className="rounded-xl border border-white/[0.08] bg-[#031522]/50 backdrop-blur-md overflow-hidden shadow-sm">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#27D7B2]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Soil Baseline Profile &amp; Data Provenance
                </h3>
              </div>
              <span className="text-[11px] text-[#A7C0CC] font-mono">Arable Layer (0–30 cm)</span>
            </div>

            <div className="divide-y divide-[#27D7B2]/15 text-xs">
              <div className="grid grid-cols-12 p-3 items-center hover:bg-white/[0.02]">
                <div className="col-span-4 font-semibold text-white">Soil Texture Type</div>
                <div className="col-span-4 text-[#27D7B2] font-mono">{baselineProfile.textureClass}</div>
                <div className="col-span-4 flex items-center justify-end gap-2">
                  <span className="text-[11px] text-[#A7C0CC]">Farmer / Lab Confirmed</span>
                  <ConfidenceBadge level="High" />
                </div>
              </div>

              <div className="grid grid-cols-12 p-3 items-center hover:bg-white/[0.02]">
                <div className="col-span-4 font-semibold text-white">Available Water Capacity (AWC)</div>
                <div className="col-span-4 text-white font-mono">{baselineProfile.availableWaterCapacity}</div>
                <div className="col-span-4 flex items-center justify-end gap-2">
                  <span className="text-[11px] text-[#A7C0CC]">USDA Pedotransfer Function</span>
                  <ConfidenceBadge level="High" />
                </div>
              </div>

              <div className="grid grid-cols-12 p-3 items-center hover:bg-white/[0.02]">
                <div className="col-span-4 font-semibold text-white">Soil Reaction (pH)</div>
                <div className="col-span-4 text-white font-mono">
                  pH {baselineProfile.soilPh.value.toFixed(1)} ({phReport.phCategory})
                </div>
                <div className="col-span-4 flex items-center justify-end gap-2">
                  <span className="text-[11px] text-[#A7C0CC] truncate max-w-[140px]">{baselineProfile.soilPh.source}</span>
                  <ConfidenceBadge level={baselineProfile.soilPh.confidence} />
                </div>
              </div>

              <div className="grid grid-cols-12 p-3 items-center hover:bg-white/[0.02]">
                <div className="col-span-4 font-semibold text-white">Soil Organic Matter (SOM)</div>
                <div className="col-span-4 text-white font-mono">{baselineProfile.organicMatter.value}% ({somReport.resilienceRating})</div>
                <div className="col-span-4 flex items-center justify-end gap-2">
                  <span className="text-[11px] text-[#A7C0CC] truncate max-w-[140px]">{baselineProfile.organicMatter.source}</span>
                  <ConfidenceBadge level={baselineProfile.organicMatter.confidence} />
                </div>
              </div>

              <div className="grid grid-cols-12 p-3 items-center hover:bg-white/[0.02]">
                <div className="col-span-4 font-semibold text-white">Salinity (ECe)</div>
                <div className="col-span-4 text-white font-mono">{baselineProfile.salinity.value}</div>
                <div className="col-span-4 flex items-center justify-end gap-2">
                  <span className="text-[11px] text-[#A7C0CC] truncate max-w-[140px]">{baselineProfile.salinity.source}</span>
                  <ConfidenceBadge level={baselineProfile.salinity.confidence} />
                </div>
              </div>

              <div className="grid grid-cols-12 p-3 items-center hover:bg-white/[0.02]">
                <div className="col-span-4 font-semibold text-white">Drainage &amp; Infiltration</div>
                <div className="col-span-4 text-white font-mono">{baselineProfile.drainageClass.value}</div>
                <div className="col-span-4 flex items-center justify-end gap-2">
                  <span className="text-[11px] text-[#A7C0CC]">USDA &amp; Hydro-model</span>
                  <ConfidenceBadge level={baselineProfile.drainageClass.confidence} />
                </div>
              </div>

              <div className="grid grid-cols-12 p-3 items-center hover:bg-white/[0.02]">
                <div className="col-span-4 font-semibold text-white">Bulk Density &amp; Porosity</div>
                <div className="col-span-4 text-white font-mono">
                  {baselineProfile.bulkDensity.value} {baselineProfile.bulkDensity.unit} ({texture.totalPorosityPct}% Porosity)
                </div>
                <div className="col-span-4 flex items-center justify-end gap-2">
                  <span className="text-[11px] text-[#A7C0CC]">Pedotransfer Standard</span>
                  <ConfidenceBadge level="Moderate" />
                </div>
              </div>

              <div className="grid grid-cols-12 p-3 items-center hover:bg-white/[0.02]">
                <div className="col-span-4 font-semibold text-white">Field Slope Gradient</div>
                <div className="col-span-4 text-white font-mono">{baselineProfile.slopeGradient.value}</div>
                <div className="col-span-4 flex items-center justify-end gap-2">
                  <span className="text-[11px] text-[#A7C0CC]">NASA NASADEM (30m)</span>
                  <ConfidenceBadge level="High" />
                </div>
              </div>
            </div>
          </div>

          {/* Item 8: Organic Matter Section as slow-changing resilience indicator */}
          <div className="p-4 rounded-xl bg-[#041D2A]/80 border border-[#27D7B2]/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27D7B2]/15">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-[#27D7B2]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Organic Matter: Slow-Changing Soil Resilience Indicator
                </h4>
              </div>
              <span className="text-xs font-bold text-[#27D7B2] font-mono">{somReport.somPct}% SOM</span>
            </div>

            <p className="text-xs text-[#A7C0CC] leading-relaxed">
              Soil Organic Matter changes gradually over multi-year cycles. At {somReport.somPct}%, this field gains an estimated{' '}
              <strong className="text-white">+{somReport.waterRetentionGainMmPerM} mm/m</strong> in water retention capacity and{' '}
              <strong className="text-white">+{somReport.cecContributionMeq100g} meq/100g</strong> in cation exchange buffering.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-[#031520] border border-[#27D7B2]/20 text-[11px] space-y-1">
                <span className="text-[#A7C0CC] block font-semibold">Biological Nitrogen Reserve:</span>
                <span className="text-white">
                  Provides <strong className="text-[#27D7B2]">+{somReport.annualMineralizedNkgHa} kg N/ha/yr</strong> in temperature-adjusted background mineralization.
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#031520] border border-[#27D7B2]/20 text-[11px] space-y-1">
                <span className="text-[#A7C0CC] block font-semibold">Structural Aggregation:</span>
                <span className="text-white">{somReport.soilStructureRole}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: SOIL HEALTH DASHBOARD (Item 9)                             */}
      {/* ================================================================= */}
      {activeTab === 'health' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-[#041D2A] to-[#062939] border border-[#27D7B2]/30">
            <div>
              <div className="text-[11px] font-mono text-[#27D7B2] uppercase font-bold">SOIL HEALTH SCORE</div>
              <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Overall Condition: {healthDashboard.overallRating} ({healthDashboard.overallScore}% Healthy)
              </h3>
              <p className="text-xs text-[#A7C0CC] mt-1">
                Combines soil structure, pH chemistry, and biological life into an easy-to-read health score.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-[#27D7B2]">{healthDashboard.overallScore}%</span>
                <span className="text-xs text-[#A7C0CC] block">Healthy</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Category 1: Physical Health */}
            <div className="p-4 rounded-xl bg-[#041D2A]/80 border border-[#27D7B2]/30 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#27D7B2]/20">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#27D7B2]" />
                  <span className="text-xs font-bold text-white uppercase font-mono">1. Physical Structure</span>
                </div>
                <span className="text-xs font-bold text-[#27D7B2] font-mono">{healthDashboard.physical.score}%</span>
              </div>

              <div className="space-y-3">
                {healthDashboard.physical.indicators.map((ind, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[#A7C0CC]">
                      <span>{ind.name}</span>
                      <span className="text-white font-mono font-semibold">{ind.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#031520] rounded-full overflow-hidden">
                      <div className="h-full bg-[#27D7B2]" style={{ width: `${ind.score}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#718D9A]">
                      <span>{ind.detail}</span>
                      <span className="text-[#A7C0CC]">{ind.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category 2: Chemical Health */}
            <div className="p-4 rounded-xl bg-[#041D2A]/80 border border-[#27D7B2]/30 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#27D7B2]/20">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#27D7B2]" />
                  <span className="text-xs font-bold text-white uppercase font-mono">2. Chemical Balance (pH &amp; Nutrients)</span>
                </div>
                <span className="text-xs font-bold text-[#27D7B2] font-mono">{healthDashboard.chemical.score}%</span>
              </div>

              <div className="space-y-3">
                {healthDashboard.chemical.indicators.map((ind, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[#A7C0CC]">
                      <span>{ind.name}</span>
                      <span className="text-white font-mono font-semibold">{ind.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#031520] rounded-full overflow-hidden">
                      <div className="h-full bg-[#3CCFB5]" style={{ width: `${ind.score}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#718D9A]">
                      <span>{ind.detail}</span>
                      <span className="text-[#A7C0CC]">{ind.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category 3: Biological Health */}
            <div className="p-4 rounded-xl bg-[#041D2A]/80 border border-[#27D7B2]/30 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#27D7B2]/20">
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase font-mono">3. Biological Life</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">{healthDashboard.biological.score}%</span>
              </div>

              <div className="space-y-3">
                {healthDashboard.biological.indicators.map((ind, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[#A7C0CC]">
                      <span>{ind.name}</span>
                      <span className="text-white font-mono font-semibold">{ind.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#031520] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${ind.score}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#718D9A]">
                      <span>{ind.detail}</span>
                      <span className="text-[#A7C0CC]">{ind.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: WATER & DRAINAGE (Items 2, 10, 11, 12, 13)                 */}
      {/* ================================================================= */}
      {activeTab === 'water' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Waterlogging Warning (Item 13) */}
          {drainageReport.waterloggingWarning && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{drainageReport.waterloggingWarning.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed">{drainageReport.waterloggingWarning.anoxiaRisk}</p>
              <p className="text-[11px] leading-relaxed text-amber-100">{drainageReport.waterloggingWarning.recommendedMitigation}</p>
            </div>
          )}

          {/* Root-Zone Water Warning (Item 11) */}
          {moistureComparison.rootZoneWarning && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-400/40 text-rose-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <Flame className="w-4 h-4 shrink-0" />
                <span>{moistureComparison.rootZoneWarning.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed">{moistureComparison.rootZoneWarning.detail}</p>
              <p className="text-[11px] leading-relaxed font-semibold text-rose-100">{moistureComparison.rootZoneWarning.actionAdvice}</p>
            </div>
          )}

          {/* Current vs Historical Moisture Anomaly (Item 10) */}
          <div className="p-4 rounded-xl bg-[#041D2A]/80 border border-[#27D7B2]/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27D7B2]/15">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#27D7B2]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Current vs. Historical Moisture Telemetry (NASA POWER / SMAP Model)
                </h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  moistureComparison.statusColor === 'rose'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : moistureComparison.statusColor === 'amber'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[#27D7B2]/20 text-[#27D7B2] border border-[#27D7B2]/40'
                }`}
              >
                {moistureComparison.conditionLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#031520] border border-[#27D7B2]/20">
                <span className="text-[#A7C0CC] block text-[10px]">Current Observation</span>
                <span className="text-lg font-bold text-white">{moistureComparison.currentMoisturePercentile}th</span>
                <span className="text-[10px] text-[#A7C0CC] block">percentile root-zone wetness</span>
              </div>
              <div className="p-3 rounded-lg bg-[#031520] border border-[#27D7B2]/20">
                <span className="text-[#A7C0CC] block text-[10px]">10-Yr Historical Norm</span>
                <span className="text-lg font-bold text-white">{moistureComparison.historicalBaselinePercentile}th</span>
                <span className="text-[10px] text-[#A7C0CC] block">seasonal climatological baseline</span>
              </div>
              <div className="p-3 rounded-lg bg-[#031520] border border-[#27D7B2]/20">
                <span className="text-[#A7C0CC] block text-[10px]">Anomaly Delta</span>
                <span
                  className={`text-lg font-bold ${
                    moistureComparison.anomalyDelta < 0 ? 'text-rose-400' : 'text-[#27D7B2]'
                  }`}
                >
                  {moistureComparison.anomalyDelta > 0 ? `+${moistureComparison.anomalyDelta}` : moistureComparison.anomalyDelta}%
                </span>
                <span className="text-[10px] text-[#A7C0CC] block">relative to parcel baseline</span>
              </div>
            </div>
          </div>

          {/* Water-Holding Capacity & Crop Demand Comparison (Item 2) */}
          <div className="p-4 rounded-xl bg-[#041D2A]/80 border border-[#27D7B2]/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27D7B2]/15">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-[#27D7B2]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Water-Holding Capacity &amp; Crop Water Demand Matching
                </h3>
              </div>
              <span className="text-xs text-[#27D7B2] font-mono font-bold">
                TAW: {waterCapacity.totalAvailableWaterTAW} mm (1m Root Zone)
              </span>
            </div>

            <p className="text-xs text-[#A7C0CC] leading-relaxed">
              Comparison between soil storage limits (Total Available Water TAW &amp; Readily Available Water RAW) and crop water extraction needs:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {waterCapacity.cropComparisons.map((c, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#031520] border border-[#27D7B2]/20 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{c.cropName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        c.stressVulnerability === 'Low'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : c.stressVulnerability === 'Moderate'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {c.stressVulnerability} Risk
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A7C0CC] font-mono">
                    RAW: <strong className="text-white">{c.rawMm} mm</strong> • Root: {c.typicalRootDepthM}m
                  </div>
                  <div className="text-[11px] text-[#27D7B2] font-mono">
                    Buffer duration: <strong>{c.daysOfBufferWithoutRain} days</strong> at peak ET
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Drainage Risk Assessment (Item 12) */}
          <div className="p-4 rounded-xl bg-[#041D2A]/80 border border-[#27D7B2]/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27D7B2]/15">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#27D7B2]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Drainage &amp; Waterlogging Risk Factors (Item 12)
                </h3>
              </div>
              <span className="text-xs font-bold font-mono text-white">
                Risk: <span className="text-[#27D7B2]">{drainageReport.waterloggingRisk}</span>
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {drainageReport.contributingFactors.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#031520]/80 border border-[#27D7B2]/15">
                  <span className="font-semibold text-white">{f.factor}</span>
                  <span className="text-[#A7C0CC] text-[11px] font-mono">{f.influence}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: pH COMPATIBILITY & SALINITY (Items 4, 5, 6, 7)             */}
      {/* ================================================================= */}
      {activeTab === 'ph-salinity' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* High-pH Warning (Item 5) */}
          {phReport.highPhWarning && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{phReport.highPhWarning.title}</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                {phReport.highPhWarning.nutrientLimitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-100 font-semibold pt-1">
                Remediation: {phReport.highPhWarning.remediationAdvice}
              </p>
            </div>
          )}

          {/* Low-pH Warning (Item 6) */}
          {phReport.lowPhWarning && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-400/40 text-rose-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{phReport.lowPhWarning.title}</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                {phReport.lowPhWarning.toxicityIssues.map((tox, i) => (
                  <li key={i}>{tox}</li>
                ))}
              </ul>
              <p className="text-[11px] text-rose-100 font-semibold pt-1">
                Remediation: {phReport.lowPhWarning.remediationAdvice}
              </p>
            </div>
          )}

          {/* pH Compatibility Card (Item 4) */}
          <div className="p-4 rounded-xl bg-[#041D2A]/80 border border-[#27D7B2]/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27D7B2]/15">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#27D7B2]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  pH Compatibility &amp; Crop Selection Check (Item 4)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A7C0CC] font-mono">Tested: {phReport.testDepth}</span>
                <ConfidenceBadge level={phReport.confidence} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {phReport.cropCompatibility.map((crop, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#031520] border border-[#27D7B2]/20 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{crop.cropName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        crop.status === 'Optimal'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : crop.status === 'Tolerable'
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {crop.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A7C0CC] font-mono">Optimal Range: {crop.optimalRange}</div>
                  <p className="text-[10px] text-[#718D9A] leading-tight pt-1">{crop.notes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Salinity Risk & Satellite Microwave Context (Item 7) */}
          <div className="p-4 rounded-xl bg-[#041D2A]/80 border border-[#27D7B2]/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27D7B2]/15">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#27D7B2]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Salinity Risk &amp; Osmotic Water Uptake (Item 7)
                </h3>
              </div>
              <span className="text-xs font-bold font-mono text-[#27D7B2]">
                {salinityReport.eceDsM} dS/m ({salinityReport.salinityClass})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#031520] border border-[#27D7B2]/20 space-y-1.5">
                <span className="font-bold text-white block">Crop Water Uptake (Osmotic Impact):</span>
                <p className="text-[#A7C0CC] text-[11px] leading-relaxed">{salinityReport.waterUptakeImpact}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#031520] border border-[#27D7B2]/20 space-y-1.5">
                <span className="font-bold text-white block">Satellite Dielectric Telemetry Impact:</span>
                <p className="text-[#A7C0CC] text-[11px] leading-relaxed">{salinityReport.satelliteInterpretationImpact}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 5: SOIL ANALYSIS EXPLANATION (Item 15)                        */}
      {/* ================================================================= */}
      {activeTab === 'explanation' && (
        <div className="p-5 rounded-2xl bg-[#031522]/50 backdrop-blur-md border border-cyan-400/25 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-[#27D7B2]/20">
            <Sparkles className="w-4 h-4 text-[#27D7B2]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Soil Analysis Agronomic Explanation (Item 15)
            </h3>
          </div>

          <div className="text-sm font-bold text-[#27D7B2] font-mono">
            {soilExplanation.headline}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-[#031520] border border-[#27D7B2]/20 space-y-1.5">
              <span className="font-bold text-white block">Water &amp; Drainage Impact:</span>
              <p className="text-[#A7C0CC] leading-relaxed text-[11px]">{soilExplanation.waterDrainageImpact}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#031520] border border-[#27D7B2]/20 space-y-1.5">
              <span className="font-bold text-white block">Crop Suitability Impact:</span>
              <p className="text-[#A7C0CC] leading-relaxed text-[11px]">{soilExplanation.cropSuitabilityImpact}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#031520] border border-[#27D7B2]/20 space-y-1.5">
              <span className="font-bold text-white block">Rotation Context Strategy:</span>
              <p className="text-[#A7C0CC] leading-relaxed text-[11px]">{soilExplanation.rotationContext}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

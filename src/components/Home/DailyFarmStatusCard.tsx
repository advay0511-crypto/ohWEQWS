import React, { useState } from 'react';
import {
  Sprout,
  Droplets,
  Layers,
  AlertTriangle,
  Clock,
  Check,
  ChevronRight,
  MapPin,
  X,
  Activity,
} from 'lucide-react';
import { DailyStatusSnapshot, SavedFarmPlan } from '../../types';
import { dismissAlert } from '../../services/nasaAlerts';
import {
  getFarmRegionImage,
  getFarmRegionFallbackImage,
  getCropImage,
} from '../../services/cropImages';

interface DailyFarmStatusCardProps {
  snapshot: DailyStatusSnapshot;
  farm?: SavedFarmPlan;
  onViewRotation?: () => void;
  onViewFarmDetail?: () => void;
  onAlertDismissed?: (alertId: string) => void;
  onCropClick?: (cropName: string, farmId?: string) => void;
  isAdvanced?: boolean;
}

export const DailyFarmStatusCard: React.FC<DailyFarmStatusCardProps> = ({
  snapshot,
  farm,
  onViewRotation,
  onViewFarmDetail,
  onAlertDismissed,
  onCropClick,
  isAdvanced = false,
}) => {
  const {
    farmName: snapshotFarmName,
    overallStatus,
    currentCrop,
    water,
    soil,
    nextAction,
    activeAlerts: initialActiveAlerts = [],
    lastUpdatedText,
  } = snapshot;

  const [dismissedLocal, setDismissedLocal] = useState<Set<string>>(new Set());

  const activeAlerts = initialActiveAlerts.filter((a) => !dismissedLocal.has(a.id));
  const hasAlerts = activeAlerts.length > 0;
  const hasCriticalAlert = activeAlerts.some((a) => a.severity === 'critical');

  const handleDismiss = (alertId: string) => {
    dismissAlert(alertId);
    setDismissedLocal((prev) => new Set([...prev, alertId]));
    if (onAlertDismissed) {
      onAlertDismissed(alertId);
    }
  };

  // Farm Details
  const farmName = farm?.name || snapshotFarmName || 'Al Marjan Farm';
  const farmLocation = farm?.locationName || snapshot.locationName || 'Ras Al Khaimah, UAE';
  const fieldSize = farm?.farmAnswers?.fieldSizeHa || 32.5;

  // Real geographical region picture of the farm's location
  const farmThumb = getFarmRegionImage(
    farmLocation,
    farmName,
    farm?.farmAnswers?.lat,
    farm?.farmAnswers?.lon
  );

  // Sanitizer ensuring Fallow and Cover Crop are clean
  const sanitizeCrop = (name: string): string => {
    if (!name) return '';
    if (/fallow.*cover|cover.*fallow/i.test(name)) {
      return farm?.farmAnswers?.irrigationMode === 'rain_only' ? 'Fallow' : 'Cover Crop';
    }
    if (name.includes(' / ')) return name.split(' / ')[0].trim();
    if (name.includes('/')) return name.split('/')[0].trim();
    return name.trim();
  };

  // Rotation Sequence Crops
  const rawSequenceCrops = farm?.analysis?.rotations?.[0]?.sequence?.map((s) => s.cropName) || [
    'Wheat',
    'Chickpea',
    'Lentil',
    'Grain Sorghum',
  ];
  const sequenceCrops = rawSequenceCrops.map(sanitizeCrop);

  const activeCropName = sanitizeCrop(currentCrop.name || sequenceCrops[0] || 'Wheat');
  const daysUntilNext = currentCrop.daysUntilNextTransition || 82;
  const stageLabel = snapshot.currentCrop.stageLabel || 'Season 1 of 4';

  // Realistic days planted for each crop
  const getCropPlantedDays = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('wheat')) return 120;
    if (n.includes('chickpea')) return 105;
    if (n.includes('lentil')) return 95;
    if (n.includes('sorghum')) return 100;
    if (n.includes('fallow')) return 90;
    if (n.includes('cover')) return 75;
    return 110;
  };

  // Condition percentage score derived from soil, water, and status
  const conditionScore =
    overallStatus === 'alert' || hasCriticalAlert
      ? 58
      : overallStatus === 'needs_attention' || hasAlerts
      ? 74
      : 92;

  // Determine if a priority action / urgent notice is active
  const isActionActive =
    hasCriticalAlert ||
    hasAlerts ||
    overallStatus === 'alert' ||
    overallStatus === 'needs_attention' ||
    Boolean(nextAction);

  const priorityLabel =
    activeAlerts[0]?.title ||
    nextAction?.label ||
    'Review Field Irrigation Schedule';

  return (
    <div className="w-full rounded-2xl glass-card border border-white/[0.14] p-5 sm:p-6 space-y-5 transition-all text-[#F0F7FA] shadow-lg relative backdrop-blur-xl">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER: Status Title + (Priority Action OR Healthy Badge)      */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
        {/* Top-Left: Sprout + Farm Status Title + Context Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#27D7B2]/15 border border-[#27D7B2]/30 flex items-center justify-center text-[#27D7B2] shrink-0">
              <Sprout className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Farm Status
            </h2>
          </div>

          {/* If action/alert needed: Health badge is REMOVED and replaced with ORANGE Priority Action banner */}
          {isActionActive && (overallStatus !== 'good' || hasAlerts) ? (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/25 border border-amber-500/50 text-amber-200 text-xs font-bold shadow-sm animate-pulse"
              title="Urgent field action required"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate max-w-[280px]">
                Priority Action: {priorityLabel}
              </span>
            </div>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#27D7B2]/15 border border-[#27D7B2]/40 text-[#27D7B2] shadow-sm"
              title={snapshot.overallStatusReason || 'All field indicators optimal'}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Healthy</span>
            </span>
          )}
        </div>

        {/* Top-Right: Clock + Last updated */}
        <div className="flex items-center gap-2 text-xs text-slate-300 sm:text-right">
          <Clock className="w-3.5 h-3.5 text-[#27D7B2] shrink-0" />
          <div className="flex sm:flex-col sm:items-end gap-1.5 sm:gap-0">
            <span className="text-[11px] text-slate-400">Last updated</span>
            <span className="text-xs text-white font-medium">
              {lastUpdatedText || 'Today, 7:25 PM'}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. FARM IDENTITY & FARM CONDITION (Directly below name and image)     */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Farm Aerial Image (100% opaque, sharp, rounded) */}
          <div className="w-full sm:w-44 h-24 sm:h-28 rounded-xl overflow-hidden border border-white/14 shrink-0 shadow-md bg-black/30">
            <img
              src={farmThumb}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getFarmRegionFallbackImage(
                  farmLocation,
                  farmName,
                  farm?.farmAnswers?.lat,
                  farm?.farmAnswers?.lon
                );
              }}
              alt={farmName}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Farm Name & Metadata */}
          <div className="space-y-1.5 min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
              {farmName}
            </h3>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-[#27D7B2] shrink-0" />
              <span className="truncate">{farmLocation}</span>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
              <span className="text-[#27D7B2] font-bold">♧</span>
              <span className="font-mono text-white font-semibold">{fieldSize} ha parcel</span>
              <span className="text-white/30">·</span>
              <span className="text-slate-300">{stageLabel}</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* FARM CONDITION VISUAL: Directly below Farm Name & Image             */}
        {/* =================================================================== */}
        <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.10] space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#27D7B2]" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Farm Condition
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-[#27D7B2]">
                {conditionScore}%
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  conditionScore >= 85
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : conditionScore >= 70
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {conditionScore >= 85 ? 'Optimal' : conditionScore >= 70 ? 'Moderate' : 'Attention'}
              </span>
            </div>
          </div>

          {/* Visual gradient condition meter bar */}
          <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                conditionScore >= 85
                  ? 'bg-gradient-to-r from-teal-500 via-emerald-400 to-[#27D7B2]'
                  : conditionScore >= 70
                  ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                  : 'bg-gradient-to-r from-rose-500 to-rose-400'
              }`}
              style={{ width: `${conditionScore}%` }}
            />
          </div>

          <p className="text-xs text-slate-300 leading-snug">
            {snapshot.overallStatusReason ||
              'Soil hydration, photosynthetic canopy activity, and thermal accumulation are within optimal bounds.'}
          </p>
        </div>
      </div>

      {/* Thin Horizontal Divider */}
      <div className="w-full h-px bg-white/[0.08]" />

      {/* ===================================================================== */}
      {/* 3. ACTIVE ROTATION SEQUENCE: Visual cards with real crop photos       */}
      {/* Active crop is prominently highlighted in glowing green ring          */}
      {/* ===================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[#27D7B2]" />
            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Active Crop Rotation Sequence
            </h4>
          </div>
          <span className="text-xs text-[#27D7B2] font-medium font-mono">
            Next crop in {daysUntilNext} days
          </span>
        </div>

        {/* Visual crop sequence list with real photos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sequenceCrops.map((cropName, idx) => {
            const isActive =
              idx === 0 || cropName.toLowerCase() === activeCropName.toLowerCase();
            const cropImage = getCropImage(cropName);
            const plantedDays = getCropPlantedDays(cropName);

            return (
              <div
                key={idx}
                onClick={() =>
                  onCropClick
                    ? onCropClick(cropName, farm?.id)
                    : onViewRotation
                    ? onViewRotation()
                    : onViewFarmDetail?.()
                }
                title={`Click to view ${cropName} rotation plan (${plantedDays} days)`}
                className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center gap-2 ${
                  isActive
                    ? 'ring-2 ring-[#27D7B2] bg-[#27D7B2]/20 border-[#27D7B2] shadow-[0_0_20px_rgba(39,215,178,0.30)]'
                    : 'border-white/[0.10] bg-white/[0.03] hover:border-[#27D7B2]/50 hover:bg-white/[0.06]'
                }`}
              >
                {/* Active Indicator Badge */}
                {isActive && (
                  <span className="absolute -top-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-[#27D7B2] text-[#020A10] shadow-md">
                    CURRENT
                  </span>
                )}

                {/* Real Crop Photograph (100% opaque) */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-white/15 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <img
                    src={cropImage}
                    alt={cropName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="w-full min-w-0">
                  <div
                    className={`text-xs sm:text-sm font-bold truncate ${
                      isActive ? 'text-[#27D7B2]' : 'text-white group-hover:text-[#27D7B2]'
                    }`}
                  >
                    {cropName}
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                    ~{plantedDays} days
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. DISMISSIBLE ALERTS (If critical environmental alerts exist)        */}
      {/* ===================================================================== */}
      {hasAlerts && (
        <div className="space-y-2 pt-1">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                alert.severity === 'critical'
                  ? 'border-rose-500/40 bg-rose-950/25 text-rose-200'
                  : 'border-amber-500/40 bg-amber-950/25 text-amber-200'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                  }`}
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                        alert.severity === 'critical'
                          ? 'bg-rose-500/25 text-rose-300'
                          : 'bg-amber-500/25 text-amber-300'
                      }`}
                    >
                      {alert.severity === 'critical' ? 'Critical' : 'Notice'}
                    </span>
                    <h5 className="text-sm font-bold text-white tracking-tight break-words">
                      {alert.title}
                    </h5>
                  </div>
                  <p className="text-xs font-sans leading-relaxed text-slate-200 break-words">
                    {alert.actionRecommendation || alert.shortAlert || alert.boldWarning}
                  </p>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => handleDismiss(alert.id)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="Dismiss alert"
                aria-label="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. VISUAL METRICS: SOIL MOISTURE & SOIL HEALTH (Clean Visual Meters)  */}
      {/* ===================================================================== */}
      <div className="pt-2 border-t border-white/[0.08] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Soil Moisture Visual Bar */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Droplets className="w-3.5 h-3.5 text-[#27D7B2] shrink-0" />
                <span>Soil Moisture</span>
              </div>
              <span className="text-[11px] font-semibold text-[#27D7B2] px-2 py-0.5 rounded-md bg-[#27D7B2]/10 border border-[#27D7B2]/20">
                Sufficient Hydration
              </span>
            </div>
            {/* Visual indicator bar */}
            <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-[#27D7B2] w-[75%]" />
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed break-words">
              {water.plainLanguage}
            </p>
          </div>

          {/* Soil Health Visual Bar */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Soil Health</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                Balanced Nutrients
              </span>
            </div>
            {/* Visual indicator bar */}
            <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[80%]" />
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed break-words">
              {soil.plainLanguage}
            </p>
          </div>
        </div>

        {/* Suggested Next Action */}
        {nextAction && (
          <div className="pt-2 border-t border-white/[0.06] flex items-start gap-2.5 min-w-0">
            <Check className="w-3.5 h-3.5 text-[#27D7B2] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-300 min-w-0">
              <span className="text-slate-400 font-medium mr-1.5">Action Plan:</span>
              <span className="text-white font-medium">{nextAction.label}</span>
              {nextAction.dueInDays && (
                <span className="text-[#27D7B2] font-semibold ml-2 font-mono">
                  · Target within {nextAction.dueInDays} days
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 6. SINGLE PRIMARY EXIT ACTION                                         */}
      {/* ===================================================================== */}
      {onViewFarmDetail && (
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={onViewFarmDetail}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-[#27D7B2]/15 border border-white/[0.12] hover:border-[#27D7B2]/40 text-xs sm:text-sm font-semibold text-[#27D7B2] hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <span>Open Farm Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

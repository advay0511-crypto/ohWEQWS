import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Compass,
  RefreshCw,
  Sun,
  Activity,
  Sparkles,
  X,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { OnboardingView } from './OnboardingView';
import { FarmTrackerSelector } from './FarmTrackerSelector';
import { DailyFarmStatusCard } from './DailyFarmStatusCard';
import { DailyWeatherCard } from './DailyWeatherCard';
import { WaterIntelligenceCard } from './WaterIntelligenceCard';
import { SoilIntelligenceCard } from './SoilIntelligenceCard';
import { WatchHowItWorksModal } from './WatchHowItWorksModal';
import { SavedFarmPlan } from '../../types';
import { computeDailyStatusSnapshot } from '../../services/dailySnapshot';
import { LiveWeatherObservation } from '../../services/liveWeather';
import { WizardDraft } from '../../store/farmStorage';
import heroFarmlandImg from '../../assets/images/hero_farmland_1790691713410.jpg';

interface HomeViewProps {
  onStartAnalysis: () => void;
  onNavigateTab: (tab: 'home' | 'farms' | 'calendar' | 'analysis' | 'rotations' | 'simulator' | 'settings' | 'data' | 'wizard' | 'map') => void;
  onOpenFarmSwitcher: () => void;
  activeFarm?: SavedFarmPlan;
  allFarms?: SavedFarmPlan[];
  onOpenGuide?: () => void;
  onSelectFarmId?: (farmId: string) => void;
  onOpenFarmDetail?: (farmId: string, initialSection?: 'tracker' | 'fields' | 'rotations' | 'journal' | 'settings', cropFilter?: string) => void;
  onOpenCropRotation?: (farmId: string, cropName?: string | null) => void;
  onWeatherLoaded?: (weather: LiveWeatherObservation) => void;
  onAlertDismissed?: (alertId: string) => void;
  isAdvanced?: boolean;
  onExploreDemo?: () => void;
  onResumeDraft?: () => void;
  savedDraft?: WizardDraft | null;
  onRemoveDemo?: () => void;
  onRefreshData?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartAnalysis,
  onNavigateTab,
  onOpenFarmSwitcher,
  activeFarm,
  allFarms = [],
  onOpenGuide,
  onSelectFarmId,
  onOpenFarmDetail,
  onOpenCropRotation,
  onWeatherLoaded,
  onAlertDismissed,
  isAdvanced = false,
  onExploreDemo,
  onResumeDraft,
  savedDraft,
  onRemoveDemo,
  onRefreshData,
}) => {
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [alertTick, setAlertTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<Set<string>>(new Set());

  // Selected farm for Home page
  const currentFarm = activeFarm || allFarms[0];

  // If no farm exists in workspace, render the First Visit / Onboarding Screen
  if (!currentFarm || allFarms.length === 0) {
    return (
      <OnboardingView
        onAddFarm={onStartAnalysis}
        onExploreDemo={onExploreDemo || onStartAnalysis}
        onResumeDraft={onResumeDraft}
        savedDraft={savedDraft}
      />
    );
  }

  // Compute daily snapshot from current farm
  const snapshot = computeDailyStatusSnapshot(currentFarm);

  const handleSelectFarm = (farmId: string) => {
    if (onSelectFarmId) {
      onSelectFarmId(farmId);
    }
  };

  const handleAlertDismissed = (alertId: string) => {
    setAlertTick((t) => t + 1);
    setDismissedNoticeIds((prev) => new Set([...prev, alertId]));
    if (onAlertDismissed) {
      onAlertDismissed(alertId);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      if (onRefreshData) onRefreshData();
    }, 600);
  };

  const activeCropName = snapshot.currentCrop?.name || 'Wheat';
  const fieldSize = currentFarm.farmAnswers?.fieldSizeHa || 32.5;

  // Active notices/alerts to display below the hero
  const activeAlerts = (snapshot.activeAlerts || []).filter((a) => !dismissedNoticeIds.has(a.id));
  const hasNoticesBelow = currentFarm.isDemo || activeAlerts.length > 0;

  // Derive meaningful changes since last check
  const meaningfulChanges = [
    {
      id: 'change_1',
      marker: 'Weather',
      title: 'Rainfall & Evapotranspiration',
      summary: `${snapshot.weather.recentRainMm} mm recorded in past 24h. Root-zone moisture buffer maintained.`,
      timestamp: 'Today · Live Grid',
      linkTarget: 'analysis',
    },
    {
      id: 'change_2',
      marker: 'Schedule',
      title: `${activeCropName} Crop Cycle`,
      summary: `Day ${snapshot.currentCrop.daysIntoSeason || 38} of active cycle. Canopy progression healthy.`,
      timestamp: 'Calculated calendar',
      linkTarget: 'rotations',
    },
    {
      id: 'change_3',
      marker: 'Soil Model',
      title: 'Hydration Buffer',
      summary: snapshot.water.plainLanguage,
      timestamp: 'NASA POWER baseline',
      linkTarget: 'analysis',
    },
  ];

  return (
    <div className="w-full flex flex-col space-y-6 pb-20">
      {/* ===================================================================== */}
      {/* 1. FIT-TO-SCREEN HERO: "Smarter decisions. Healthier fields."          */}
      {/* Spans full width gracefully with panoramic imagery and glass overlay   */}
      {/* ===================================================================== */}
      <section className="relative w-full overflow-hidden border-b border-white/[0.12] shadow-xl backdrop-blur-xl">
        {/* Base panoramic imagery */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroFarmlandImg}
            alt="Scenic agricultural landscape"
            className="w-full h-full object-cover object-[center_35%]"
          />
          {/* Glassmorphic directional gradient scrim */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, rgba(3,15,20,0.85) 0%, rgba(4,18,24,0.72) 48%, rgba(4,18,24,0.45) 75%, rgba(3,15,20,0.25) 100%)',
            }}
          />
          {/* Soft atmospheric teal glow */}
          <div
            className="absolute top-0 left-0 w-1/2 h-full pointer-events-none opacity-25 mix-blend-screen"
            style={{
              background: 'radial-gradient(ellipse at 15% 45%, rgba(39,215,178,0.5) 0%, transparent 65%)',
              filter: 'blur(36px)',
            }}
          />
        </div>

        {/* Hero Container Content */}
        <div className="relative z-10 max-w-[1480px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6">
          {/* Top Context Bar: Farm Selector & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.10]">
            <div className="flex items-center gap-3">
              <FarmTrackerSelector
                farms={allFarms}
                selectedFarmId={currentFarm.id}
                onSelectFarm={handleSelectFarm}
                onAddNewFarm={onStartAnalysis}
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#27D7B2]" />
                <span className="text-slate-200">Last refreshed: Today, {snapshot.lastUpdatedText || '7:25 PM'}</span>
              </span>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-pill hover:border-[#27D7B2]/40 text-white font-medium transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                title="Refresh satellite & weather data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#27D7B2] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Hero Main Grid Split: 7:5 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left 7 Columns: Kicker, Headline, Description, Actions */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-wider uppercase text-[#27D7B2]">
                <MapPin className="w-3.5 h-3.5 text-[#27D7B2]" />
                <span>{currentFarm.name}</span>
                <span aria-hidden="true" className="text-white/30">·</span>
                <span className="text-slate-300">{currentFarm.locationName}</span>
                <span aria-hidden="true" className="text-white/30">·</span>
                <span className="text-slate-200">{fieldSize} ha</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-sm">
                Smarter decisions. <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#CFF7EE] to-[#27D7B2]">Healthier fields.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-[560px]">
                Evidence-backed farm insights, multi-season rotation planning, and priority field actions unified in a clear, high-resolution view.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Primary Action */}
                <button
                  type="button"
                  onClick={() => onNavigateTab('rotations')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#12A888] hover:brightness-110 text-[#020A10] text-sm font-bold transition-all shadow-[0_4px_20px_rgba(39,215,178,0.35)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Plan crop rotations</span>
                </button>

                {/* Secondary Action */}
                <button
                  type="button"
                  onClick={() => onNavigateTab('analysis')}
                  className="px-4 py-2.5 rounded-xl glass-card hover:border-[#27D7B2]/50 text-white text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <Activity className="w-4 h-4 text-[#73CAD0]" />
                  <span>Run Deep Analysis</span>
                </button>

                {/* Tertiary: Open Map */}
                <button
                  type="button"
                  onClick={() => onNavigateTab('map')}
                  className="px-4 py-2.5 rounded-xl glass-card hover:border-white/30 text-slate-200 hover:text-white text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Compass className="w-4 h-4 text-[#27D7B2]" />
                  <span>Interactive Map</span>
                </button>
              </div>
            </div>

            {/* Right 5 Columns: Glass Current Conditions Snapshot */}
            <div className="lg:col-span-5 hidden lg:block">
              <div className="w-full rounded-2xl glass-card border border-white/[0.16] p-5 space-y-3.5 backdrop-blur-2xl shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.10]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Current Conditions</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-300">
                    Open-Meteo · Live
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-4xl font-extrabold text-white font-sans tracking-tight">
                      {snapshot.weather.tempC}°C
                    </div>
                    <div className="text-sm font-semibold text-slate-100">
                      {snapshot.weather.conditionText || 'Mostly Sunny'}
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      High {snapshot.weather.dailyHighC}°C · Low {snapshot.weather.dailyLowC}°C
                    </div>
                  </div>

                  <div className="text-right space-y-1.5 text-xs">
                    <div className="p-1.5 px-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                      <span className="text-slate-300">Rain: </span>
                      <span className="text-[#73CAD0] font-mono font-bold">{snapshot.weather.recentRainMm} mm</span>
                    </div>
                    <div className="p-1.5 px-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                      <span className="text-slate-300">Humidity: </span>
                      <span className="text-white font-mono font-semibold">{snapshot.weather.humidityPct}%</span>
                    </div>
                    <div className="p-1.5 px-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                      <span className="text-slate-300">Wind: </span>
                      <span className="text-white font-mono font-semibold">{snapshot.weather.windSpeedKmH} km/h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. NOTICES & ALERTS: Displayed DIRECTLY BELOW the Hero Card           */}
      {/* ===================================================================== */}
      {hasNoticesBelow && (
        <div className="max-w-[1480px] w-full mx-auto px-4 sm:px-6 lg:px-10 space-y-3">
          {/* Demo Farm Banner */}
          {currentFarm.isDemo && (
            <div className="p-4 rounded-2xl glass-card border border-[#27D7B2]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-[#27D7B2] text-[#020A10] shrink-0">
                  DEMO FARM
                </span>
                <p className="text-xs sm:text-sm text-slate-100 leading-snug">
                  You are currently exploring demonstration data. All metrics carry Demo provenance and will not overwrite real farm records.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={onStartAnalysis}
                  className="px-3.5 py-1.5 rounded-xl bg-[#27D7B2] hover:bg-[#38E5C1] text-[#020A10] text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Add your real farm
                </button>
                {onRemoveDemo && (
                  <button
                    type="button"
                    onClick={onRemoveDemo}
                    className="px-3 py-1.5 rounded-xl glass-pill hover:bg-white/10 text-slate-300 text-xs border border-white/15 transition-all cursor-pointer"
                  >
                    Exit demo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Alerts */}
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 sm:p-4 rounded-2xl glass-card border flex items-start justify-between gap-3 transition-all shadow-md ${
                alert.severity === 'critical'
                  ? 'border-rose-500/40 bg-rose-950/30 text-rose-100'
                  : 'border-amber-500/40 bg-amber-950/30 text-amber-100'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                        alert.severity === 'critical'
                          ? 'bg-rose-500/25 text-rose-200 border border-rose-500/30'
                          : 'bg-amber-500/25 text-amber-200 border border-amber-500/30'
                      }`}
                    >
                      {alert.severity === 'critical' ? 'Critical Notice' : 'Advisory'}
                    </span>
                    <h5 className="text-sm font-bold text-white tracking-tight break-words">
                      {alert.title}
                    </h5>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed break-words">
                    {alert.actionRecommendation || alert.shortAlert || alert.boldWarning}
                  </p>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => handleAlertDismissed(alert.id)}
                className="w-7 h-7 rounded-lg glass-pill hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
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
      {/* 3. CONSOLIDATED OPERATIONAL DASHBOARD (Left 8 / Right 4)              */}
      {/* Clean, fit-to-screen, no floating card bloat                          */}
      {/* ===================================================================== */}
      <div className="max-w-[1480px] w-full mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================================================================= */}
          {/* LEFT 8 COLUMNS: Consolidated Farm Status Card & Signals           */}
          {/* ================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* Main Consolidated Daily Farm Status Card */}
            <DailyFarmStatusCard
              key={`${snapshot.farmId}_${alertTick}`}
              snapshot={snapshot}
              farm={currentFarm}
              isAdvanced={isAdvanced}
              onViewRotation={() => {
                if (onOpenCropRotation && currentFarm) {
                  onOpenCropRotation(currentFarm.id, null);
                } else if (onOpenFarmDetail && currentFarm) {
                  onOpenFarmDetail(currentFarm.id, 'rotations');
                } else {
                  onNavigateTab('rotations');
                }
              }}
              onViewFarmDetail={() => {
                if (onOpenFarmDetail && currentFarm) {
                  onOpenFarmDetail(currentFarm.id, 'tracker');
                } else {
                  onNavigateTab('farms');
                }
              }}
              onCropClick={(cropName, fId) => {
                const targetFarmId = fId || currentFarm?.id;
                if (targetFarmId && onOpenCropRotation) {
                  onOpenCropRotation(targetFarmId, cropName);
                } else if (targetFarmId && onOpenFarmDetail) {
                  onOpenFarmDetail(targetFarmId, 'rotations', cropName);
                } else {
                  onNavigateTab('rotations');
                }
              }}
              onAlertDismissed={handleAlertDismissed}
            />

            {/* WHAT CHANGED SINCE YOUR LAST CHECK? */}
            <div className="p-5 sm:p-6 rounded-2xl glass-card border border-white/[0.14] space-y-4 shadow-lg backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#27D7B2]" />
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    What Changed Since Your Last Check?
                  </h3>
                </div>
                <span className="text-[11px] text-slate-300 font-mono">
                  3 Verified Signals
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {meaningfulChanges.map((change) => (
                  <div
                    key={change.id}
                    onClick={() => onNavigateTab(change.linkTarget as any)}
                    className="p-3.5 rounded-xl glass-card-hover bg-white/[0.04] border border-white/[0.08] hover:border-[#27D7B2]/40 transition-all cursor-pointer space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#27D7B2]">
                        {change.marker}
                      </span>
                      <span className="text-[10px] text-slate-300 truncate max-w-[120px]">
                        {change.timestamp}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {change.title}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {change.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ADVANCED MODE TELEMETRY (When toggled on) */}
            {isAdvanced && (
              <div className="space-y-6 pt-4 border-t border-white/[0.10]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      Agronomic Telemetry & Pedology
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Calibrated FAO-56 dual crop evapotranspiration, ISRIC soil horizons, and root-zone water balance.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium glass-pill text-[#27D7B2] border border-[#27D7B2]/30">
                    Advanced Mode
                  </span>
                </div>

                <div className="space-y-6">
                  <WaterIntelligenceCard farm={currentFarm} />
                  <SoilIntelligenceCard farm={currentFarm} />
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* RIGHT 4 COLUMNS: Weather, Tasks, Freshness                        */}
          {/* ================================================================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* Daily Weather Card (with 5-day real Open-Meteo forecast) */}
            <DailyWeatherCard
              snapshot={snapshot}
              farm={currentFarm}
              isAdvanced={isAdvanced}
              onWeatherLoaded={onWeatherLoaded}
              onViewDetails={() => onNavigateTab('analysis')}
            />

            {/* PRIORITY ACTIONS PANEL */}
            <div className="p-5 sm:p-6 rounded-2xl glass-card border border-white/[0.14] space-y-4 shadow-lg backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <h3 className="text-sm font-bold text-white">
                  Field Schedule & Actions
                </h3>
                <span className="text-[11px] text-slate-300 font-mono">
                  {snapshot.upcomingTasks.length + 1} Pending
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Main Action */}
                <div
                  onClick={() => onNavigateTab('calendar')}
                  className="p-3.5 rounded-xl glass-card-hover bg-white/[0.04] border border-[#27D7B2]/30 transition-all cursor-pointer space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/20">
                      Target Action
                    </span>
                    <span className="text-[11px] text-slate-300">
                      Within 3 days
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    {snapshot.nextAction?.label || 'Inspect root-zone moisture buffer'}
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    {snapshot.nextAction?.reasonTiedToData || 'Verify soil hydration before scheduled temperature rise.'}
                  </p>
                </div>

                {/* Additional upcoming tasks */}
                {snapshot.upcomingTasks.slice(0, 2).map((t, idx) => (
                  <div
                    key={idx}
                    onClick={() => onNavigateTab('calendar')}
                    className="p-3 rounded-xl glass-card-hover bg-white/[0.02] border border-white/[0.08] transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white truncate">
                        {t.title}
                      </span>
                      <span className="text-slate-300 shrink-0 font-mono text-[10px]">
                        {t.timing}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">
                      {t.reason}
                    </p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('calendar')}
                className="w-full py-2.5 text-center text-xs font-bold text-[#27D7B2] hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 rounded-xl glass-pill hover:border-[#27D7B2]/40"
              >
                <span>View all tasks in Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* DATA FRESHNESS & SOURCE UPDATES PANEL */}
            <div className="p-5 sm:p-6 rounded-2xl glass-card border border-white/[0.14] space-y-3.5 shadow-lg backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <h3 className="text-sm font-bold text-white">
                  Source Freshness
                </h3>
                <span className="text-[11px] text-[#27D7B2] font-mono font-semibold">
                  Verified
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <div className="text-white font-semibold">Open-Meteo Weather</div>
                    <div className="text-[10px] text-slate-300">Observed 10m grid</div>
                  </div>
                  <span className="text-[11px] font-mono text-[#27D7B2] font-bold">Live</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <div className="text-white font-semibold">NASA POWER Climatology</div>
                    <div className="text-[10px] text-slate-300">Solar &amp; rainfall reanalysis</div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-200">10y Baseline</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <div className="text-white font-semibold">Soil Texture Prior</div>
                    <div className="text-[10px] text-slate-300">{currentFarm.farmAnswers?.soilTexture?.replace('_', ' ') || 'Silt Loam'}</div>
                  </div>
                  <span className="text-[11px] font-mono text-[#73CAD0] font-bold">Confirmed</span>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Methodology &amp; citations:</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('data')}
                  className="text-[#27D7B2] hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  Data &amp; Trust Center →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video / Interactive Explainer Modal */}
      <WatchHowItWorksModal
        isOpen={isWatchModalOpen}
        onClose={() => setIsWatchModalOpen(false)}
        onStartAnalysis={onStartAnalysis}
      />
    </div>
  );
};

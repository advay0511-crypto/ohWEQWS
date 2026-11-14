import React, { useState, useMemo, useEffect } from 'react';
import {
  Sliders,
  RotateCcw,
  Save,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Droplet,
  Thermometer,
  CloudRain,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  ArrowRight,
  Flame,
  Sun,
  Waves,
  ShieldCheck,
  AlertTriangle,
  Info,
  Calendar,
  X,
  Copy,
  Trash2,
  Check,
  ArrowUpRight,
  GitCompare,
  SlidersHorizontal,
  Compass,
  FileText,
} from 'lucide-react';
import {
  SavedFarmPlan,
  WhatIfParameters,
  WhatIfComparison,
  SavedWhatIfScenario,
  SoilTextureType,
  RotationResult,
} from '../../types';
import { runWhatIfScenario } from '../../engine/scoring';
import {
  loadWhatIfScenarios,
  saveWhatIfScenario,
  deleteWhatIfScenario,
  duplicateWhatIfScenario,
  saveFarmPlan,
} from '../../store/farmStorage';
import { getCropImage } from '../../services/cropImages';

export interface WhatIfSimulatorProps {
  farms: SavedFarmPlan[];
  activeFarmId: string;
  onSelectFarm: (farmId: string) => void;
  onOpenNewAnalysis: (farmId: string) => void;
  onApplyPlan?: (updatedFarm: SavedFarmPlan) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  farms,
  activeFarmId,
  onSelectFarm,
  onOpenNewAnalysis,
  onApplyPlan,
}) => {
  const selectedFarm = farms.find((f) => f.id === activeFarmId) || farms[0];
  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    selectedFarm?.fields?.[0]?.id || ''
  );

  // Simple vs Advanced display mode
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);

  // Scenario parameter state
  const [tempDeltaC, setTempDeltaC] = useState<number>(0);
  const [precipDeltaPct, setPrecipDeltaPct] = useState<number>(0);
  const [waterSupplyDeltaPct, setWaterSupplyDeltaPct] = useState<number>(0);
  const [initialSoilMoistureDeltaPct, setInitialSoilMoistureDeltaPct] = useState<number>(0);
  const [plantingDateShiftDays, setPlantingDateShiftDays] = useState<number>(0);
  const [soilTextureOverride, setSoilTextureOverride] = useState<SoilTextureType | undefined>(undefined);
  const [soilPhOverride, setSoilPhOverride] = useState<number | undefined>(undefined);

  // Scenario management & Saved scenarios
  const [activeScenarioName, setActiveScenarioName] = useState<string>('Custom Sandbox Scenario');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [scenarioNameInput, setScenarioNameInput] = useState('');
  const [savedScenarios, setSavedScenarios] = useState<SavedWhatIfScenario[]>(() =>
    loadWhatIfScenarios(selectedFarm?.id)
  );
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Apply to real plan confirmation review modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applySuccessNotice, setApplySuccessNotice] = useState(false);

  // Detailed agronomic telemetry drawer
  const [showTelemetry, setShowTelemetry] = useState(false);

  // Sync saved scenarios when active farm changes
  useEffect(() => {
    if (selectedFarm?.id) {
      setSavedScenarios(loadWhatIfScenarios(selectedFarm.id));
      setSelectedFieldId(selectedFarm?.fields?.[0]?.id || '');
    }
  }, [selectedFarm?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Baseline data from active farm analysis
  const baselineAnalysis = selectedFarm?.analysis;
  const baselineRotations = baselineAnalysis?.rotations || [];
  const farmAnswers = selectedFarm?.farmAnswers;
  const climateData = baselineAnalysis?.climateData;

  const parameters: WhatIfParameters = useMemo(
    () => ({
      tempDeltaC,
      precipDeltaPct,
      waterSupplyDeltaPct,
      initialSoilMoistureDeltaPct,
      plantingDateShiftDays,
      soilTextureOverride,
      soilPhOverride,
    }),
    [
      tempDeltaC,
      precipDeltaPct,
      waterSupplyDeltaPct,
      initialSoilMoistureDeltaPct,
      plantingDateShiftDays,
      soilTextureOverride,
      soilPhOverride,
    ]
  );

  // Check if current parameters deviate from zero baseline
  const isDirty =
    tempDeltaC !== 0 ||
    precipDeltaPct !== 0 ||
    waterSupplyDeltaPct !== 0 ||
    initialSoilMoistureDeltaPct !== 0 ||
    plantingDateShiftDays !== 0 ||
    soilTextureOverride !== undefined ||
    soilPhOverride !== undefined;

  // Recalculate deterministic scenario outcomes
  const { scenarios, comparisons } = useMemo(() => {
    if (!baselineRotations.length || !farmAnswers || !climateData) {
      return { scenarios: [], comparisons: [] };
    }
    return runWhatIfScenario(baselineRotations, farmAnswers, climateData, parameters);
  }, [baselineRotations, farmAnswers, climateData, parameters]);

  // Check if scenario lies in extrapolation territory (Section 30.13 & 66)
  const isExtrapolation =
    Math.abs(tempDeltaC) >= 4.0 ||
    Math.abs(precipDeltaPct) >= 45 ||
    Math.abs(waterSupplyDeltaPct) >= 50;

  // Reset all controls to zero deltas, strictly reproducing baseline
  const handleResetToBaseline = () => {
    setTempDeltaC(0);
    setPrecipDeltaPct(0);
    setWaterSupplyDeltaPct(0);
    setInitialSoilMoistureDeltaPct(0);
    setPlantingDateShiftDays(0);
    setSoilTextureOverride(undefined);
    setSoilPhOverride(undefined);
    setActiveScenarioName('Baseline Parameters (0 Deltas)');
    showToast('Controls reset to baseline parameters.');
  };

  // Preset Handlers (Section 10.1 & 30.13)
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'drought':
        setTempDeltaC(2.5);
        setPrecipDeltaPct(-30);
        setWaterSupplyDeltaPct(-20);
        setInitialSoilMoistureDeltaPct(-15);
        setPlantingDateShiftDays(0);
        setActiveScenarioName('Severe Drought (-30% Rain, +2.5°C)');
        break;
      case 'heatwave':
        setTempDeltaC(4.0);
        setPrecipDeltaPct(-10);
        setWaterSupplyDeltaPct(0);
        setInitialSoilMoistureDeltaPct(-5);
        setPlantingDateShiftDays(7);
        setActiveScenarioName('Heatwave Surge (+4.0°C Thermal Offset)');
        break;
      case 'water_cutback':
        setTempDeltaC(0.5);
        setPrecipDeltaPct(-15);
        setWaterSupplyDeltaPct(-50);
        setInitialSoilMoistureDeltaPct(0);
        setPlantingDateShiftDays(0);
        setActiveScenarioName('Water Quota Cutback (-50% Pumping)');
        break;
      case 'wet_season':
        setTempDeltaC(-1.0);
        setPrecipDeltaPct(35);
        setWaterSupplyDeltaPct(20);
        setInitialSoilMoistureDeltaPct(15);
        setPlantingDateShiftDays(-5);
        setActiveScenarioName('Extended Wet Season (+35% Rain)');
        break;
      default:
        handleResetToBaseline();
        break;
    }
  };

  // Save Scenario Handler
  const handleSaveScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioNameInput.trim() || !selectedFarm) return;

    const newScenario: SavedWhatIfScenario = {
      id: `scen_${Date.now()}`,
      name: scenarioNameInput.trim(),
      baselineRunId: baselineAnalysis?.runId || baselineAnalysis?.id || 'base_run',
      farmId: selectedFarm.id,
      fieldId: selectedFieldId,
      parameters,
      results: comparisons,
      createdAt: new Date().toISOString(),
      scenarioOnly: true,
    };

    const updated = saveWhatIfScenario(newScenario);
    setSavedScenarios(updated);
    setActiveScenarioName(newScenario.name);
    setScenarioNameInput('');
    setSaveModalOpen(false);
    showToast(`Scenario "${newScenario.name}" saved to library.`);
  };

  const handleLoadSaved = (scen: SavedWhatIfScenario) => {
    setTempDeltaC(scen.parameters.tempDeltaC || 0);
    setPrecipDeltaPct(scen.parameters.precipDeltaPct || 0);
    setWaterSupplyDeltaPct(scen.parameters.waterSupplyDeltaPct || 0);
    setInitialSoilMoistureDeltaPct(scen.parameters.initialSoilMoistureDeltaPct || 0);
    setPlantingDateShiftDays(scen.parameters.plantingDateShiftDays || 0);
    setSoilTextureOverride(scen.parameters.soilTextureOverride);
    setSoilPhOverride(scen.parameters.soilPhOverride);
    setActiveScenarioName(scen.name);
    setSavedDrawerOpen(false);
    showToast(`Loaded scenario: "${scen.name}"`);
  };

  const handleDeleteSaved = (id: string, name: string) => {
    const updated = deleteWhatIfScenario(id);
    setSavedScenarios(updated);
    showToast(`Deleted scenario: "${name}"`);
  };

  const handleDuplicateSaved = (id: string) => {
    const dup = duplicateWhatIfScenario(id);
    if (dup && selectedFarm?.id) {
      setSavedScenarios(loadWhatIfScenarios(selectedFarm.id));
      showToast(`Duplicated scenario as "${dup.name}"`);
    }
  };

  // "Apply to Real Plan" Commit Action (Section 10.3 & 66)
  const handleConfirmApplyToRealPlan = () => {
    if (!selectedFarm) return;
    const updatedAnswers = {
      ...selectedFarm.farmAnswers,
      soilTexture: soilTextureOverride || selectedFarm.farmAnswers.soilTexture,
      soilPh: soilPhOverride ?? selectedFarm.farmAnswers.soilPh,
    };

    const newFarmVersion: SavedFarmPlan = {
      ...selectedFarm,
      farmAnswers: updatedAnswers,
      updatedAt: new Date().toISOString(),
      notes: `Applied What-If Scenario "${activeScenarioName}" on ${new Date().toLocaleDateString()}`,
    };

    saveFarmPlan(newFarmVersion);
    if (onApplyPlan) {
      onApplyPlan(newFarmVersion);
    }
    setApplyModalOpen(false);
    setApplySuccessNotice(true);
    setTimeout(() => setApplySuccessNotice(false), 4000);
    showToast(`Plan updated: Created new version with applied scenario assumptions.`);
  };

  const topScenario = scenarios[0];
  const topBaseline = baselineRotations[0];
  const topComparison = comparisons.find((c) => c.baselineRotationId === topScenario?.id);
  const scoreDelta =
    topComparison?.scoreDelta ??
    (topScenario && topBaseline ? topScenario.totalScore - topBaseline.totalScore : 0);

  // Single-Factor Driver Attribution (Section 67)
  const primaryDriverText = useMemo(() => {
    if (!isDirty) return 'Identical to baseline — 0 environmental or management deltas applied.';
    if (Math.abs(tempDeltaC) >= 3.0) {
      return `Thermal stress (+${tempDeltaC}°C) is the dominant driver, accelerating evapotranspiration and shortening grain-fill duration.`;
    }
    if (Math.abs(waterSupplyDeltaPct) >= 35) {
      return `Water quota shift (${waterSupplyDeltaPct > 0 ? '+' : ''}${waterSupplyDeltaPct}%) directly adjusts Readily Available Water (RAW) thresholds.`;
    }
    if (Math.abs(precipDeltaPct) >= 25) {
      return `Precipitation anomaly (${precipDeltaPct > 0 ? '+' : ''}${precipDeltaPct}%) controls seasonal recharge and root-zone soil water deficits.`;
    }
    if (plantingDateShiftDays !== 0) {
      return `Planting window shift (${plantingDateShiftDays > 0 ? '+' : ''}${plantingDateShiftDays} days) exposes reproductive phases to differing thermal windows.`;
    }
    if (soilTextureOverride) {
      return `Soil hydraulic modification to ${soilTextureOverride.replace('_', ' ')} shifts total available water (TAW) retention by ~25%.`;
    }
    return 'Combined multi-variable interaction across climate and soil moisture.';
  }, [
    isDirty,
    tempDeltaC,
    precipDeltaPct,
    waterSupplyDeltaPct,
    plantingDateShiftDays,
    soilTextureOverride,
  ]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 py-5 space-y-5 text-white">
      {/* 1. STICKY COMPACT CONTEXT BAR (Section 30.13 & 65) */}
      <div className="p-3.5 sm:p-4 rounded-2xl glass-card border border-white/[0.14] shadow-xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 sticky top-16 z-30">
        {/* Left: Brand + Farm & Field Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#27D7B2]/20 to-[#12887A]/30 border border-[#27D7B2]/40 flex items-center justify-center text-[#27D7B2] shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white tracking-tight">Scenario Simulator</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30">
                Scenario Only · Sandbox
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10">
                Baseline: {baselineAnalysis?.id ? 'Verified 30y Baseline' : 'Default Model'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Test environmental &amp; management shocks without altering real farm records.
            </p>
          </div>
        </div>

        {/* Center: Farm & Field Picker */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs">
            <span className="text-slate-400">Farm:</span>
            <select
              value={selectedFarm?.id}
              onChange={(e) => onSelectFarm(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {selectedFarm && (selectedFarm.fields?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs">
              <span className="text-slate-400">Field:</span>
              <select
                value={selectedFieldId}
                onChange={(e) => setSelectedFieldId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {selectedFarm.fields?.map((f) => (
                  <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Mode Toggle + Saved Scenarios + Reset + Apply */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Simple vs Advanced Toggle */}
          <button
            type="button"
            onClick={() => setIsAdvanced(!isAdvanced)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isAdvanced
                ? 'bg-[#27D7B2]/20 border-[#27D7B2] text-[#27D7B2]'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {isAdvanced ? 'Mode: Advanced' : 'Mode: Simple'}
          </button>

          {/* Saved Scenarios Button */}
          <button
            type="button"
            onClick={() => setSavedDrawerOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FolderSavedIcon className="w-3.5 h-3.5 text-[#27D7B2]" />
            <span>Saved Scenarios ({savedScenarios.length})</span>
          </button>

          {/* Reset to Baseline Button */}
          {isDirty && (
            <button
              type="button"
              onClick={handleResetToBaseline}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              title="Reset all sliders to reproduce baseline exactly"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Save Scenario Button */}
          <button
            type="button"
            onClick={() => {
              setScenarioNameInput(activeScenarioName !== 'Custom Sandbox Scenario' ? activeScenarioName : '');
              setSaveModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#27D7B2]/15 hover:bg-[#27D7B2]/25 border border-[#27D7B2]/30 text-[#27D7B2] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Scenario</span>
          </button>

          {/* Apply to Real Plan Button */}
          {isDirty && (
            <button
              type="button"
              onClick={() => setApplyModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB394] text-[#020A10] text-xs font-black transition-all shadow-md shadow-[#27D7B2]/20 hover:brightness-110 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Apply to Real Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-[#27D7B2]/20 border border-[#27D7B2]/40 text-[#27D7B2] text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Plan Applied Confirmation Notice */}
      {applySuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400/40 text-emerald-200 text-xs space-y-1">
          <div className="font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Real Farm Plan Successfully Updated</span>
          </div>
          <p>
            A new versioned plan has been generated with accepted scenario parameters. Historical reports and rotation history remain preserved.
          </p>
        </div>
      )}

      {/* Extrapolation Warning Alert (Section 30.13 & 66) */}
      {isExtrapolation && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300">Extrapolation Warning: </strong>
            One or more scenario parameters exceed the 30-year regional climatological variance envelope (e.g. &gt; +4°C or &gt; 45% precipitation delta). Simulation confidence is reduced to <em>Moderate/Extrapolated</em>.
          </div>
        </div>
      )}

      {/* 2. MAIN 12-COLUMN DESKTOP GRID (Section 30.13 Contract) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ============================================================== */}
        {/* COLUMNS 1-4 (33.3%): CONTROLS, WORKSPACE SETUP & PRESETS       */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 rounded-2xl glass-card border border-white/[0.14] p-5 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#27D7B2]" />
              <h3 className="text-sm font-bold text-white">Scenario Shocks &amp; Controls</h3>
            </div>
            <span className="text-[11px] font-mono text-[#27D7B2]">Deterministic FAO-56</span>
          </div>

          {/* Quick Stress Presets */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">
              Quick Climate &amp; Quota Presets
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => applyPreset('drought')}
                className="p-2 rounded-xl bg-black/40 hover:bg-amber-500/15 border border-white/10 hover:border-amber-400/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-300 group-hover:text-amber-200">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Severe Drought</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">-30% rain, +2.5°C</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('heatwave')}
                className="p-2 rounded-xl bg-black/40 hover:bg-rose-500/15 border border-white/10 hover:border-rose-400/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-rose-300 group-hover:text-rose-200">
                  <Sun className="w-3.5 h-3.5 text-rose-400" />
                  <span>Heatwave Spike</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">+4.0°C thermal offset</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('water_cutback')}
                className="p-2 rounded-xl bg-black/40 hover:bg-teal-500/15 border border-white/10 hover:border-teal-400/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-teal-300 group-hover:text-teal-200">
                  <Droplet className="w-3.5 h-3.5 text-teal-400" />
                  <span>Quota Cutback</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">-50% irrigation supply</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('wet_season')}
                className="p-2 rounded-xl bg-black/40 hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-sky-300 group-hover:text-sky-200">
                  <Waves className="w-3.5 h-3.5 text-sky-400" />
                  <span>Wet Season</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">+35% rain, -1.0°C</div>
              </button>
            </div>
          </div>

          {/* Slider 1: Temperature Delta */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                Temperature Shift
              </span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  tempDeltaC > 0
                    ? 'bg-amber-400/20 text-amber-300'
                    : tempDeltaC < 0
                    ? 'bg-sky-400/20 text-sky-300'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {tempDeltaC > 0 ? `+${tempDeltaC}°C` : `${tempDeltaC}°C`}
              </span>
            </div>
            <input
              type="range"
              min="-3"
              max="5"
              step="0.5"
              value={tempDeltaC}
              onChange={(e) => setTempDeltaC(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none bg-slate-800 accent-[#27D7B2] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-3°C Cooler</span>
              <span>Baseline ({climateData?.meanTempC?.toFixed(1) || 17.5}°C)</span>
              <span>+5°C Scorching</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Shifts daily mean and summer peaks, increasing crop reference evapotranspiration (ET₀).
            </p>
          </div>

          {/* Slider 2: Precipitation Delta */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-sky-400" />
                Precipitation Shift
              </span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  precipDeltaPct > 0
                    ? 'bg-sky-400/20 text-sky-300'
                    : precipDeltaPct < 0
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {precipDeltaPct > 0 ? `+${precipDeltaPct}%` : `${precipDeltaPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={precipDeltaPct}
              onChange={(e) => setPrecipDeltaPct(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-lg appearance-none bg-slate-800 accent-sky-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-50% Arid</span>
              <span>Baseline ({climateData?.annualPrecipitationMm || 550} mm)</span>
              <span>+50% Plentiful</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Modifies seasonal rainfall series ingested by the dual-strata root water ledger.
            </p>
          </div>

          {/* Slider 3: Irrigation Supply / Quota */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-[#27D7B2]" />
                Irrigation Supply / Quota
              </span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  waterSupplyDeltaPct > 0
                    ? 'bg-emerald-400/20 text-emerald-300'
                    : waterSupplyDeltaPct < 0
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {waterSupplyDeltaPct > 0 ? `+${waterSupplyDeltaPct}%` : `${waterSupplyDeltaPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-60"
              max="50"
              step="5"
              value={waterSupplyDeltaPct}
              onChange={(e) => setWaterSupplyDeltaPct(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-lg appearance-none bg-slate-800 accent-[#27D7B2] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-60% Restrict</span>
              <span>Quota (100%)</span>
              <span>+50% Surplus</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Simulates government allocation restrictions or well capacity drawdowns.
            </p>
          </div>

          {/* Advanced Sliders: Planting Window & Soil Drainage */}
          {isAdvanced && (
            <>
              {/* Slider 4: Planting Date Shift */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    Planting Window Shift
                  </span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                      plantingDateShiftDays !== 0
                        ? 'bg-purple-400/20 text-purple-300'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {plantingDateShiftDays > 0
                      ? `+${plantingDateShiftDays}d (Late)`
                      : plantingDateShiftDays < 0
                      ? `${plantingDateShiftDays}d (Early)`
                      : '0d (On Time)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="5"
                  value={plantingDateShiftDays}
                  onChange={(e) => setPlantingDateShiftDays(parseInt(e.target.value, 10))}
                  className="w-full h-2 rounded-lg appearance-none bg-slate-800 accent-purple-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>-30 Days Early</span>
                  <span>Normal</span>
                  <span>+30 Days Delayed</span>
                </div>
              </div>

              {/* Slider 5: Initial Root-Zone Soil Moisture */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <Waves className="w-4 h-4 text-teal-400" />
                    Starting Soil Moisture
                  </span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                      initialSoilMoistureDeltaPct !== 0
                        ? 'bg-teal-400/20 text-teal-300'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {initialSoilMoistureDeltaPct > 0
                      ? `+${initialSoilMoistureDeltaPct}%`
                      : `${initialSoilMoistureDeltaPct}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="5"
                  value={initialSoilMoistureDeltaPct}
                  onChange={(e) => setInitialSoilMoistureDeltaPct(parseInt(e.target.value, 10))}
                  className="w-full h-2 rounded-lg appearance-none bg-slate-800 accent-teal-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Dry Seedbed (-30%)</span>
                  <span>Profile Normal</span>
                  <span>Saturated (+30%)</span>
                </div>
              </div>

              {/* Soil Texture Class Override */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#27D7B2]" />
                    Soil Hydraulic Texture
                  </span>
                  <span className="text-[11px] text-slate-400 capitalize">
                    {soilTextureOverride?.replace('_', ' ') || 'Baseline'}
                  </span>
                </div>
                <select
                  value={soilTextureOverride || ''}
                  onChange={(e) =>
                    setSoilTextureOverride((e.target.value as SoilTextureType) || undefined)
                  }
                  className="w-full bg-black/40 border border-white/10 text-xs text-white rounded-xl p-2.5 focus:border-[#27D7B2] focus:outline-none"
                >
                  <option value="">Baseline: {farmAnswers?.soilTexture?.replace('_', ' ') || 'Farm Loam'}</option>
                  <option value="sandy">Sandy (Fast drainage, rapid dryout)</option>
                  <option value="sandy_loam">Sandy Loam (Moderate water storage)</option>
                  <option value="loam">Loam (Optimal moisture retention)</option>
                  <option value="silt_loam">Silt Loam (Deep subsoil reservoir)</option>
                  <option value="clay">Heavy Clay (High waterlogging risk)</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* ============================================================== */}
        {/* COLUMNS 5-9 (41.7%): BASELINE VS SCENARIO COMPARISON           */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 space-y-5">
          {topScenario ? (
            <div className="rounded-2xl glass-card border border-white/[0.14] p-5 sm:p-6 space-y-5 shadow-lg">
              {/* Header: Score Comparison */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs text-[#27D7B2] font-bold uppercase tracking-wider block">
                    Leading Rotation Comparison
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                    {topScenario.name}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Baseline</span>
                    <span className="text-base font-mono font-bold text-slate-300">
                      {topBaseline?.totalScore || 80}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500" />

                  <div className="text-right p-2 px-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-[#27D7B2] block">
                      Scenario Score
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl font-mono font-bold text-white">
                        {topScenario.totalScore}
                      </span>
                      {scoreDelta !== 0 && (
                        <span
                          className={`text-xs font-bold flex items-center ${
                            scoreDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {scoreDelta > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Infeasibility / Hard Constraint Warning */}
              {topComparison?.isInfeasible && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-1">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Rotation Plan Breaches Hard Constraint: No Longer Feasible</span>
                  </div>
                  <p>{topComparison.infeasibleReason}</p>
                </div>
              )}

              {/* Component Metric Comparison Badges */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Droplet className="w-3 h-3 text-sky-400" /> Water Margin
                  </span>
                  <div className="text-sm font-bold text-white">
                    {topScenario.componentScores?.water ?? 75}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {topComparison?.waterStressDeltaDays
                      ? `${topComparison.waterStressDeltaDays > 0 ? '+' : ''}${topComparison.waterStressDeltaDays} stress days`
                      : '0 delta days'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Layers className="w-3 h-3 text-emerald-400" /> Soil Health
                  </span>
                  <div className="text-sm font-bold text-white">
                    {topScenario.componentScores?.soilHealth ?? 80}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">SOM Trajectory</div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Thermal Fit
                  </span>
                  <div className="text-sm font-bold text-white">
                    {topScenario.componentScores?.suitability ?? 85}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Phenology Fit</div>
                </div>
              </div>

              {/* Visual Crop Sequence Flow */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-xs font-bold text-white block">
                  Simulated Rotational Sequence Flow
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {topScenario.sequence.map((step, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl overflow-hidden border border-white/10 bg-black/40 group hover:border-[#27D7B2]/50 transition-all"
                    >
                      <div className="h-20 w-full overflow-hidden relative">
                        <img
                          src={getCropImage(step.cropName)}
                          alt={step.cropName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-mono px-1 py-0.5 rounded bg-black/70 text-white border border-white/20">
                          Yr {idx + 1}
                        </span>
                      </div>
                      <div className="p-2 space-y-0.5">
                        <div className="text-xs font-bold text-white truncate">{step.cropName}</div>
                        <div className="text-[10px] text-slate-400">{step.durationDays}d cycle</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Candidate Rotations Score & Rank Movement Matrix (Section 10.2 & 30.13) */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Candidate Rotations Movement</span>
                  <span className="text-[10px] font-mono text-slate-400">All Rotations Matrix</span>
                </div>

                <div className="space-y-1.5">
                  {comparisons.map((c) => (
                    <div
                      key={c.baselineRotationId}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                        c.isInfeasible
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : c.scoreDelta > 0
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-black/30 border-white/10'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{c.rotationName}</span>
                          {c.isInfeasible && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300">
                              Infeasible
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Rank: #{c.baselineRank} → #{c.scenarioRank} · Driver: {c.primaryMovingFactor}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-white">
                          {c.scenarioScore}/100
                        </div>
                        <div
                          className={`text-[10px] font-bold font-mono ${
                            c.scoreDelta > 0
                              ? 'text-emerald-400'
                              : c.scoreDelta < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {c.scoreDelta > 0 ? `+${c.scoreDelta}` : c.scoreDelta} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl glass-card border border-white/10 text-center space-y-3">
              <span className="text-3xl">🌾</span>
              <h3 className="text-base font-bold text-white">No Baseline Analysis Found</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                An initial parcel analysis is required to generate the deterministic baseline.
              </p>
              <button
                type="button"
                onClick={() => onOpenNewAnalysis(selectedFarm?.id || '')}
                className="px-4 py-2 rounded-xl bg-[#27D7B2] text-[#020A10] text-xs font-bold transition-all cursor-pointer"
              >
                Run Baseline Analysis
              </button>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* COLUMNS 10-12 (25%): IMPACT SUMMARY, DRIVERS & DIAGNOSTICS   */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 space-y-4">
          {/* Driver Attribution Card */}
          <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.14] space-y-3 shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#27D7B2] block">
              Driver Attribution &amp; Diagnostics
            </span>
            <h4 className="text-xs font-bold text-white">
              Primary Sensitivity Driver:
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed">
              {primaryDriverText}
            </p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-300 space-y-1">
              <span className="font-bold text-white block">Agronomic Threshold Check:</span>
              <p>
                {waterSupplyDeltaPct < -30
                  ? 'Water quota reduction crosses the deficit irrigation tolerance line. High-water demand phases suffer up to 14 days of reproductive stress.'
                  : 'Rotations maintain adequate transpiration buffer across current phenological projections.'}
              </p>
            </div>
          </div>

          {/* Scientific Calculation Contract Disclosure (Section 66) */}
          <div className="p-4 rounded-2xl glass-card border border-white/[0.14] space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
              <ShieldCheck className="w-4 h-4 text-[#27D7B2]" />
              <span>Scientific Integrity Contract</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Scenarios are calculated dynamically by perturbing underlying climatological time-series and running them through the deterministic FAO-56 dual crop coefficient model. Results represent simulated scenarios, not guaranteed weather forecasts.
            </p>
          </div>

          {/* Quick Apply Action Box */}
          {isDirty && (
            <div className="p-4 rounded-2xl bg-[#27D7B2]/10 border border-[#27D7B2]/30 space-y-2.5">
              <span className="text-xs font-bold text-white block">Ready to Commit Changes?</span>
              <p className="text-[11px] text-slate-300">
                Apply accepted assumptions into your real farm plan. Creates a new immutable plan version with zero loss of prior historical reports.
              </p>
              <button
                type="button"
                onClick={() => setApplyModalOpen(true)}
                className="w-full py-2 rounded-xl bg-[#27D7B2] hover:bg-[#20caa6] text-[#020A10] text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Review &amp; Apply Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MODAL: SAVE SCENARIO (Section 10.3)                         */}
      {/* ============================================================== */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl glass-card border border-white/20 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Save className="w-4 h-4 text-[#27D7B2]" />
                <span>Save What-If Scenario</span>
              </h3>
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveScenario} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Scenario Name</label>
                <input
                  type="text"
                  required
                  value={scenarioNameInput}
                  onChange={(e) => setScenarioNameInput(e.target.value)}
                  placeholder="e.g. Dry Season 2027 or Low Water Quota"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27D7B2]"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-300 space-y-1">
                <span className="font-semibold text-white">Snapshot to be saved:</span>
                <div>Temperature: {tempDeltaC > 0 ? `+${tempDeltaC}°C` : `${tempDeltaC}°C`}</div>
                <div>Precipitation: {precipDeltaPct > 0 ? `+${precipDeltaPct}%` : `${precipDeltaPct}%`}</div>
                <div>Irrigation Quota: {waterSupplyDeltaPct}%</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#27D7B2] text-[#020A10] text-xs font-black"
                >
                  Save Scenario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODAL: SAVED SCENARIOS LIBRARY DRAWER (Section 10.3)        */}
      {/* ============================================================== */}
      {savedDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl glass-card border border-white/20 p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderSavedIcon className="w-4 h-4 text-[#27D7B2]" />
                  <span>Saved What-If Scenarios</span>
                </h3>
                <span className="text-xs text-slate-400">Farm: {selectedFarm?.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setSavedDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {savedScenarios.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <p>No saved scenarios in this farm library yet.</p>
                <p className="text-slate-500">
                  Adjust sliders on the canvas and click "Save Scenario" to build your stress-test library.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedScenarios.map((scen) => (
                  <div
                    key={scen.id}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white text-sm">{scen.name}</div>
                      <div className="text-slate-400 text-[11px] font-mono">
                        {new Date(scen.createdAt).toLocaleDateString()} · Temp:{' '}
                        {scen.parameters.tempDeltaC}°C, Rain: {scen.parameters.precipDeltaPct}%, Water:{' '}
                        {scen.parameters.waterSupplyDeltaPct}%
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleLoadSaved(scen)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#27D7B2] hover:bg-[#20caa6] text-[#020A10] font-black text-xs cursor-pointer"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateSaved(scen.id)}
                        title="Duplicate Scenario"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(scen.id, scen.name)}
                        title="Delete Scenario"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL: "APPLY TO REAL PLAN" CONFIRMATION REVIEW (Section 10.3 & 66) */}
      {/* ============================================================== */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl glass-card border border-white/20 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Check className="w-5 h-5 text-[#27D7B2] stroke-[3]" />
                <span>Review &amp; Apply Changes to Real Plan</span>
              </h3>
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                In accordance with Section 10.3, the Scenario Simulator never overwrites real farm assumptions without explicit review. You are about to commit the following parameters to{' '}
                <strong className="text-white">{selectedFarm?.name}</strong>:
              </p>

              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-slate-400">Scenario Name:</span>
                  <span className="text-[#27D7B2] font-bold">{activeScenarioName}</span>
                </div>
                {soilTextureOverride && (
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Soil Texture Revision:</span>
                    <span className="text-white capitalize">{soilTextureOverride.replace('_', ' ')}</span>
                  </div>
                )}
                {soilPhOverride != null && (
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-slate-400">Soil pH Revision:</span>
                    <span className="text-white">{soilPhOverride}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Downstream Impact:</span>
                  <span className="text-amber-300">Creates new farm plan version v2</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * Historical reports and previous rotation plans remain preserved and accessible in the archive.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApplyToRealPlan}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB394] text-[#020A10] text-xs font-black shadow-lg shadow-[#27D7B2]/20 cursor-pointer"
              >
                Confirm &amp; Create New Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function FolderSavedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}

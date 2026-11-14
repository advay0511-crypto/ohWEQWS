import React, { useState } from 'react';
import {
  MapPin,
  ArrowLeft,
  Sparkles,
  Droplet,
  CloudRain,
  Sliders,
  ChevronRight,
  Layers,
  Globe,
  Plus,
  Compass,
  CheckCircle2,
  Calendar,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  SavedFarmPlan,
  FieldRecord,
  AppViewMode,
  AppUnits,
  FarmActivity,
} from '../../types';
import { computeDailyStatusSnapshot } from '../../services/dailySnapshot';
import { getFarmRegionImage, getCropImage } from '../../services/cropImages';
import { formatArea } from '../../engine/geodesic';
import { Parcel3DViewer } from '../Three/Parcel3DViewer';

interface CanonicalFarmViewProps {
  farm: SavedFarmPlan;
  initialFieldId?: string;
  viewMode: AppViewMode;
  units: AppUnits;
  openedFromMaps?: boolean;
  onBack?: () => void;
  onBackToMaps?: () => void;
  onSelectFarm?: (farmId: string) => void;
  onOpenNewAnalysis: (farmId: string, fieldId?: string) => void;
  onOpenDeepAnalysis: (farmId: string, fieldId?: string) => void;
  onOpenWhatIf: (farmId: string, fieldId?: string) => void;
  onOpenRotations: (farmId: string) => void;
  onUpdateFarm: (farm: SavedFarmPlan) => void;
  onAddField: (farmId: string, fieldData: Partial<FieldRecord>) => void;
  onRecordActivity: (activity: FarmActivity) => void;
}

export const CanonicalFarmView: React.FC<CanonicalFarmViewProps> = ({
  farm,
  initialFieldId,
  units,
  onBack,
  onOpenNewAnalysis,
  onOpenWhatIf,
  onOpenRotations,
  onRecordActivity,
}) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(initialFieldId || null);
  const [show3D, setShow3D] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const farmFields = farm.fields || [];
  const selectedField = farmFields.find((f) => f.id === selectedFieldId) || farmFields[0];
  const snapshot = computeDailyStatusSnapshot(farm, selectedFieldId || undefined);

  const heroImage = getFarmRegionImage(
    farm.locationName || farm.farmAnswers?.locationName,
    farm.name,
    farm.farmAnswers?.lat,
    farm.farmAnswers?.lon
  );

  const totalAreaHa = farmFields.reduce((sum, f) => sum + (f.areaHa || 10), 0) || 25;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Connected Header Strip with Back & Farm Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Farms</span>
        </button>

        {/* Connected Action Group docked together */}
        <div className="flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => onOpenRotations(farm.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
          >
            <span>Rotations</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenWhatIf(farm.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>What-If</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenNewAnalysis(farm.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Re-Analyze</span>
          </button>
        </div>
      </div>

      {/* Ultra-Realistic Photographic Parcel Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl h-64 sm:h-72">
        <img
          src={heroImage}
          alt={farm.name}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Bottom Banner Content */}
        <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span>{farm.locationName || farm.farmAnswers?.locationName || 'Field Parcel Location'}</span>
              <span>·</span>
              <span>
                {formatArea(totalAreaHa * 10000, typeof units === 'string' ? units : (units as any)?.land === 'ac' ? 'imperial' : 'metric').formatted}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {farm.name}
            </h1>
          </div>

          {/* Quick Parcel Switcher docked on bottom-right of banner */}
          {farmFields.length > 1 && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/15">
              {farmFields.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => setSelectedFieldId(field.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    (selectedFieldId || farmFields[0].id) === field.id
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {field.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Single Unified Visual Status Strip (Zero Card Spam) */}
      <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Soil Moisture */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-sky-400" /> Soil Moisture
              </span>
              <span className="font-mono font-bold text-sky-300">
                {snapshot.water?.topsoilMoisturePct ?? 45}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full"
                style={{ width: `${snapshot.water?.topsoilMoisturePct ?? 45}%` }}
              />
            </div>
          </div>

          {/* Soil pH & Texture */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-400" /> Soil Texture
              </span>
              <span className="font-mono font-bold text-emerald-300 capitalize">
                {farm.farmAnswers?.soilTexture?.replace('_', ' ') || 'Loam'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              pH {farm.farmAnswers?.soilPh || 6.8} · Optimal Nutrient Uptake
            </div>
          </div>

          {/* Climate Condition */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-amber-400" /> Annual Rain
              </span>
              <span className="font-mono font-bold text-amber-300">
                {farm.analysis?.climateData?.annualPrecipitationMm || 540} mm
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              NASA Baseline · Semi-Arid
            </div>
          </div>

          {/* Active Crop Cycle */}
          <div className="flex items-center gap-2.5">
            <img
              src={getCropImage(snapshot.currentCrop.name)}
              alt={snapshot.currentCrop.name}
              className="w-10 h-10 rounded-lg object-cover border border-white/10"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {snapshot.currentCrop.name}
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <span>{snapshot.currentCrop.growthStageText || snapshot.overallStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Workspace: Interactive 3D / Boundary View + Field Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive 3D Terrain & Soil Strata Preview with Connected Top-Right Mode Switch (8 Cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/10 overflow-hidden shadow-lg relative">
          {/* Connected View Controls docked directly in top-right corner of card */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/15">
            <button
              type="button"
              onClick={() => setShow3D(true)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                show3D ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="3D Terrain & Soil Profile"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShow3D(false)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                !show3D ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Photographic Satellite Texture"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>

          {/* Preview Canvas */}
          <div className="h-80 w-full relative">
            {show3D ? (
              <Parcel3DViewer
                farm={farm}
                field={selectedField}
                cropName={snapshot.currentCrop.name}
                soilTexture={farm.farmAnswers?.soilTexture || 'loam'}
                moisturePercentile={snapshot.water?.topsoilMoisturePct || 45}
              />
            ) : (
              <div className="w-full h-full relative">
                <img
                  src={heroImage}
                  alt="Aerial View"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white">
                  Field Area: {formatArea((selectedField?.areaHa || 10) * 10000, typeof units === 'string' ? units : (units as any)?.land === 'ac' ? 'imperial' : 'metric').formatted}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Field Operations & Soil Profile (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/10 p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-white">
              {selectedField?.name || 'Parcel Details'}
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              {formatArea((selectedField?.areaHa || 10) * 10000, typeof units === 'string' ? units : (units as any)?.land === 'ac' ? 'imperial' : 'metric').formatted}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-slate-400">Irrigation System</span>
              <span className="font-semibold text-white capitalize">
                {farm.farmAnswers?.irrigationType || 'Center Pivot'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-slate-400">Primary Rotation</span>
              <span className="font-semibold text-emerald-300">
                {farm.analysis?.rotations?.[0]?.name || 'Wheat-Legume'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-slate-400">Crop Health Index</span>
              <span className="font-semibold text-white">92% Optimum</span>
            </div>
          </div>

          {/* Collapsible Telemetry Accordion */}
          <div className="border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-white transition-colors"
            >
              <span>Scientific Soil Chemistry</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetails && (
              <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span>Nitrogen Pool:</span>
                  <span className="text-emerald-400">High (Fixation)</span>
                </div>
                <div className="flex justify-between">
                  <span>Infiltration Rate:</span>
                  <span className="text-sky-400">22 mm/hr</span>
                </div>
                <div className="flex justify-between">
                  <span>Cation Exchange:</span>
                  <span className="text-amber-400">18 meq/100g</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

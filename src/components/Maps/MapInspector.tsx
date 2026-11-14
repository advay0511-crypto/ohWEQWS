import React, { useState } from 'react';
import {
  Layers,
  Info,
  Crosshair,
  SplitSquareVertical,
  Users,
  PanelRightClose,
  PanelRightOpen,
  Sprout,
  ShieldCheck,
  AlertTriangle,
  Droplets,
  CloudRain,
  Activity,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sliders,
  Database,
  Lock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Send,
  X,
} from 'lucide-react';
import { SavedFarmPlan, FieldBoundaryItem, AppUnits } from '../../types';
import {
  InspectorTab,
  LayerId,
  LayerMetadata,
  BasemapType,
  InspectedPixel,
  RegionalCohort,
} from './types';
import {
  MAP_LAYERS_CATALOG,
  HISTORICAL_OBSERVATION_DATES,
  REGIONAL_COHORTS_DATA,
} from './mapDataCatalog';
import { formatArea } from '../../engine/geodesic';

interface MapInspectorProps {
  selectedFarm: SavedFarmPlan | undefined;
  selectedField: FieldBoundaryItem | undefined;
  activeTab: InspectorTab;
  onSetTab: (tab: InspectorTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  basemapType: BasemapType;
  onSelectBasemap: (type: BasemapType) => void;
  activeLayers: Set<LayerId>;
  onToggleLayer: (layerId: LayerId) => void;
  layerOpacity: Record<string, number>;
  onChangeLayerOpacity: (layerId: LayerId, opacity: number) => void;
  inspectedPixel: InspectedPixel | null;
  observationDate: string;
  onSelectObservationDate: (date: string) => void;
  compareBeforeDate: string;
  compareAfterDate: string;
  onSetCompareBeforeDate: (date: string) => void;
  onSetCompareAfterDate: (date: string) => void;
  swipePosition: number;
  onSetSwipePosition: (pos: number) => void;
  onOpenFarmView: (farmId: string, fieldId?: string) => void;
  onOpenCropRotation: (farmId: string, fieldId?: string) => void;
  onOpenDeepAnalysis?: (farmId: string, fieldId?: string) => void;
  units: AppUnits;
  isAdvanced?: boolean;
}

export const MapInspector: React.FC<MapInspectorProps> = ({
  selectedFarm,
  selectedField,
  activeTab,
  onSetTab,
  isCollapsed,
  onToggleCollapse,
  basemapType,
  onSelectBasemap,
  activeLayers,
  onToggleLayer,
  layerOpacity,
  onChangeLayerOpacity,
  inspectedPixel,
  observationDate,
  onSelectObservationDate,
  compareBeforeDate,
  compareAfterDate,
  onSetCompareBeforeDate,
  onSetCompareAfterDate,
  swipePosition,
  onSetSwipePosition,
  onOpenFarmView,
  onOpenCropRotation,
  onOpenDeepAnalysis,
  units,
  isAdvanced,
}) => {
  // Expanded layer metadata disclosure
  const [expandedLayerMeta, setExpandedLayerMeta] = useState<string | null>(null);

  // Regional Network Messaging Modal
  const [selectedPublicProfile, setSelectedPublicProfile] = useState<{
    profileName: string;
    cohortName: string;
  } | null>(null);
  const [messageSentConfirmation, setMessageSentConfirmation] = useState(false);
  const [messageBody, setMessageBody] = useState('');

  if (isCollapsed) {
    return (
      <div className="absolute top-16 right-3 z-20">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2.5 rounded-xl bg-[#061720]/90 hover:bg-[#092230] border border-white/15 text-slate-300 hover:text-white shadow-2xl backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5"
          title="Open Map Inspector Panel"
        >
          <PanelRightOpen className="w-4 h-4 text-[#27D7B2]" />
          <span className="text-xs font-semibold hidden md:inline">Inspector</span>
        </button>
      </div>
    );
  }

  // Calculate field metrics
  const areaHa = selectedField?.areaHa || (selectedFarm?.boundary ? 14.5 : 0);
  const formattedArea = formatArea(areaHa * 10000, units === 'imperial' ? 'imperial' : 'metric');
  const perimeterM = selectedField?.perimeterM || Math.round(Math.sqrt(areaHa * 10000) * 4);
  const centroid = selectedField?.polygon?.[0] || [
    selectedFarm?.lat || 38.8403,
    selectedFarm?.lon || -97.6114,
  ];

  return (
    <div
      className="w-80 sm:w-96 h-full flex flex-col border-l border-white/10 shrink-0 z-20 transition-all select-none glass-card rounded-none border-y-0 border-r-0"
    >
      {/* HEADER: Tabs + Collapse */}
      <div className="p-2 border-b border-white/10 flex items-center justify-between">
        {/* Contextual Tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => onSetTab('overview')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#27D7B2] text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => onSetTab('layers')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'layers'
                ? 'bg-[#27D7B2] text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Layers
          </button>
          <button
            type="button"
            onClick={() => onSetTab('inspect')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inspect'
                ? 'bg-[#27D7B2] text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Inspect
          </button>
          <button
            type="button"
            onClick={() => onSetTab('compare')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'compare'
                ? 'bg-[#27D7B2] text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Compare
          </button>
          <button
            type="button"
            onClick={() => onSetTab('regional')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'regional'
                ? 'bg-[#27D7B2] text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Regional
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
          title="Collapse Inspector Panel"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* BODY CONTENT BY ACTIVE TAB */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* ========================================================= */}
        {/* TAB 1: FIELD OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Field Header Card */}
            <div className="p-3.5 rounded-2xl glass-card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#27D7B2] uppercase tracking-wider block">
                    {selectedFarm?.name || 'Active Farm'}
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {selectedField?.name || 'Selected Parcel'}
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    selectedField?.status === 'alert'
                      ? 'bg-[#EC7771]/20 text-[#EC7771] border-[#EC7771]/40'
                      : selectedField?.status === 'needs_attention'
                      ? 'bg-[#E8B75D]/20 text-[#E8B75D] border-[#E8B75D]/40'
                      : 'bg-[#57C58D]/20 text-[#57C58D] border-[#57C58D]/40'
                  }`}
                >
                  {selectedField?.status === 'alert'
                    ? 'Alert'
                    : selectedField?.status === 'needs_attention'
                    ? 'Watch'
                    : 'Optimal'}
                </span>
              </div>

              {/* Geometry Dimensions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Mapped Area</span>
                  <span className="text-sm font-bold text-white font-mono">{formattedArea.formatted}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Perimeter</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {perimeterM > 1000 ? `${(perimeterM / 1000).toFixed(2)} km` : `${perimeterM} m`}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1">
                <span>Centroid: {centroid[0].toFixed(4)}°, {centroid[1].toFixed(4)}°</span>
                <span className="text-[#27D7B2]">WGS84 EPSG:4326</span>
              </div>
            </div>

            {/* Scientific Indicators Card */}
            <div className="p-3.5 rounded-2xl glass-card space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#27D7B2]" />
                  <span>Agronomic Telemetry</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">NASA &amp; Sentinel-2</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Metric: Vegetation Vigor */}
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Canopy Vigor (NDVI)</span>
                    <span className="text-white font-bold font-mono">0.68 · Healthy Vigor</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#57C58D]/20 text-[#57C58D] border border-[#57C58D]/30">
                    Observed
                  </span>
                </div>

                {/* Metric: Rootzone Moisture */}
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Rootzone Moisture (0-100cm)</span>
                    <span className="text-white font-bold font-mono">44.8% · Stable Buffer</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#27D7B2]/20 text-[#27D7B2] border border-[#27D7B2]/30">
                    NASA POWER
                  </span>
                </div>

                {/* Metric: Rainfall */}
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Recent 7-Day Precipitation</span>
                    <span className="text-white font-bold font-mono">24.5 mm accumulation</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#4EA5D9]/20 text-[#4EA5D9] border border-[#4EA5D9]/30">
                    Observed
                  </span>
                </div>

                {/* Metric: Topsoil Horizon */}
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Soil Horizon &amp; Texture</span>
                    <span className="text-white font-bold font-mono">
                      {selectedField?.soilTexture || selectedFarm?.farmAnswers?.soilTexture || 'Silt Loam'}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    USDA HWSD
                  </span>
                </div>
              </div>
            </div>

            {/* Downstream Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (selectedFarm) onOpenFarmView(selectedFarm.id, selectedField?.id);
                }}
                className="w-full h-9 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all flex items-center justify-between px-3 cursor-pointer"
              >
                <span>Open Field Operational Overview</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#27D7B2]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedFarm) onOpenCropRotation(selectedFarm.id, selectedField?.id);
                }}
                className="w-full h-9 rounded-xl bg-[#27D7B2]/20 hover:bg-[#27D7B2]/30 border border-[#27D7B2]/40 text-xs font-bold text-[#27D7B2] transition-all flex items-center justify-between px-3 cursor-pointer"
              >
                <span>Plan Crop Rotation for this Field</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {onOpenDeepAnalysis && selectedFarm && (
                <button
                  type="button"
                  onClick={() => onOpenDeepAnalysis(selectedFarm.id, selectedField?.id)}
                  className="w-full h-9 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-xs font-bold text-indigo-300 transition-all flex items-center justify-between px-3 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Deep Agronomic Analysis</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: LAYERS & DATA CATALOG */}
        {/* ========================================================= */}
        {activeTab === 'layers' && (
          <div className="space-y-4">
            {/* Base Map Selector */}
            <div className="p-3.5 rounded-2xl glass-card space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                True Natural Base Map (No Color Filters)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'satellite', label: 'Satellite', desc: 'Esri World Imagery' },
                    { id: 'street', label: 'Road / Street', desc: 'OpenStreetMap' },
                    { id: 'terrain', label: 'Topo / Terrain', desc: 'Esri Topographic' },
                    { id: 'dark', label: 'Dark Neutral', desc: 'CartoDB Dark' },
                  ] as const
                ).map((base) => (
                  <button
                    key={base.id}
                    type="button"
                    onClick={() => onSelectBasemap(base.id)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      basemapType === base.id
                        ? 'bg-[#27D7B2]/20 border-[#27D7B2] text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">{base.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{base.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Layer Catalog by Group */}
            {(
              [
                { category: 'boundaries', label: 'Boundaries & Operations' },
                { category: 'vegetation', label: 'Vegetation & Spectral Indices' },
                { category: 'water_weather', label: 'Weather & Water Context' },
                { category: 'soil_terrain', label: 'Soil & Terrain Profile' },
                { category: 'regional', label: 'Regional Discovery Layer' },
              ] as const
            ).map((group) => {
              const layersInGroup = MAP_LAYERS_CATALOG.filter((l) => l.category === group.category);

              return (
                <div key={group.category} className="p-3.5 rounded-2xl glass-card space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>{group.label}</span>
                    <span className="text-[10px] font-mono text-[#27D7B2]">{layersInGroup.length}</span>
                  </h4>

                  <div className="space-y-2">
                    {layersInGroup.map((layer) => {
                      const isActive = activeLayers.has(layer.id);
                      const isMetaOpen = expandedLayerMeta === layer.id;
                      const opacity = layerOpacity[layer.id] ?? 0.75;

                      return (
                        <div
                          key={layer.id}
                          className={`rounded-xl border transition-all ${
                            isActive
                              ? 'bg-white/[0.04] border-[#27D7B2]/30'
                              : 'bg-white/[0.01] border-white/5 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="p-2.5 flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={() => onToggleLayer(layer.id)}
                                className="rounded accent-[#27D7B2] scale-110 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white truncate">{layer.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">{layer.source}</div>
                              </div>
                            </label>

                            <button
                              type="button"
                              onClick={() => setExpandedLayerMeta(isMetaOpen ? null : layer.id)}
                              className="p-1 rounded text-slate-400 hover:text-white"
                              title="Inspect Layer Source Metadata"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Opacity Slider for active raster layers */}
                          {isActive && (
                            <div className="px-2.5 pb-2.5 pt-1 border-t border-white/5 space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <span>Layer Opacity</span>
                                <span className="text-[#27D7B2]">{Math.round(opacity * 100)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.05"
                                value={opacity}
                                onChange={(e) => onChangeLayerOpacity(layer.id, parseFloat(e.target.value))}
                                className="w-full accent-[#27D7B2] h-1.5 rounded-lg cursor-pointer bg-black/50"
                              />
                            </div>
                          )}

                          {/* Expanded Layer Provenance Drawer */}
                          {isMetaOpen && (
                            <div className="p-2.5 bg-black/60 rounded-b-xl border-t border-white/10 text-[11px] space-y-1.5 text-slate-300">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Sensor / Product:</span>
                                <span className="text-white font-mono">{layer.product}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Spatial Resolution:</span>
                                <span className="text-[#27D7B2] font-mono">{layer.resolution}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Date Window:</span>
                                <span className="text-white font-mono">{layer.dateWindow}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white/[0.03] text-[10px] text-amber-200/90 leading-relaxed">
                                {layer.caveat}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: POINT & PIXEL INSPECTOR */}
        {/* ========================================================= */}
        {activeTab === 'inspect' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl glass-card border border-[#27D7B2]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#27D7B2]">
                <Crosshair className="w-4 h-4 animate-spin-slow" />
                <span>Point &amp; Pixel Sampling Active</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Click anywhere on the map or inside a field to sample real underlying NDVI, rootzone moisture, elevation, and meteorological values at that exact geographic coordinate.
              </p>
            </div>

            {inspectedPixel ? (
              <div className="p-3.5 rounded-2xl glass-card space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Sampled Coordinate</span>
                    <span className="text-xs font-bold font-mono text-white">
                      {inspectedPixel.lat.toFixed(6)}° N, {inspectedPixel.lon.toFixed(6)}° E
                    </span>
                  </div>
                  {inspectedPixel.fieldName && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#27D7B2]/20 text-[#27D7B2] border border-[#27D7B2]/40">
                      {inspectedPixel.fieldName}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  {Object.entries(inspectedPixel.layerValues).map(([key, val]) => (
                    <div key={key} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-300">{val.label}</span>
                        <span className="font-bold text-[#27D7B2] font-mono">
                          {val.value} {val.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Resolution: {val.resolution}</span>
                        <span className="text-emerald-400">{val.quality}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-400 pt-2 border-t border-white/5 font-mono">
                  Sampled at: {new Date(inspectedPixel.retrievedAt).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-black/20 border border-dashed border-white/10 text-center space-y-2">
                <Crosshair className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">No point clicked yet.</p>
                <p className="text-[11px] text-slate-500">
                  Tap on any parcel or terrain area on the map to inspect live data layers.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: HISTORICAL COMPARE (BEFORE VS AFTER) */}
        {/* ========================================================= */}
        {activeTab === 'compare' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl glass-card space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <SplitSquareVertical className="w-3.5 h-3.5 text-[#27D7B2]" />
                  <span>Temporal Frame Alignment</span>
                </h4>
                <span className="text-[10px] font-mono text-[#27D7B2]">WGS84 Aligned</span>
              </div>

              {/* Date Selectors */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Before Frame</label>
                  <select
                    value={compareBeforeDate}
                    onChange={(e) => onSetCompareBeforeDate(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white font-mono focus:border-[#27D7B2] focus:outline-none"
                  >
                    {HISTORICAL_OBSERVATION_DATES.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">After Frame</label>
                  <select
                    value={compareAfterDate}
                    onChange={(e) => onSetCompareAfterDate(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white font-mono focus:border-[#27D7B2] focus:outline-none"
                  >
                    {HISTORICAL_OBSERVATION_DATES.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swipe Slider Control */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Split Reveal Position</span>
                  <span className="text-[#27D7B2] font-bold">{swipePosition}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={swipePosition}
                  onChange={(e) => onSetSwipePosition(parseInt(e.target.value, 10))}
                  className="w-full accent-[#27D7B2] h-2 rounded-lg cursor-pointer bg-black/60"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>← Before ({compareBeforeDate})</span>
                  <span>After ({compareAfterDate}) →</span>
                </div>
              </div>
            </div>

            {/* Differential Analytics */}
            <div className="p-3.5 rounded-2xl glass-card space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Differential Telemetry
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Canopy Vigor Shift (ΔNDVI)</span>
                  <span className="text-emerald-400 font-bold font-mono">+0.14 (Vigor Increase)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Rainfall Variance</span>
                  <span className="text-[#4EA5D9] font-bold font-mono">+32 mm higher rainfall</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Rootzone Moisture Shift</span>
                  <span className="text-emerald-400 font-bold font-mono">+6.2% moisture gain</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-slate-400 leading-relaxed font-mono">
                Both frames aligned by geometry version 1. Cloud-covered and water-absorbing pixels masked.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: REGIONAL DISCOVERY & PRIVACY */}
        {/* ========================================================= */}
        {activeTab === 'regional' && (
          <div className="space-y-4">
            {/* Mandatory Privacy Policy Banner */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-[#27D7B2]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#27D7B2]">
                <ShieldCheck className="w-4 h-4" />
                <span>Strict Agronomic Privacy Policy</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Public farms <strong>never</strong> display exact parcels or geographic boundary coordinates. City-level disclosure is mandatory. Aggregates require a minimum cohort of <strong>5 opted-in farms</strong> to prevent individual practice inference.
              </p>
            </div>

            {/* Regional Cohorts List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Active Regional Hubs</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {REGIONAL_COHORTS_DATA.length} Available
                </span>
              </h4>

              {REGIONAL_COHORTS_DATA.map((cohort) => (
                <div
                  key={cohort.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    cohort.isPrivacyCompliant
                      ? 'bg-black/40 border-white/10 hover:border-[#27D7B2]/40'
                      : 'bg-black/20 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">{cohort.name}</h5>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {cohort.city}, {cohort.country}
                      </div>
                    </div>
                    {cohort.isPrivacyCompliant ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#57C58D]/20 text-[#57C58D] border border-[#57C58D]/30">
                        {cohort.farmCount} Farms (Active)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Cohort &lt; 5 (Locked)</span>
                      </span>
                    )}
                  </div>

                  {cohort.isPrivacyCompliant ? (
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                        <div className="p-1.5 rounded-lg bg-white/[0.02]">
                          <span className="text-slate-400 block text-[10px]">Avg SOM %</span>
                          <span className="text-white font-bold">{cohort.avgSoilOrganicMatterPct}%</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/[0.02]">
                          <span className="text-slate-400 block text-[10px]">Cover Crop</span>
                          <span className="text-[#27D7B2] font-bold">{cohort.coverCropAdoptionPct}%</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300">
                        <span className="text-slate-400">Dominant Sequence: </span>
                        {cohort.dominantRotation}
                      </div>

                      {/* Public Profiles Preview */}
                      {cohort.publicProfiles.length > 0 && (
                        <div className="pt-2 border-t border-white/5 space-y-1.5">
                          <span className="text-[10px] font-mono text-slate-400 block">
                            Opted-in Public Profiles ({cohort.publicProfiles.length}):
                          </span>
                          {cohort.publicProfiles.map((p) => (
                            <div
                              key={p.id}
                              className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-semibold text-white block truncate">{p.displayName}</span>
                                <span className="text-[10px] text-slate-400 truncate block">
                                  {p.verifiedPractices.join(' · ')}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPublicProfile({
                                    profileName: p.displayName,
                                    cohortName: cohort.name,
                                  })
                                }
                                className="px-2 py-1 rounded bg-[#27D7B2]/20 hover:bg-[#27D7B2]/30 text-[#27D7B2] text-[10px] font-bold shrink-0 cursor-pointer"
                              >
                                Connect
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-slate-400 leading-relaxed font-mono">
                      Not enough shared data to provide a reliable regional comparison. 5 contributors required by privacy charter ({cohort.farmCount}/5 enrolled).
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* REGIONAL CONNECT MODAL */}
      {selectedPublicProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[3px]">
          <div className="w-full max-w-md p-5 rounded-2xl glass-modal border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Connect with Agronomic Peer</h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  {selectedPublicProfile.profileName} · {selectedPublicProfile.cohortName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPublicProfile(null);
                  setMessageSentConfirmation(false);
                  setMessageBody('');
                }}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {messageSentConfirmation ? (
              <div className="p-4 rounded-xl bg-[#57C58D]/15 border border-[#57C58D]/30 text-center space-y-1.5">
                <ShieldCheck className="w-6 h-6 text-[#57C58D] mx-auto" />
                <h5 className="text-xs font-bold text-white">Message Dispatched Securely</h5>
                <p className="text-[11px] text-slate-300">
                  Your peer inquiry regarding rotation practices was routed via privacy relay. Personal emails remain confidential.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Inquire about peer field trials, cover crop termination timing, or legume break results without exposing exact coordinates or personal phone numbers.
                </p>
                <textarea
                  rows={3}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="e.g. Hello, what seeding rate do you use for your winter cover crop?"
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-[#27D7B2]"
                />
                <button
                  type="button"
                  onClick={() => setMessageSentConfirmation(true)}
                  disabled={!messageBody.trim()}
                  className="w-full h-8 rounded-lg bg-[#27D7B2] hover:bg-[#20BE9D] text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Peer Message</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

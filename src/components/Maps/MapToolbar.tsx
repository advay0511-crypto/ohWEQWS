import React, { useState } from 'react';
import {
  Compass,
  Search,
  Eye,
  PenTool,
  Crosshair,
  Users,
  Maximize2,
  MapPin,
  HelpCircle,
  Upload,
  Download,
  SplitSquareVertical,
  Check,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SavedFarmPlan, FieldBoundaryItem, AppUnits } from '../../types';
import { MapMode } from './types';

interface MapToolbarProps {
  farms: SavedFarmPlan[];
  selectedFarm: SavedFarmPlan | undefined;
  selectedField: FieldBoundaryItem | undefined;
  mapMode: MapMode;
  onSetMapMode: (mode: MapMode) => void;
  onSelectFarm: (farmId: string) => void;
  onSelectField: (fieldId: string) => void;
  onFitSelection: () => void;
  onFitAll: () => void;
  onLocateMe: () => void;
  onSearchPlace: (query: string) => void;
  onStartDrawing: () => void;
  onStartEditing: () => void;
  onOpenCompare: () => void;
  onOpenImport: () => void;
  onExportGeoJson: () => void;
  onOpenHelp: () => void;
  units: AppUnits;
  onToggleUnits: () => void;
  hasUnsavedEdits: boolean;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  farms,
  selectedFarm,
  selectedField,
  mapMode,
  onSetMapMode,
  onSelectFarm,
  onSelectField,
  onFitSelection,
  onFitAll,
  onLocateMe,
  onSearchPlace,
  onStartDrawing,
  onStartEditing,
  onOpenCompare,
  onOpenImport,
  onExportGeoJson,
  onOpenHelp,
  units,
  onToggleUnits,
  hasUnsavedEdits,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsSearching(true);
    onSearchPlace(searchInput.trim());
    setTimeout(() => setIsSearching(false), 800);
  };

  const fields = selectedFarm?.fields || [];
  const hasBoundary = Boolean(selectedField?.polygon?.length || selectedFarm?.boundary);

  return (
    <div
      className="w-full h-14 px-3 sm:px-4 flex items-center justify-between gap-2 border-b border-white/10 shrink-0 z-30 transition-colors glass-nav"
    >
      {/* LEFT: Breadcrumb + Farm / Field Selectors */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-400 shrink-0">
          <Compass className="w-4 h-4 text-[#27D7B2]" />
          <span>Maps &amp; Fields</span>
          <span className="text-white/30">/</span>
        </div>

        {/* Farm Selector */}
        <div className="relative flex items-center">
          <select
            value={selectedFarm?.id || ''}
            onChange={(e) => onSelectFarm(e.target.value)}
            disabled={hasUnsavedEdits}
            className="h-8 pl-2.5 pr-7 rounded-lg bg-black/40 hover:bg-black/60 border border-white/15 text-xs font-semibold text-white focus:outline-none focus:border-[#27D7B2] cursor-pointer max-w-[140px] sm:max-w-[200px] truncate disabled:opacity-40"
            title={hasUnsavedEdits ? 'Save or cancel boundary edits before switching farm' : 'Select Farm'}
          >
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id} className="bg-slate-900 text-white">
                {farm.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>

        {/* Field Selector if farm has fields */}
        {fields.length > 0 && (
          <div className="relative flex items-center">
            <select
              value={selectedField?.id || ''}
              onChange={(e) => onSelectField(e.target.value)}
              disabled={hasUnsavedEdits}
              className="h-8 pl-2.5 pr-7 rounded-lg bg-black/40 hover:bg-black/60 border border-white/15 text-xs text-[#27D7B2] font-semibold focus:outline-none focus:border-[#27D7B2] cursor-pointer max-w-[130px] sm:max-w-[180px] truncate disabled:opacity-40"
              title={hasUnsavedEdits ? 'Save or cancel boundary edits before switching field' : 'Select Field'}
            >
              <option value="" className="bg-slate-900 text-slate-400">
                All Fields ({fields.length})
              </option>
              {fields.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                  {f.name} {f.areaHa ? `(${f.areaHa} ha)` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        )}

        {/* Geocoder Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search address or place…"
            className="h-8 w-44 lg:w-56 pl-8 pr-2.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27D7B2] focus:w-64 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          {isSearching && (
            <div className="w-3 h-3 rounded-full border-2 border-[#27D7B2] border-t-transparent animate-spin absolute right-2" />
          )}
        </form>
      </div>

      {/* CENTER: Workspace Modes (Explore, Edit Boundaries, Inspect Data, Regional Network) */}
      <div className="flex items-center bg-black/50 p-0.5 rounded-xl border border-white/15 shadow-inner">
        <button
          type="button"
          onClick={() => onSetMapMode('explore')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mapMode === 'explore'
              ? 'bg-[#27D7B2] text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="Explore: pan, zoom, view layers and field boundaries"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Explore</span>
        </button>

        <button
          type="button"
          onClick={() => onSetMapMode('edit')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mapMode === 'edit'
              ? 'bg-[#27D7B2] text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="Edit: draw field boundaries and modify vertices"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit Boundaries</span>
          {hasUnsavedEdits && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved edits" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSetMapMode('inspect')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mapMode === 'inspect'
              ? 'bg-[#27D7B2] text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="Inspect: click any pixel/point on map to inspect scientific values"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Inspect Data</span>
        </button>

        <button
          type="button"
          onClick={() => onSetMapMode('regional')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mapMode === 'regional'
              ? 'bg-[#27D7B2] text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
          title="Regional Discovery: privacy-safe city cohorts and peer benchmarks"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Regional</span>
        </button>
      </div>

      {/* RIGHT: Primary Action + Quick Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Primary Contextual Action */}
        {mapMode === 'edit' ? (
          <button
            type="button"
            onClick={onStartDrawing}
            className="h-8 px-3 rounded-lg bg-[#27D7B2] hover:bg-[#20BE9D] text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Start drawing a new boundary polygon"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Draw Boundary</span>
          </button>
        ) : hasBoundary ? (
          <button
            type="button"
            onClick={onStartEditing}
            className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Edit boundary coordinates and vertices"
          >
            <PenTool className="w-3.5 h-3.5 text-[#27D7B2]" />
            <span className="hidden md:inline">Edit Field</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartDrawing}
            className="h-8 px-3 rounded-lg bg-[#27D7B2] hover:bg-[#20BE9D] text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Draw initial field boundary"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw Boundary</span>
          </button>
        )}

        {/* Compare Dates Action */}
        <button
          type="button"
          onClick={onOpenCompare}
          className="h-8 px-2.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/15 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
          title="Historical Comparison (Before vs After)"
        >
          <SplitSquareVertical className="w-3.5 h-3.5 text-[#27D7B2]" />
          <span className="hidden xl:inline">Compare</span>
        </button>

        {/* View Frame Controls */}
        <div className="hidden sm:flex items-center bg-black/40 border border-white/15 rounded-lg p-0.5">
          <button
            type="button"
            onClick={onFitSelection}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            title="Fit to Selected Field"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onFitAll}
            className="px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-white hover:bg-white/10 rounded cursor-pointer"
            title="Fit All Fields in Farm"
          >
            Fit All
          </button>
          <button
            type="button"
            onClick={onLocateMe}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            title="Locate My GPS Position"
          >
            <MapPin className="w-3.5 h-3.5 text-[#27D7B2]" />
          </button>
        </div>

        {/* Area Units Toggle (ha / ac) */}
        <button
          type="button"
          onClick={onToggleUnits}
          className="h-8 px-2 rounded-lg bg-black/40 hover:bg-black/60 border border-white/15 text-[11px] font-mono font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Toggle Area Units (Metric Hectares vs Imperial Acres)"
        >
          {units === 'imperial' ? 'AC' : 'HA'}
        </button>

        {/* GeoJSON Import / Export */}
        <button
          type="button"
          onClick={onOpenImport}
          className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/15 text-slate-300 hover:text-white cursor-pointer hidden lg:flex"
          title="Import Boundary GeoJSON / KML"
        >
          <Upload className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onExportGeoJson}
          className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/15 text-slate-300 hover:text-white cursor-pointer hidden lg:flex"
          title="Export Boundary as WGS84 GeoJSON"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Help Modal Trigger */}
        <button
          type="button"
          onClick={onOpenHelp}
          className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/15 text-slate-400 hover:text-white cursor-pointer"
          title="Map Workspace Guidance & Geometry Rules"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

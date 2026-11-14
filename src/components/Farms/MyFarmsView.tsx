import React, { useState, useMemo } from 'react';
import {
  Plus,
  MapPin,
  Search,
  MoreVertical,
  Check,
  CheckCircle2,
  Trash2,
  Edit2,
  ExternalLink,
  Sprout,
  Layers,
  Clock,
  Compass,
  Copy,
  Download,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  X,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react';
import { SavedFarmPlan } from '../../types';
import { computeDailyStatusSnapshot } from '../../services/dailySnapshot';
import { generateFarmNasaAlerts } from '../../services/nasaAlerts';
import { getFarmRegionImage, getFarmRegionFallbackImage } from '../../services/cropImages';
import { Modal } from '../DesignSystem/Modal';

interface MyFarmsViewProps {
  farms: SavedFarmPlan[];
  activeFarmId: string;
  onSelectFarmDetail: (farmId: string, initialSection?: 'tracker' | 'fields' | 'rotations' | 'journal' | 'settings') => void;
  onAddNewFarm: () => void;
  onRenameFarm?: (farmId: string, newName: string) => void;
  onDeleteFarm?: (farmId: string) => void;
  onDuplicateFarm?: (farmId: string) => void;
  onOpenGuide?: () => void;
  onOpenCropRotation?: (farmId: string, cropName?: string | null) => void;
  isAdvanced?: boolean;
}

export const MyFarmsView: React.FC<MyFarmsViewProps> = ({
  farms,
  activeFarmId,
  onSelectFarmDetail,
  onAddNewFarm,
  onRenameFarm,
  onDeleteFarm,
  onDuplicateFarm,
  onOpenGuide,
  onOpenCropRotation,
  isAdvanced = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'good' | 'needs_attention' | 'alert' | 'unassessed'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'area' | 'status' | 'updated'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Menu and modal states
  const [activeMenuFarmId, setActiveMenuFarmId] = useState<string | null>(null);
  const [farmToDelete, setFarmToDelete] = useState<SavedFarmPlan | null>(null);
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Generate NASA alerts across all farms
  const allAlerts = useMemo(() => generateFarmNasaAlerts(farms), [farms]);

  // Compute snapshot summaries for all farms
  const farmSnapshots = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeDailyStatusSnapshot>>();
    farms.forEach((f) => {
      map.set(f.id, computeDailyStatusSnapshot(f));
    });
    return map;
  }, [farms]);

  // Summary strip metrics
  const totalAreaHa = useMemo(() => {
    const sum = farms.reduce((acc, f) => {
      if (f.fields && f.fields.length > 0) {
        return acc + f.fields.reduce((fAcc, fld) => fAcc + (fld.areaHa || 0), 0);
      }
      return acc + (f.farmAnswers?.fieldSizeHa || 0);
    }, 0);
    return Number(sum.toFixed(1));
  }, [farms]);

  const totalFieldsCount = useMemo(() => {
    return farms.reduce((acc, f) => {
      return acc + (f.fields?.length || 1);
    }, 0);
  }, [farms]);

  const activeAlertsCount = allAlerts.length;

  // Filter & Sort
  const filteredAndSortedFarms = useMemo(() => {
    let result = farms.filter((farm) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        farm.name.toLowerCase().includes(q) ||
        farm.locationName.toLowerCase().includes(q) ||
        (farm.farmAnswers?.soilTexture && farm.farmAnswers.soilTexture.toLowerCase().includes(q)) ||
        (farm.fields && farm.fields.some((fld) => fld.name.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      const snap = farmSnapshots.get(farm.id);
      if (statusFilter === 'all') return true;
      if (statusFilter === 'unassessed') return !farm.analysis;
      if (statusFilter === 'good') return snap?.overallStatus === 'good';
      if (statusFilter === 'needs_attention') return snap?.overallStatus === 'needs_attention';
      if (statusFilter === 'alert') return snap?.overallStatus === 'alert';
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      if (sortBy === 'area') {
        const areaA = a.farmAnswers?.fieldSizeHa || 0;
        const areaB = b.farmAnswers?.fieldSizeHa || 0;
        return sortOrder === 'asc' ? areaA - areaB : areaB - areaA;
      }
      if (sortBy === 'updated') {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (sortBy === 'status') {
        const snapA = farmSnapshots.get(a.id)?.overallStatus || 'unassessed';
        const snapB = farmSnapshots.get(b.id)?.overallStatus || 'unassessed';
        const cmp = snapA.localeCompare(snapB);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return 0;
    });

    return result;
  }, [farms, searchQuery, statusFilter, sortBy, sortOrder, farmSnapshots]);

  // Rename handlers
  const handleStartRename = (farm: SavedFarmPlan) => {
    setEditingFarmId(farm.id);
    setEditNameValue(farm.name);
    setActiveMenuFarmId(null);
  };

  const handleSaveRename = (farmId: string) => {
    if (editNameValue.trim() && onRenameFarm) {
      onRenameFarm(farmId, editNameValue.trim());
      showNotification(`Renamed to "${editNameValue.trim()}"`);
    }
    setEditingFarmId(null);
  };

  // Delete handlers
  const handleConfirmDelete = () => {
    if (farmToDelete && onDeleteFarm) {
      onDeleteFarm(farmToDelete.id);
      showNotification(`Deleted farm "${farmToDelete.name}"`);
      setFarmToDelete(null);
    }
  };

  // Duplicate handler
  const handleDuplicate = (farm: SavedFarmPlan) => {
    setActiveMenuFarmId(null);
    if (onDuplicateFarm) {
      onDuplicateFarm(farm.id);
      showNotification(`Duplicated "${farm.name}" as new draft.`);
    }
  };

  // Export Farm JSON
  const handleExportFarmJson = (farm: SavedFarmPlan) => {
    setActiveMenuFarmId(null);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(farm, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${farm.name.replace(/\s+/g, '_').toLowerCase()}_profile.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification(`Exported ${farm.name} JSON profile.`);
  };

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Not assessed';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 pb-20">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#102319] border border-[#83C58E] text-[#F1F6EF] text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#83C58E]" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. PAGE HEADER (Title, Subtitle, Add Farm CTA)                        */}
      {/* ===================================================================== */}
      <div className="max-w-[1480px] w-full mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[rgba(226,241,228,0.1)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#83C58E]">
              <span>PORTFOLIO WORKSPACE</span>
              <span aria-hidden="true">·</span>
              <span>PRIVATE FARMS &amp; FIELDS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#F1F6EF] tracking-tight">
              My Farms
            </h1>
            <p className="text-xs sm:text-sm text-[#C0CEC2]">
              Manage farms and fields, review their condition indicators, and open detailed agronomic records.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onAddNewFarm}
              className="px-4 py-2.5 rounded-[10px] bg-[#83C58E] hover:bg-[#97D4A2] text-[#07130C] font-semibold text-xs sm:text-sm transition-all shadow-[0_2px_12px_rgba(131,197,142,0.25)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add farm</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. COMPACT PORTFOLIO SUMMARY STRIP (Clean label/value pairs)          */}
      {/* ===================================================================== */}
      {farms.length > 0 && (
        <div className="max-w-[1480px] w-full mx-auto px-4 sm:px-6 lg:px-10">
          <div className="p-4 rounded-xl bg-[rgba(16,35,25,0.7)] border border-[rgba(226,241,228,0.1)] grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(226,241,228,0.08)]">
            {/* Metric 1: Total Mapped Area */}
            <div className="flex flex-col justify-center px-2 pt-2 sm:pt-0">
              <span className="text-[11px] font-mono text-[#9BA99C] uppercase tracking-wider">
                Total Managed Area
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#F1F6EF] mt-0.5">
                {totalAreaHa} <span className="text-xs font-sans text-[#9BA99C]">ha</span>
              </div>
              <span className="text-[10px] text-[#9BA99C] font-mono">
                {(totalAreaHa * 2.471).toFixed(1)} acres surveyed
              </span>
            </div>

            {/* Metric 2: Active Farms */}
            <div className="flex flex-col justify-center px-2 pt-2 sm:pt-0">
              <span className="text-[11px] font-mono text-[#9BA99C] uppercase tracking-wider">
                Active Farms
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#F1F6EF] mt-0.5">
                {farms.length}
              </div>
              <span className="text-[10px] text-[#83C58E] font-medium">
                Local-first storage
              </span>
            </div>

            {/* Metric 3: Fields Tracked */}
            <div className="flex flex-col justify-center px-2 pt-2 sm:pt-0">
              <span className="text-[11px] font-mono text-[#9BA99C] uppercase tracking-wider">
                Fields Tracked
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#73CAD0] mt-0.5">
                {totalFieldsCount}
              </div>
              <span className="text-[10px] text-[#9BA99C]">
                Spatial management units
              </span>
            </div>

            {/* Metric 4: Active Alerts */}
            <div className="flex flex-col justify-center px-2 pt-2 sm:pt-0">
              <span className="text-[11px] font-mono text-[#9BA99C] uppercase tracking-wider">
                Active Alerts
              </span>
              <div className={`text-xl sm:text-2xl font-bold font-mono mt-0.5 ${
                activeAlertsCount > 0 ? 'text-[#E6B86A]' : 'text-[#83C58E]'
              }`}>
                {activeAlertsCount}
              </div>
              <span className="text-[10px] text-[#9BA99C]">
                {activeAlertsCount > 0 ? 'Review needed in farm tracker' : 'All parameters nominal'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. TOOLBAR: Search, Status Filter, Sort, View Switch                   */}
      {/* ===================================================================== */}
      {farms.length > 0 && (
        <div className="max-w-[1480px] w-full mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search farm name, region, or crop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-[10px] bg-[rgba(7,20,12,0.85)] border border-[rgba(226,241,228,0.14)] text-xs sm:text-sm text-[#F1F6EF] placeholder-[#9BA99C] focus:outline-none focus:border-[#83C58E]"
              />
              <Search className="w-4 h-4 text-[#9BA99C] absolute left-3 top-3" />
            </div>

            {/* Controls Row: Status filter, Sort, and View mode switch */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[#9BA99C] text-[11px] hidden md:inline">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-10 px-3 rounded-[10px] bg-[rgba(7,20,12,0.85)] border border-[rgba(226,241,228,0.14)] text-xs font-medium text-[#F1F6EF] focus:outline-none focus:border-[#83C58E] cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="good">Healthy</option>
                  <option value="needs_attention">Notice</option>
                  <option value="alert">Needs Attention</option>
                  <option value="unassessed">Not Assessed</option>
                </select>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[#9BA99C] text-[11px] hidden md:inline">Sort:</span>
                <select
                  value={`${sortBy}_${sortOrder}`}
                  onChange={(e) => {
                    const [f, o] = e.target.value.split('_');
                    setSortBy(f as any);
                    setSortOrder(o as any);
                  }}
                  className="h-10 px-3 rounded-[10px] bg-[rgba(7,20,12,0.85)] border border-[rgba(226,241,228,0.14)] text-xs font-medium text-[#F1F6EF] focus:outline-none focus:border-[#83C58E] cursor-pointer"
                >
                  <option value="updated_desc">Recently Updated</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="area_desc">Area (Largest)</option>
                  <option value="area_asc">Area (Smallest)</option>
                  <option value="status_asc">Status</option>
                </select>
              </div>

              {/* View Toggle (Table vs Cards) */}
              <div className="flex items-center p-0.5 rounded-[10px] bg-[rgba(7,20,12,0.85)] border border-[rgba(226,241,228,0.14)]">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#183324] text-[#83C58E]'
                      : 'text-[#9BA99C] hover:text-[#F1F6EF]'
                  }`}
                  title="Table view"
                  aria-label="Table view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-[#183324] text-[#83C58E]'
                      : 'text-[#9BA99C] hover:text-[#F1F6EF]'
                  }`}
                  title="Cards view"
                  aria-label="Cards view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              {/* Clear filters shortcut */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-[#83C58E] hover:underline cursor-pointer px-1.5"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. MAIN CONTENT: TABLE OR CARDS VIEW                                  */}
      {/* ===================================================================== */}
      <div className="max-w-[1480px] w-full mx-auto px-4 sm:px-6 lg:px-10">
        {/* Empty state: No farms exist at all */}
        {farms.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[rgba(16,35,25,0.7)] border border-[rgba(226,241,228,0.1)] text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-[#07130C] border border-[rgba(226,241,228,0.12)] flex items-center justify-center text-[#83C58E] mx-auto">
              <Sprout className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-[#F1F6EF]">No Farms in Workspace</h3>
              <p className="text-xs text-[#C0CEC2] leading-relaxed">
                Add your first agricultural parcel to begin tracking soil moisture, climate history, and rotation blueprints.
              </p>
            </div>
            <button
              type="button"
              onClick={onAddNewFarm}
              className="px-5 py-2.5 rounded-[10px] bg-[#83C58E] hover:bg-[#97D4A2] text-[#07130C] font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add your first farm</span>
            </button>
          </div>
        ) : filteredAndSortedFarms.length === 0 ? (
          /* Empty state: Search/Filter produced 0 matches */
          <div className="p-8 rounded-2xl bg-[rgba(16,35,25,0.5)] border border-[rgba(226,241,228,0.1)] text-center space-y-3">
            <p className="text-sm text-[#F1F6EF]">No farms matched your search filters.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-[10px] bg-[rgba(16,35,25,0.8)] border border-[rgba(226,241,228,0.14)] text-xs text-[#83C58E] font-medium cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* ================================================================= */
          /* TABLE VIEW (56-64px row height, tabular numerals, clean dividers) */
          /* ================================================================= */
          <div className="w-full rounded-2xl bg-[rgba(16,35,25,0.7)] border border-[rgba(226,241,228,0.1)] overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(226,241,228,0.08)] bg-[rgba(7,20,12,0.6)] text-[11px] font-mono uppercase tracking-wider text-[#9BA99C]">
                    <th className="py-3.5 pl-6 pr-4 font-semibold">Farm / Location</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Mapped Area</th>
                    <th className="py-3.5 px-4 font-semibold">Fields</th>
                    <th className="py-3.5 px-4 font-semibold">Current Plan</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold">Last Assessed</th>
                    <th className="py-3.5 pl-4 pr-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(226,241,228,0.06)] text-xs">
                  {filteredAndSortedFarms.map((farm) => {
                    const snap = farmSnapshots.get(farm.id);
                    const isSelected = farm.id === activeFarmId;
                    const isMenuOpen = activeMenuFarmId === farm.id;
                    const thumb = getFarmRegionImage(farm.locationName, farm.name, farm.farmAnswers?.lat, farm.farmAnswers?.lon);
                    const areaHa = farm.farmAnswers?.fieldSizeHa || 32.5;

                    return (
                      <tr
                        key={farm.id}
                        onClick={() => onSelectFarmDetail(farm.id, 'tracker')}
                        className={`transition-colors cursor-pointer min-h-[58px] ${
                          isSelected
                            ? 'bg-[rgba(131,197,142,0.08)]'
                            : 'hover:bg-[rgba(255,255,255,0.03)]'
                        }`}
                      >
                        {/* 1. Farm / Location */}
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/30">
                              <img
                                src={thumb}
                                alt={farm.name}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = getFarmRegionFallbackImage(farm.locationName, farm.name);
                                }}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              {editingFarmId === farm.id ? (
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={editNameValue}
                                    onChange={(e) => setEditNameValue(e.target.value)}
                                    className="h-7 px-2 text-xs rounded bg-[#07130C] border border-[#83C58E] text-[#F1F6EF]"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRename(farm.id);
                                      if (e.key === 'Escape') setEditingFarmId(null);
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveRename(farm.id)}
                                    className="p-1 rounded text-[#83C58E] hover:bg-[#83C58E]/20"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-[#F1F6EF] truncate">
                                    {farm.name}
                                  </span>
                                  {farm.isDemo && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-[#83C58E]/20 text-[#83C58E] border border-[#83C58E]/40">
                                      Demo
                                    </span>
                                  )}
                                  {isSelected && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium text-[#73CAD0] bg-[#73CAD0]/15">
                                      Active
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="text-[11px] text-[#9BA99C] flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-[#9BA99C] shrink-0" />
                                <span className="truncate">{farm.locationName}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Mapped Area */}
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                          <span className="font-semibold text-[#F1F6EF]">{areaHa}</span>{' '}
                          <span className="text-[11px] text-[#9BA99C]">ha</span>
                        </td>

                        {/* 3. Fields count */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="text-[#C0CEC2]">
                            {farm.fields?.length || 1} {farm.fields && farm.fields.length > 1 ? 'fields' : 'field'}
                          </span>
                        </td>

                        {/* 4. Current Plan */}
                        <td className="py-3.5 px-4">
                          <div className="truncate max-w-[200px]" title={snap?.rotationShortView || 'No plan'}>
                            <span className="text-[#F1F6EF] font-medium">
                              {snap?.currentCrop?.name || 'Wheat'}
                            </span>
                            <span className="text-[11px] text-[#9BA99C] ml-1.5">
                              ({snap?.currentCrop?.stageLabel || 'Season 1 of 4'})
                            </span>
                          </div>
                        </td>

                        {/* 5. Status Badge */}
                        <td className="py-3.5 px-4">
                          {snap?.overallStatus === 'alert' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E97971]/15 text-[#E97971] border border-[#E97971]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E97971]" />
                              <span>Needs Attention</span>
                            </span>
                          ) : snap?.overallStatus === 'needs_attention' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E6B86A]/15 text-[#E6B86A] border border-[#E6B86A]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E6B86A]" />
                              <span>Notice</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#83C58E]/15 text-[#83C58E] border border-[#83C58E]/30">
                              <Check className="w-3 h-3 text-[#83C58E]" />
                              <span>Healthy</span>
                            </span>
                          )}
                        </td>

                        {/* 6. Last Assessment */}
                        <td className="py-3.5 px-4 text-[#9BA99C] font-mono text-[11px]">
                          {formatTimeAgo(farm.analysis?.createdAt || farm.updatedAt)}
                        </td>

                        {/* 7. Row Actions */}
                        <td className="py-3.5 pl-4 pr-6 text-right relative" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onSelectFarmDetail(farm.id, 'tracker')}
                              className="px-2.5 py-1 text-xs font-semibold text-[#83C58E] hover:text-[#97D4A2] hover:bg-[#83C58E]/10 rounded-md transition-colors cursor-pointer"
                            >
                              Open
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveMenuFarmId(isMenuOpen ? null : farm.id)}
                              className="p-1.5 rounded-md text-[#9BA99C] hover:text-[#F1F6EF] hover:bg-white/10 transition-colors cursor-pointer"
                              aria-label="More farm actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Context Menu Dropdown */}
                          {isMenuOpen && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveMenuFarmId(null)} />
                              <div
                                className="absolute right-6 top-10 z-40 w-48 rounded-xl bg-[#07130C] border border-[rgba(226,241,228,0.16)] shadow-2xl py-1 text-left text-xs font-medium text-[#C0CEC2]"
                                onMouseLeave={() => setActiveMenuFarmId(null)}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuFarmId(null);
                                    onSelectFarmDetail(farm.id, 'tracker');
                                  }}
                                  className="w-full px-3 py-2 hover:bg-[#183324] hover:text-[#83C58E] flex items-center gap-2 cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>View Farm Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuFarmId(null);
                                    if (onOpenCropRotation) {
                                      onOpenCropRotation(farm.id, null);
                                    } else {
                                      onSelectFarmDetail(farm.id, 'rotations');
                                    }
                                  }}
                                  className="w-full px-3 py-2 hover:bg-[#183324] hover:text-[#83C58E] flex items-center gap-2 cursor-pointer"
                                >
                                  <Sprout className="w-3.5 h-3.5 text-[#83C58E]" />
                                  <span>Crop Rotations</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuFarmId(null);
                                    onSelectFarmDetail(farm.id, 'fields');
                                  }}
                                  className="w-full px-3 py-2 hover:bg-[#183324] hover:text-[#83C58E] flex items-center gap-2 cursor-pointer"
                                >
                                  <Compass className="w-3.5 h-3.5 text-[#73CAD0]" />
                                  <span>Fields &amp; Map</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStartRename(farm)}
                                  className="w-full px-3 py-2 hover:bg-[#183324] hover:text-[#F1F6EF] flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Rename Farm</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDuplicate(farm)}
                                  className="w-full px-3 py-2 hover:bg-[#183324] hover:text-[#F1F6EF] flex items-center gap-2 cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Duplicate Setup</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleExportFarmJson(farm)}
                                  className="w-full px-3 py-2 hover:bg-[#183324] hover:text-[#F1F6EF] flex items-center gap-2 cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Export Farm JSON</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuFarmId(null);
                                    setFarmToDelete(farm);
                                  }}
                                  className="w-full px-3 py-2 text-[#E97971] hover:bg-[#E97971]/15 flex items-center gap-2 cursor-pointer border-t border-[rgba(226,241,228,0.08)]"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Farm</span>
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* CARDS VIEW (Responsive grid of compact portfolio cards)           */
          /* ================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSortedFarms.map((farm) => {
              const snap = farmSnapshots.get(farm.id);
              const thumb = getFarmRegionImage(farm.locationName, farm.name, farm.farmAnswers?.lat, farm.farmAnswers?.lon);
              const areaHa = farm.farmAnswers?.fieldSizeHa || 32.5;
              const isSelected = farm.id === activeFarmId;

              return (
                <div
                  key={farm.id}
                  onClick={() => onSelectFarmDetail(farm.id, 'tracker')}
                  className={`p-5 rounded-2xl bg-[rgba(16,35,25,0.7)] hover:bg-[rgba(16,35,25,0.95)] border transition-all cursor-pointer space-y-4 shadow-md ${
                    isSelected
                      ? 'border-[#83C58E]/60 ring-1 ring-[#83C58E]/40'
                      : 'border-[rgba(226,241,228,0.1)] hover:border-[rgba(131,197,142,0.3)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black/30">
                      <img
                        src={thumb}
                        alt={farm.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getFarmRegionFallbackImage(farm.locationName, farm.name);
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-[#F1F6EF] truncate text-sm">
                          {farm.name}
                        </h3>
                        {farm.isDemo && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-[#83C58E]/20 text-[#83C58E]">
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#9BA99C] flex items-center gap-1 truncate mt-0.5">
                        <MapPin className="w-3 h-3 text-[#9BA99C] shrink-0" />
                        <span className="truncate">{farm.locationName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[rgba(226,241,228,0.08)] font-mono">
                    <div>
                      <span className="text-[#9BA99C] block text-[10px]">Area:</span>
                      <span className="text-[#F1F6EF] font-semibold">{areaHa} ha</span>
                    </div>
                    <div>
                      <span className="text-[#9BA99C] block text-[10px]">Active Crop:</span>
                      <span className="text-[#83C58E] font-medium truncate block">
                        {snap?.currentCrop?.name || 'Wheat'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      snap?.overallStatus === 'alert'
                        ? 'bg-[#E97971]/15 text-[#E97971]'
                        : snap?.overallStatus === 'needs_attention'
                        ? 'bg-[#E6B86A]/15 text-[#E6B86A]'
                        : 'bg-[#83C58E]/15 text-[#83C58E]'
                    }`}>
                      {snap?.overallStatus === 'alert'
                        ? 'Needs Attention'
                        : snap?.overallStatus === 'needs_attention'
                        ? 'Notice'
                        : 'Healthy'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFarmDetail(farm.id, 'tracker');
                      }}
                      className="text-xs font-semibold text-[#83C58E] hover:underline cursor-pointer"
                    >
                      Open overview →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 5. DELETE FARM CONFIRMATION MODAL                                     */}
      {/* ===================================================================== */}
      {farmToDelete && (
        <Modal
          isOpen={Boolean(farmToDelete)}
          onClose={() => setFarmToDelete(null)}
          title="Delete Farm Record"
          subtitle={`Permanently remove ${farmToDelete.name} from local storage?`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#E97971]/10 border border-[#E97971]/30 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[#E97971] shrink-0 mt-0.5" />
              <div className="text-xs text-[#F1F6EF] leading-relaxed">
                Deleting <strong>{farmToDelete.name}</strong> will remove all field polygon boundaries, crop rotation plans, and local environmental observations associated with this farm.
                <p className="mt-1 text-[#C0CEC2]">
                  Because Field Shift uses local-first storage, this action permanently clears this farm from your browser.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setFarmToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[#F1F6EF] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-[#E97971] hover:bg-[#d8635b] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#E97971]/25"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Farm</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

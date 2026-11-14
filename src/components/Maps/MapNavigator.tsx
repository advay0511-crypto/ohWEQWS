import React, { useState } from 'react';
import {
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Sprout,
  MapPin,
  Layers,
  Upload,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Minimize2,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { SavedFarmPlan, FieldBoundaryItem, AppUnits } from '../../types';
import { formatArea } from '../../engine/geodesic';

interface MapNavigatorProps {
  farms: SavedFarmPlan[];
  selectedFarmId: string;
  selectedFieldId: string | null;
  onSelectFarm: (farmId: string) => void;
  onSelectField: (fieldId: string) => void;
  onAddField: (farmId: string) => void;
  onOpenImport: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  units: AppUnits;
  hasUnsavedEdits: boolean;
  onAttemptSwitchWithEdits: (nextAction: () => void) => void;
}

export const MapNavigator: React.FC<MapNavigatorProps> = ({
  farms,
  selectedFarmId,
  selectedFieldId,
  onSelectFarm,
  onSelectField,
  onAddField,
  onOpenImport,
  isCollapsed,
  onToggleCollapse,
  units,
  hasUnsavedEdits,
  onAttemptSwitchWithEdits,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedFarms, setExpandedFarms] = useState<Record<string, boolean>>({
    [selectedFarmId]: true,
  });

  const toggleFarmAccordion = (farmId: string) => {
    setExpandedFarms((prev) => ({
      ...prev,
      [farmId]: !prev[farmId],
    }));
  };

  const handleFarmClick = (farmId: string) => {
    if (hasUnsavedEdits) {
      onAttemptSwitchWithEdits(() => {
        onSelectFarm(farmId);
        setExpandedFarms((prev) => ({ ...prev, [farmId]: true }));
      });
      return;
    }
    onSelectFarm(farmId);
    setExpandedFarms((prev) => ({ ...prev, [farmId]: true }));
  };

  const handleFieldClick = (farmId: string, fieldId: string) => {
    if (hasUnsavedEdits) {
      onAttemptSwitchWithEdits(() => {
        if (farmId !== selectedFarmId) onSelectFarm(farmId);
        onSelectField(fieldId);
      });
      return;
    }
    if (farmId !== selectedFarmId) onSelectFarm(farmId);
    onSelectField(fieldId);
  };

  // Filtered farms and fields
  const filteredFarms = farms.filter((f) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const farmMatch = f.name.toLowerCase().includes(q) || (f.locationName && f.locationName.toLowerCase().includes(q));
    const fieldMatch = (f.fields || []).some((field) => field.name.toLowerCase().includes(q));
    return farmMatch || fieldMatch;
  });

  if (isCollapsed) {
    return (
      <div className="absolute top-16 left-3 z-20">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2.5 rounded-xl bg-[#061720]/90 hover:bg-[#092230] border border-white/15 text-slate-300 hover:text-white shadow-2xl backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5"
          title="Open Farms & Fields Navigator"
        >
          <PanelLeftOpen className="w-4 h-4 text-[#27D7B2]" />
          <span className="text-xs font-semibold hidden md:inline">Navigator</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-72 sm:w-80 h-full flex flex-col border-r border-white/10 shrink-0 z-20 transition-all select-none glass-card rounded-none border-y-0 border-l-0"
    >
      {/* HEADER: Title & Collapse Button */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#27D7B2]/20 border border-[#27D7B2]/30 flex items-center justify-center text-[#27D7B2]">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">Farms &amp; Fields</h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {farms.length} {farms.length === 1 ? 'Farm' : 'Farms'} Registered
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Collapse Navigator Rail"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* SEARCH INPUT */}
      <div className="p-3 border-b border-white/10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter farms or fields…"
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27D7B2] transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
        </div>
      </div>

      {/* FARMS & FIELDS TREE LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
        {filteredFarms.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No farms found matching &ldquo;{filterQuery}&rdquo;.
          </div>
        ) : (
          filteredFarms.map((farm) => {
            const isFarmSelected = farm.id === selectedFarmId;
            const isExpanded = expandedFarms[farm.id] ?? true;
            const farmFields = farm.fields || [];

            // Calculate total farm area
            const totalAreaHa = farmFields.reduce((sum, f) => sum + (f.areaHa || 0), 0);
            const formattedTotalArea = formatArea(totalAreaHa * 10000, units === 'imperial' ? 'imperial' : 'metric');

            return (
              <div
                key={farm.id}
                className={`rounded-xl border transition-all ${
                  isFarmSelected
                    ? 'bg-white/[0.04] border-[#27D7B2]/40 shadow-sm'
                    : 'bg-black/20 border-white/5 hover:border-white/15'
                }`}
              >
                {/* FARM HEADER ROW */}
                <div
                  className="p-2.5 flex items-center justify-between cursor-pointer group"
                  onClick={() => handleFarmClick(farm.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFarmAccordion(farm.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-[#27D7B2] transition-colors truncate">
                        {farm.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <span>{farm.locationName || 'Field Parcel'}</span>
                        <span>·</span>
                        <span className="text-[#27D7B2]">{formattedTotalArea.formatted}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10 shrink-0">
                    {farmFields.length} {farmFields.length === 1 ? 'field' : 'fields'}
                  </span>
                </div>

                {/* CHILD FIELDS */}
                {isExpanded && (
                  <div className="pl-4 pr-1.5 pb-2 pt-0.5 space-y-1">
                    {farmFields.length === 0 ? (
                      <div className="p-2.5 rounded-lg bg-black/30 border border-dashed border-white/10 text-center">
                        <p className="text-[11px] text-slate-400">No boundaries mapped yet.</p>
                        <button
                          type="button"
                          onClick={() => onAddField(farm.id)}
                          className="mt-1.5 px-2 py-1 rounded bg-[#27D7B2]/20 hover:bg-[#27D7B2]/30 text-[#27D7B2] text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Draw Parcel</span>
                        </button>
                      </div>
                    ) : (
                      farmFields.map((field) => {
                        const isFieldSelected = isFarmSelected && field.id === selectedFieldId;
                        const formattedFieldArea = formatArea(
                          (field.areaHa || 10) * 10000,
                          units === 'imperial' ? 'imperial' : 'metric'
                        );

                        // Status pill color
                        const statusColor =
                          field.status === 'alert'
                            ? 'bg-[#EC7771]'
                            : field.status === 'needs_attention'
                            ? 'bg-[#E8B75D]'
                            : 'bg-[#57C58D]';

                        return (
                          <div
                            key={field.id}
                            onClick={() => handleFieldClick(farm.id, field.id)}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                              isFieldSelected
                                ? 'bg-[#27D7B2]/15 border-[#27D7B2] text-white shadow-sm'
                                : 'bg-black/20 border-white/5 hover:border-white/15 text-slate-300 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full ${statusColor} shrink-0`} />
                              <div className="min-w-0">
                                <div className="font-semibold text-xs truncate">{field.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                                  <span>{formattedFieldArea.formatted}</span>
                                  <span>·</span>
                                  <span className="text-slate-300 truncate">
                                    {typeof field.currentCrop === 'object'
                                      ? field.currentCrop?.name
                                      : field.currentCrop || 'Active Rotation'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <ChevronRight
                              className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                                isFieldSelected ? 'text-[#27D7B2] translate-x-0.5' : 'text-slate-500'
                              }`}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER ACTIONS: Add Field & Import */}
      <div className="p-3 border-t border-white/10 bg-black/40 space-y-2">
        <button
          type="button"
          onClick={() => onAddField(selectedFarmId)}
          className="w-full h-8 rounded-lg bg-[#27D7B2] hover:bg-[#20BE9D] text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Field Boundary</span>
        </button>

        <button
          type="button"
          onClick={onOpenImport}
          className="w-full h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Upload className="w-3 h-3 text-[#27D7B2]" />
          <span>Import GeoJSON / KML</span>
        </button>
      </div>
    </div>
  );
};

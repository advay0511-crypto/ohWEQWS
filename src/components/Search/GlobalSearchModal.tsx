import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Compass,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  Sprout,
  ArrowRight,
  Database,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { SavedFarmPlan, NasaAlert } from '../../types';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  farms: SavedFarmPlan[];
  activeFarmId: string;
  alerts?: NasaAlert[];
  onNavigate: (tab: string, farmId?: string, section?: string, cropFilter?: string) => void;
  retainRecentSearches?: boolean;
}

export interface SearchResultItem {
  id: string;
  type: 'farm' | 'field' | 'crop' | 'rotation' | 'report' | 'alert' | 'task' | 'evidence';
  title: string;
  subtitle: string;
  badge: string;
  farmId?: string;
  farmName?: string;
  fieldId?: string;
  tab: string;
  section?: string;
  cropFilter?: string;
}

const STORAGE_KEY_RECENT_SEARCHES = 'fieldshift_recent_searches_v1';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  farms,
  activeFarmId,
  alerts = [],
  onNavigate,
  retainRecentSearches = true,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENT_SEARCHES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Index all searchable entities
  const searchIndex = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];

    // 1. Authorized Farms
    farms.forEach((f) => {
      items.push({
        id: `farm_${f.id}`,
        type: 'farm',
        title: f.name,
        subtitle: `${f.locationName || 'Unspecified location'} • ${f.fields?.length || 1} fields • ${f.farmAnswers?.soilTexture?.replace('_', ' ') || 'loam'} soil`,
        badge: 'Farm',
        farmId: f.id,
        farmName: f.name,
        tab: 'farms',
        section: 'tracker',
      });

      // 2. Fields
      if (f.fields) {
        f.fields.forEach((fld) => {
          items.push({
            id: `field_${f.id}_${fld.id}`,
            type: 'field',
            title: fld.name,
            subtitle: `${f.name} • ${fld.areaHa ? `${fld.areaHa.toFixed(1)} ha` : ''} • Current: ${fld.crop || 'Fallow'}`,
            badge: 'Field',
            farmId: f.id,
            farmName: f.name,
            fieldId: fld.id,
            tab: 'farms',
            section: 'fields',
          });
        });
      }

      // 3. Rotation Plans
      if (f.analysis?.rotations) {
        f.analysis.rotations.forEach((r, idx) => {
          const cropsList = r.sequence?.map((s) => s.cropName).join(' → ') || 'Multi-crop cycle';
          items.push({
            id: `rot_${f.id}_${r.id || idx}`,
            type: 'rotation',
            title: r.name,
            subtitle: `${f.name} • ${cropsList} • Score: ${r.totalScore || 90}/100`,
            badge: 'Rotation Plan',
            farmId: f.id,
            farmName: f.name,
            tab: 'rotations',
          });
        });
      }

      // 4. Reports & Deep Analysis
      if (f.analysis) {
        items.push({
          id: `report_${f.id}`,
          type: 'report',
          title: `Analysis Report: ${f.name}`,
          subtitle: `Created ${new Date(f.analysis.createdAt).toLocaleDateString()} • Hash: ${f.analysis.inputHash.slice(0, 8)}`,
          badge: 'Report',
          farmId: f.id,
          farmName: f.name,
          tab: 'analysis',
        });
      }

      // 4B. Exportable Field Brief (Print & PDF)
      items.push({
        id: `brief_${f.id}`,
        type: 'report',
        title: `Field Brief: ${f.name} (Print & PDF Output)`,
        subtitle: `Agronomic field briefing, clipboard checklist, multi-field boundary map, and PDF export for ${f.name}`,
        badge: 'Field Brief (PDF)',
        farmId: f.id,
        farmName: f.name,
        tab: 'brief',
      });

      // 5. Journal & Decision Logs
      if (f.farmerLogs) {
        f.farmerLogs.forEach((log) => {
          items.push({
            id: `log_${f.id}_${log.id}`,
            type: 'task',
            title: log.title,
            subtitle: `${f.name} • ${log.date} • Category: ${log.category}`,
            badge: 'Scouting Log',
            farmId: f.id,
            farmName: f.name,
            tab: 'farms',
            section: 'journal',
          });
        });
      }
    });

    // 6. Crops in Database
    const crops = [
      { name: 'Hard Red Winter Wheat', family: 'Poaceae (Grass / Cereal)', desc: 'High drought tolerance, fibrous root system, excellent erosion buffer.' },
      { name: 'Field Pea / Chickpea', family: 'Fabaceae (Legume / Pulse)', desc: 'Biological nitrogen fixation, breaks cereal pathogen cycles.' },
      { name: 'Grain Sorghum / Milo', family: 'Poaceae (Summer Grain)', desc: 'Deep taproot extraction, extreme heat resilience, C4 photosynthetic efficiency.' },
      { name: 'Sunflowers', family: 'Asteraceae (Oilseed)', desc: 'Subsoil water scavenging, breaks soil compaction, pollinator attraction.' },
      { name: 'Soybean', family: 'Fabaceae (Legume)', desc: 'High protein cash crop, moderate water demand, residue mineralization.' },
      { name: 'Barley', family: 'Poaceae (Cool-season cereal)', desc: 'Short growing window, high salinity tolerance, low water demand.' },
    ];
    crops.forEach((c) => {
      items.push({
        id: `crop_${c.name.toLowerCase().replace(/\s+/g, '_')}`,
        type: 'crop',
        title: c.name,
        subtitle: `${c.family} — ${c.desc}`,
        badge: 'Crop Knowledge Base',
        tab: 'rotations',
        cropFilter: c.name,
      });
    });

    // 7. Active Alerts
    alerts.forEach((a) => {
      items.push({
        id: `alert_${a.id}`,
        type: 'alert',
        title: a.title,
        subtitle: `${a.farmName} • ${a.shortAlert} • ${a.severity.toUpperCase()}`,
        badge: 'Alert',
        farmId: a.farmId,
        farmName: a.farmName,
        tab: 'farms',
      });
    });

    // 8. Scientific Evidence Datasets
    const evidenceItems = [
      {
        title: 'NASA POWER Climatology (0.5° Grid)',
        subtitle: '10-Year historical solar irradiance, cumulative GDD, and precipitation anomaly baselines',
        badge: 'Evidence',
        tab: 'data',
      },
      {
        title: 'FAO-56 Dual Crop Evapotranspiration (ET0)',
        subtitle: 'Penman-Monteith physical water balance modeling against seasonal root depth',
        badge: 'Evidence',
        tab: 'data',
      },
      {
        title: 'NASA SMAP L4 Surface & Root-Zone Moisture',
        subtitle: 'Top 5cm microwave radiometer observation coupled with catchment hydrology',
        badge: 'Evidence',
        tab: 'data',
      },
      {
        title: 'Baskerville-Emin Thermal Degree Days',
        subtitle: 'Sine wave interpolation between diurnal daily min and max temperatures',
        badge: 'Evidence',
        tab: 'data',
      },
    ];
    evidenceItems.forEach((ev, idx) => {
      items.push({
        id: `evidence_${idx}`,
        type: 'evidence',
        title: ev.title,
        subtitle: ev.subtitle,
        badge: ev.badge,
        tab: ev.tab,
      });
    });

    return items;
  }, [farms, alerts]);

  // Filtered Results
  const filteredResults = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
      );
    }).slice(0, 12);
  }, [query, searchIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    // Record recent search if enabled
    if (retainRecentSearches && query.trim()) {
      const updated = [query.trim(), ...recentSearches.filter((s) => s !== query.trim())].slice(0, 5);
      setRecentSearches(updated);
      try {
        localStorage.setItem(STORAGE_KEY_RECENT_SEARCHES, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    onClose();
    onNavigate(item.tab, item.farmId, item.section, item.cropFilter);
  };

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY_RECENT_SEARCHES);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl glass-modal border border-white/20 shadow-2xl overflow-hidden flex flex-col text-[#F1F6EF]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-white/10 bg-white/[0.03]">
          <Search className="w-5 h-5 text-[#27D7B2] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search farms, fields, crops, rotation plans, reports, tasks, or evidence..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 rounded">
              ESC to close
            </kbd>
          )}
        </div>

        {/* Results / Empty Viewport */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {query.trim() === '' ? (
            <div className="p-4 space-y-4">
              {/* Recent Searches */}
              {retainRecentSearches && recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#27D7B2]" />
                      <span>Recent Searches</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear history
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((rec, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setQuery(rec)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 transition-colors cursor-pointer"
                      >
                        {rec}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Searchable Scope Breakdown */}
              <div className="space-y-2 pt-1 border-t border-white/5">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Searchable in Field Shift
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                    <Sprout className="w-4 h-4 text-[#27D7B2]" />
                    <div className="font-semibold text-white">Farms &amp; Fields</div>
                    <div className="text-[11px] text-slate-400">Boundaries, soil, area</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                    <Compass className="w-4 h-4 text-[#73CAD0]" />
                    <div className="font-semibold text-white">Rotation Plans</div>
                    <div className="text-[11px] text-slate-400">Sequences, scores, crops</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                    <AlertTriangle className="w-4 h-4 text-[#E6B86A]" />
                    <div className="font-semibold text-white">Alerts &amp; Risks</div>
                    <div className="text-[11px] text-slate-400">Moisture, heat, deficit</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                    <Database className="w-4 h-4 text-[#78C78B]" />
                    <div className="font-semibold text-white">NASA Evidence</div>
                    <div className="text-[11px] text-slate-400">SMAP, ET0, GDD, Sentinel</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>Navigate directly to any section:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate('farms');
                    }}
                    className="hover:text-white underline cursor-pointer"
                  >
                    My Farms
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate('calendar');
                    }}
                    className="hover:text-white underline cursor-pointer"
                  >
                    Calendar
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate('data');
                    }}
                    className="hover:text-white underline cursor-pointer"
                  >
                    Data Center
                  </button>
                </div>
              </div>
            </div>
          ) : filteredResults.length > 0 ? (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#27D7B2]/15 border border-[#27D7B2]/40 text-white'
                      : 'hover:bg-white/5 text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        item.type === 'farm'
                          ? 'bg-[#27D7B2]/15 text-[#27D7B2]'
                          : item.type === 'field'
                          ? 'bg-[#73CAD0]/15 text-[#73CAD0]'
                          : item.type === 'rotation'
                          ? 'bg-[#78C78B]/15 text-[#78C78B]'
                          : item.type === 'alert'
                          ? 'bg-[#E6B86A]/15 text-[#E6B86A]'
                          : item.type === 'crop'
                          ? 'bg-[#52E2C3]/15 text-[#52E2C3]'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      {item.type === 'farm' && <Sprout className="w-4 h-4" />}
                      {item.type === 'field' && <MapPin className="w-4 h-4" />}
                      {item.type === 'rotation' && <Compass className="w-4 h-4" />}
                      {item.type === 'crop' && <Sparkles className="w-4 h-4" />}
                      {item.type === 'report' && <FileText className="w-4 h-4" />}
                      {item.type === 'alert' && <AlertTriangle className="w-4 h-4" />}
                      {item.type === 'task' && <Calendar className="w-4 h-4" />}
                      {item.type === 'evidence' && <Database className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                          {item.badge}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#27D7B2] bg-[#27D7B2]/10 border border-[#27D7B2]/30 rounded">
                        Press ↵
                      </kbd>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No results found for &ldquo;{query}&rdquo;</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  We searched your private authorized farms, field boundaries, rotation plans, and NASA evidence datasets.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('farms');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#27D7B2] text-[#07130C] font-semibold text-xs transition-colors cursor-pointer"
                >
                  Go to My Farms
                </button>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs transition-colors cursor-pointer"
                >
                  Clear Query
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer helper */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>ESC to dismiss</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Strictly Private • Zero external query leakage
          </div>
        </div>
      </div>
    </div>
  );
};

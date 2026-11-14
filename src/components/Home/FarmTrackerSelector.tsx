import React, { useState } from 'react';
import { ChevronDown, AlertTriangle, Check, Sprout, MapPin } from 'lucide-react';
import { SavedFarmPlan } from '../../types';
import { computeDailyStatusSnapshot } from '../../services/dailySnapshot';

interface FarmTrackerSelectorProps {
  farms: SavedFarmPlan[];
  selectedFarmId: string;
  onSelectFarm: (farmId: string) => void;
  onAddNewFarm?: () => void;
}

export const FarmTrackerSelector: React.FC<FarmTrackerSelectorProps> = ({
  farms,
  selectedFarmId,
  onSelectFarm,
  onAddNewFarm,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCrossFarmAlertDismissed, setIsCrossFarmAlertDismissed] = useState(false);

  const currentFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];

  // Check if any other farm needs attention or has active alerts
  const otherFarmsNeedingAttention = farms
    .filter((f) => f.id !== currentFarm?.id)
    .map((f) => ({ farm: f, snapshot: computeDailyStatusSnapshot(f) }))
    .filter((item) => item.snapshot.overallStatus === 'alert' || item.snapshot.overallStatus === 'needs_attention');

  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* 1. PRIMARY: PAGE-LEVEL FARM SELECTOR DROPDOWN ("Viewing: [Farm Name] ▾") */}
      <div className="relative inline-block w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 px-3.5 py-2 rounded-xl glass-card hover:border-[#27D7B2]/40 text-white font-medium text-sm transition-all duration-150 backdrop-blur-md cursor-pointer group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-xs font-medium">Viewing:</span>
            <span className="text-white font-semibold tracking-tight text-sm">
              {currentFarm?.name || 'My Farm'}
            </span>
            <span className="text-xs text-slate-300 hidden md:inline">
              ({currentFarm?.locationName || 'Local parcel'})
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#27D7B2] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 mt-2 w-full sm:w-80 rounded-2xl glass-card border border-white/[0.18] shadow-2xl backdrop-blur-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-xs text-slate-300 uppercase tracking-wider border-b border-white/[0.08] font-semibold">
                Select Saved Farm ({farms.length})
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {farms.map((f) => {
                  const isSelected = f.id === currentFarm?.id;
                  const snap = computeDailyStatusSnapshot(f);

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        onSelectFarm(f.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#27D7B2]/15 border border-[#27D7B2]/40 text-white font-semibold'
                          : 'hover:bg-white/[0.04] text-[#A7C0CC] hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white truncate">
                          {f.name}
                        </div>
                        <div className="text-[11px] text-[#718D9A] truncate">
                          {f.locationName}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {snap.overallStatus === 'alert' && (
                          <span className="w-2 h-2 rounded-full bg-rose-400" title="Alert active" />
                        )}
                        {snap.overallStatus === 'needs_attention' && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" title="Notice" />
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#27D7B2]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {onAddNewFarm && (
                <div className="pt-1.5 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onAddNewFarm();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-[#27D7B2]/15 text-[#27D7B2] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>+ Add New Farm Parcel</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 2. SECONDARY: SUBTLE, COMPACT DISMISSIBLE CROSS-FARM NOTICE */}
      {!isCrossFarmAlertDismissed && otherFarmsNeedingAttention.length > 0 && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate max-w-xs sm:max-w-md">
            Notice: <strong>{otherFarmsNeedingAttention[0].farm.name}</strong> has active alerts.
          </span>
          <button
            type="button"
            onClick={() => onSelectFarm(otherFarmsNeedingAttention[0].farm.id)}
            className="text-[#27D7B2] hover:underline font-semibold shrink-0 cursor-pointer ml-1"
          >
            Switch
          </button>
          <button
            type="button"
            onClick={() => setIsCrossFarmAlertDismissed(true)}
            className="text-amber-300 hover:text-white shrink-0 ml-1 p-0.5 cursor-pointer"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

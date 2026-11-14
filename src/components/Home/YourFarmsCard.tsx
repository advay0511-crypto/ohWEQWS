import React, { useMemo } from 'react';
import { Sprout, AlertTriangle, ShieldCheck, Plus } from 'lucide-react';
import farmThumbImg from '../../assets/images/farm_thumbnail_1790691751269.jpg';
import { SavedFarmPlan } from '../../types';
import { GlassCard } from '../DesignSystem';
import { generateFarmNasaAlerts } from '../../services/nasaAlerts';

interface YourFarmsCardProps {
  onViewAll: () => void;
  onSelectFarm: (farmId?: string) => void;
  onAddNewFarm: () => void;
  activeFarm?: SavedFarmPlan;
  allFarms?: SavedFarmPlan[];
}

export const YourFarmsCard: React.FC<YourFarmsCardProps> = ({
  onViewAll,
  onSelectFarm,
  onAddNewFarm,
  activeFarm,
  allFarms = [],
}) => {
  // REQUIREMENT: "for home page the your farms section make sure it shows the last analysed only so latest one"
  const latestAnalyzedFarm = useMemo(() => {
    const analyzed = allFarms.filter((f) => f.analysis !== null);
    if (analyzed.length > 0) {
      return [...analyzed].sort((a, b) => {
        const timeA = new Date(a.analysis?.createdAt || a.updatedAt).getTime();
        const timeB = new Date(b.analysis?.createdAt || b.updatedAt).getTime();
        return timeB - timeA;
      })[0];
    }
    return activeFarm || allFarms[0];
  }, [allFarms, activeFarm]);

  const targetFarm = latestAnalyzedFarm;
  const farmName = targetFarm?.name || 'Al Marjan Farm';

  // Check if this latest analyzed farm has any NASA alerts
  const farmAlert = targetFarm ? generateFarmNasaAlerts([targetFarm])[0] : null;

  return (
    <GlassCard variant="default" className="p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#27D7B2]/10 border border-[#27D7B2]/30 flex items-center justify-center">
            <Sprout className="w-4 h-4 text-[#27D7B2]" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-[#F0F7FA] tracking-tight">Your Farms</h2>
            <p className="text-[12px] text-[#A7C0CC]">Latest analyzed farm parcel &amp; health telemetry.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAddNewFarm}
            className="text-[12px] font-semibold text-[#27D7B2] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Farm</span>
          </button>
          <button
            type="button"
            onClick={onViewAll}
            className="text-[12px] font-medium text-[#A7C0CC] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View all</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* Farm Card: Shows ONLY farm image, name, and alert (or reassuring message if no alert) */}
      <div
        onClick={() => onSelectFarm(targetFarm?.id)}
        className="p-4 rounded-2xl bg-[#031923]/70 hover:bg-[#031923]/90 border border-[#27D7B2]/30 hover:border-[#27D7B2]/60 transition-all cursor-pointer shadow-md group space-y-3.5 flex-1 flex flex-col justify-between"
      >
        {/* Farm Image and Name only */}
        <div className="flex items-center gap-4">
          <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-xl overflow-hidden border border-[#27D7B2]/40 shrink-0 bg-[#020A10] shadow-md">
            <img
              src={farmThumbImg}
              alt={farmName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#27D7B2] transition-colors truncate">
                {farmName}
              </h3>
              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
            </div>
            <p className="text-xs text-[#A7C0CC] mt-1">
              Click to view active rotation recommendations &amp; soil profile &rarr;
            </p>
          </div>
        </div>

        {/* Alert Section: Visible only if there's an alert, else professional and assuring */}
        {farmAlert ? (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-amber-300">Active Alert Detected</div>
              <div className="text-amber-200/90 text-[11px] leading-snug mt-0.5">
                {farmAlert.shortAlert || farmAlert.title}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-emerald-300">Optimal Growth Conditions</div>
              <div className="text-emerald-200/90 text-[11px] leading-snug mt-0.5">
                All soil moisture, precipitation, and NASA climate telemetry are within healthy baseline parameters. No risks or interventions required.
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

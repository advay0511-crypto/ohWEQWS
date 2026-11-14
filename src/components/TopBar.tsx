import React from 'react';
import { Sparkles, History, Sprout, Sun, Moon, Layers, ChevronDown } from 'lucide-react';

interface TopBarProps {
  currentTab: 'dashboard' | 'rotations' | 'simulator' | 'data' | 'wizard';
  onNavigate: (tab: 'dashboard' | 'rotations' | 'simulator' | 'data' | 'wizard') => void;
  onContinueLastAnalysis: () => void;
  onLoadDemo: () => void;
  hasExistingAnalysis: boolean;
  farmLocationName?: string;
  activeFarmName?: string;
  onOpenFarmSwitcher?: () => void;
  farmsCount?: number;
  isStale?: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onNavigate,
  onContinueLastAnalysis,
  onLoadDemo,
  hasExistingAnalysis,
  farmLocationName,
  activeFarmName,
  onOpenFarmSwitcher,
  farmsCount = 1,
  isStale = false,
  theme = 'dark',
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';

  return (
    <header className="glass-nav sticky top-0 z-40 w-full transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: Brand & Farm Selector */}
        <div className="flex items-center gap-3.5 shrink-0">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-400/30 p-[1.5px] flex items-center justify-center shadow-md shadow-sky-500/10 group-hover:scale-105 transition-transform">
              <div className={`w-full h-full rounded-[9px] flex items-center justify-center transition-colors ${
                isDark ? 'bg-[#0b101c]' : 'bg-[#FFFFFF]'
              }`}>
                <Sprout className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight transition-colors ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Field Shift
              </span>
              <span className={`text-[10px] font-mono tracking-wider uppercase -mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                NASA Earth Data
              </span>
            </div>
          </button>

          {/* Farm Switcher Pill */}
          {onOpenFarmSwitcher && (
            <button
              type="button"
              onClick={onOpenFarmSwitcher}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
              title="Switch farm parcel or view saved farms"
            >
              <Layers className="w-3.5 h-3.5 text-[#27D7B2]" />
              <span className="max-w-[150px] truncate">{activeFarmName || farmLocationName || 'Saved Farms'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Zone 2: Navigation Links - Clean Typography without Cards */}
        <nav
          className="hidden md:flex items-center h-full gap-2 text-sm font-semibold"
          aria-label="Main Navigation"
        >
          <button
            onClick={() => onNavigate('dashboard')}
            className={`relative h-full px-3 py-2 transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'dashboard'
                ? 'text-[#27D7B2] font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Dashboard
            {currentTab === 'dashboard' && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#27D7B2] rounded-full shadow-[0_0_8px_rgba(39,215,178,0.8)]" />
            )}
          </button>
          
          {hasExistingAnalysis && (
            <>
              <button
                onClick={() => onNavigate('rotations')}
                className={`relative h-full px-3 py-2 transition-all whitespace-nowrap cursor-pointer ${
                  currentTab === 'rotations'
                    ? 'text-[#27D7B2] font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Rotations
                {currentTab === 'rotations' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#27D7B2] rounded-full shadow-[0_0_8px_rgba(39,215,178,0.8)]" />
                )}
              </button>
              <button
                onClick={() => onNavigate('simulator')}
                className={`relative h-full px-3 py-2 transition-all whitespace-nowrap cursor-pointer ${
                  currentTab === 'simulator'
                    ? 'text-[#27D7B2] font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                What-If Simulator
                {currentTab === 'simulator' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#27D7B2] rounded-full shadow-[0_0_8px_rgba(39,215,178,0.8)]" />
                )}
              </button>
            </>
          )}

          <button
            onClick={() => onNavigate('data')}
            className={`relative h-full px-3 py-2 transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'data'
                ? 'text-[#27D7B2] font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Data Sources
            {currentTab === 'data' && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#27D7B2] rounded-full shadow-[0_0_8px_rgba(39,215,178,0.8)]" />
            )}
          </button>
        </nav>

        {/* Zone 3: Actions + Theme Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? 'text-amber-300 hover:text-amber-200 bg-white/[0.04] hover:bg-white/[0.08] border-white/10'
                  : 'text-indigo-600 hover:text-indigo-700 bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
              }`}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* Farm Switcher button on small screens */}
          {onOpenFarmSwitcher && (
            <button
              type="button"
              onClick={onOpenFarmSwitcher}
              className={`sm:hidden p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? 'text-sky-400 bg-white/[0.04] border-white/10'
                  : 'text-sky-600 bg-slate-900/[0.04] border-slate-900/10'
              }`}
              title="Saved Farms"
            >
              <Layers className="w-4 h-4" />
            </button>
          )}

          {/* Start / View Plan Button */}
          <button
            onClick={onContinueLastAnalysis}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <History className="w-4 h-4" />
            <span>{hasExistingAnalysis ? (isStale ? 'Re-run Plan' : 'View Plan') : 'Start Setup'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar - Strictly respects hasExistingAnalysis */}
      <div className={`flex md:hidden border-t px-2 py-1.5 justify-around text-xs font-semibold ${
        isDark ? 'border-white/[0.08] bg-[#080c16]/95' : 'border-slate-900/[0.08] bg-[#FFFFFF]/95'
      }`}>
        <button
          onClick={() => onNavigate('dashboard')}
          className={`py-2 px-3 rounded-lg ${
            currentTab === 'dashboard'
              ? isDark ? 'text-white bg-white/10 font-bold' : 'text-slate-950 bg-slate-900/10 font-bold'
              : isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Dashboard
        </button>

        {hasExistingAnalysis && (
          <>
            <button
              onClick={() => onNavigate('rotations')}
              className={`py-2 px-3 rounded-lg ${
                currentTab === 'rotations'
                  ? isDark ? 'text-white bg-white/10 font-bold' : 'text-slate-950 bg-slate-900/10 font-bold'
                  : isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Rotations
            </button>
            <button
              onClick={() => onNavigate('simulator')}
              className={`py-2 px-3 rounded-lg ${
                currentTab === 'simulator'
                  ? isDark ? 'text-white bg-white/10 font-bold' : 'text-slate-950 bg-slate-900/10 font-bold'
                  : isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              What-If
            </button>
          </>
        )}

        <button
          onClick={() => onNavigate('data')}
          className={`py-2 px-3 rounded-lg ${
            currentTab === 'data'
              ? isDark ? 'text-white bg-white/10 font-bold' : 'text-slate-950 bg-slate-900/10 font-bold'
              : isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Data
        </button>
      </div>
    </header>
  );
};

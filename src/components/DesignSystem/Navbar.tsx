import React from 'react';
import {
  Home,
  Sprout,
  Calendar,
  RefreshCw,
  SlidersHorizontal,
  Database,
  Bell,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Undo2,
  Redo2,
  Map,
  Image as ImageIcon,
  Sun,
  Moon,
  Droplet,
  Activity,
  Search,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { useBackground, BACKGROUND_THEMES } from '../Common/CinematicBackground';

export interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: any) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onOpenFarmSwitcher?: () => void;
  onOpenSettings?: () => void;
  onOpenNotifications?: () => void;
  onOpenSignIn?: () => void;
  onOpenAiBot?: () => void;
  onOpenPageGuide?: () => void;
  onOpenSearch?: () => void;
  unreadAlertsCount?: number;
  currentUser?: UserProfile;
  activeFarmName?: string;
  className?: string;
  viewMode?: 'simple' | 'advanced';
  onToggleViewMode?: (mode: 'simple' | 'advanced') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onOpenFarmSwitcher,
  onOpenSettings,
  onOpenNotifications,
  onOpenSignIn,
  onOpenAiBot,
  onOpenPageGuide,
  onOpenSearch,
  unreadAlertsCount = 0,
  currentUser,
  activeFarmName = 'Farm Parcel 1',
  className = '',
}) => {
  const { activeThemeId, nextTheme, activeTheme } = useBackground();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'farms', label: 'Farms', icon: Sprout },
    { id: 'analysis', label: 'Intelligence', icon: Activity },
    { id: 'rotations', label: 'Rotations', icon: RefreshCw },
    { id: 'simulator', label: 'Simulator', icon: SlidersHorizontal },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'data', label: 'Data', icon: Database },
  ] as const;

  return (
    <header
      className={`sticky top-0 z-50 w-full glass-nav transition-all duration-300 ${className}`}
    >
      <div className="max-w-[1440px] mx-auto h-14 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* LEFT: History Controls + Brand + Active Farm Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Connected Undo/Redo pair with frosted glass */}
          <div className="flex items-center bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg p-0.5 backdrop-blur-sm transition-colors shadow-sm">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo"
              className={`p-1.5 rounded-md transition-all ${
                canUndo
                  ? 'text-[#27D7B2] hover:bg-white/10 cursor-pointer active:scale-95'
                  : 'text-white/20 cursor-not-allowed opacity-30'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
              className={`p-1.5 rounded-md transition-all ${
                canRedo
                  ? 'text-[#27D7B2] hover:bg-white/10 cursor-pointer active:scale-95'
                  : 'text-white/20 cursor-not-allowed opacity-30'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Logo & Brand */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#27D7B2] to-[#12887A] flex items-center justify-center text-[#020A10] font-black text-sm shadow-md shadow-[#27D7B2]/30 group-hover:scale-105 transition-transform">
              FS
            </div>
            <span className="hidden md:inline font-bold text-sm tracking-wider text-white drop-shadow-sm">
              FIELD SHIFT
            </span>
          </button>

          {/* Connected Farm Switcher */}
          {onOpenFarmSwitcher && (
            <button
              type="button"
              onClick={onOpenFarmSwitcher}
              title="Switch Farm"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-white backdrop-blur-sm transition-all cursor-pointer shadow-sm group"
            >
              <Sprout className="w-3.5 h-3.5 text-[#27D7B2]" />
              <span className="truncate max-w-[110px] sm:max-w-[150px] font-semibold text-white">
                {activeFarmName}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-white transition-colors" />
            </button>
          )}
        </div>

        {/* CENTER: Clean Navigation Links (Cards Removed) */}
        <nav className="flex items-center h-full gap-0.5 sm:gap-1 lg:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                title={item.label}
                className={`relative h-full px-2 sm:px-2.5 lg:px-3 flex items-center gap-1.5 text-xs transition-colors duration-200 cursor-pointer select-none group ${
                  isActive
                    ? 'text-[#27D7B2] font-semibold drop-shadow-[0_0_12px_rgba(39,215,178,0.5)]'
                    : 'text-slate-300 hover:text-white font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isActive
                      ? 'text-[#27D7B2] scale-105'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="hidden md:inline whitespace-nowrap">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-gradient-to-r from-[#27D7B2] via-[#52E2C3] to-[#73CAD0] rounded-full shadow-[0_0_10px_rgba(39,215,178,0.9)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* RIGHT: Connected Visual Utility Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Cinematic Wallpaper Cycle Button */}
          <button
            type="button"
            onClick={nextTheme}
            title={`Wallpaper: ${activeTheme.name} (Click to cycle)`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-100 hover:text-[#27D7B2] backdrop-blur-sm transition-all cursor-pointer text-xs shadow-sm"
          >
            <ImageIcon className="w-4 h-4 text-[#27D7B2]" />
            <span className="hidden xl:inline text-[11px] font-medium text-slate-200">{activeTheme.name}</span>
          </button>

          {/* Connected Action Group (Search + Guide + Notifications + AI) */}
          <div className="flex items-center bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg p-0.5 backdrop-blur-sm shadow-sm">
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                title="Global Search (Press ⌘K or /)"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-slate-200 hover:text-[#27D7B2] hover:bg-white/10 transition-colors cursor-pointer text-xs"
              >
                <Search className="w-3.5 h-3.5 text-[#27D7B2]" />
                <kbd className="hidden lg:inline text-[9px] font-mono bg-white/10 px-1 py-0.2 rounded text-slate-300">
                  ⌘K
                </kbd>
              </button>
            )}

            {onOpenPageGuide && (
              <button
                type="button"
                onClick={onOpenPageGuide}
                title="Page Guide & Visual Reference"
                className="p-1.5 rounded-md text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}

            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                title="Environmental & Satellite Alerts"
                className="relative p-1.5 rounded-md text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            )}

            {onOpenAiBot && (
              <button
                type="button"
                onClick={onOpenAiBot}
                title="AI Agronomist Chat"
                className="p-1.5 rounded-md text-[#27D7B2] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* User Profile Avatar / Sign-in */}
          {onOpenSignIn && (
            <button
              type="button"
              onClick={onOpenSignIn}
              title={currentUser ? `${currentUser.name} (${currentUser.role})` : 'Agronomist Account'}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#27D7B2] to-[#12887A] text-[#020A10] font-black text-xs flex items-center justify-center hover:brightness-110 shadow-md shadow-[#27D7B2]/20 transition-all cursor-pointer"
            >
              {currentUser?.avatarLetter || 'B'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

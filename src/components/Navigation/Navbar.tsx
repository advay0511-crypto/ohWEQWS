import React from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Layers,
  Sliders,
  Globe,
  Bell,
  Sparkles,
  HelpCircle,
  Settings,
  Database,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { AppViewMode } from '../../types';

export interface NavbarProps {
  currentTab: 'home' | 'maps' | 'farm-view' | 'new-analysis' | 'rotations' | 'analysis' | 'calendar' | 'network' | 'deep-logs' | 'data-trust' | 'settings';
  onNavigate: (tab: 'home' | 'maps' | 'farm-view' | 'new-analysis' | 'rotations' | 'analysis' | 'calendar' | 'network' | 'deep-logs' | 'data-trust' | 'settings') => void;
  viewMode: AppViewMode;
  onToggleViewMode: () => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  onOpenAiChat: () => void;
  onOpenPageGuide: () => void;
  activeFarmName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  viewMode,
  onToggleViewMode,
  unreadAlertsCount,
  onOpenAlerts,
  onOpenAiChat,
  onOpenPageGuide,
  activeFarmName,
}) => {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'maps', label: 'Maps' },
    { id: 'new-analysis', label: 'New Analysis' },
    { id: 'rotations', label: 'Rotations' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'network', label: 'Network' },
  ] as const;

  return (
    <header className="sticky top-0 h-16 w-full glass-nav px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8 z-40 shrink-0 select-none">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#19291F] to-[#121F17] border border-[#89B96F]/40 flex items-center justify-center text-[#89B96F] group-hover:border-[#89B96F] group-hover:scale-105 transition-all shadow-md shadow-[#89B96F]/10">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-[#EDF3EC] leading-none whitespace-nowrap">
              Field Shift
            </div>
            <div className="text-[10px] font-mono text-[#89B96F] leading-tight mt-0.5">
              Agricultural Intelligence
            </div>
          </div>
        </button>

        {activeFarmName && (
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-white/10 text-xs font-mono text-[#B1BDB0]">
            <span className="w-2 h-2 rounded-full bg-[#89B96F] animate-pulse"></span>
            <span className="truncate max-w-[140px] font-semibold">{activeFarmName}</span>
          </div>
        )}
      </div>

      {/* Zone 2: Primary Route Links (Cards Removed) */}
      <nav className="flex items-center h-full gap-1 text-xs font-medium text-[#B1BDB0] overflow-x-auto py-1 scrollbar-none">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative h-full px-3 py-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'text-[#89B96F] font-bold'
                  : 'hover:text-[#EDF3EC]'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#89B96F] rounded-full shadow-[0_0_8px_rgba(137,185,111,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Utility Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Deep Analysis Logs Link */}
        <button
          type="button"
          onClick={() => onNavigate('deep-logs')}
          className={`p-2 rounded-lg transition-colors ${
            currentTab === 'deep-logs' ? 'bg-[#19291F] text-[#89B96F]' : 'text-[#819082] hover:text-[#EDF3EC] hover:bg-[#121F17]'
          }`}
          title="Deep Analysis Logs & Trace History"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Data & Trust Center Link */}
        <button
          type="button"
          onClick={() => onNavigate('data-trust')}
          className={`p-2 rounded-lg transition-colors ${
            currentTab === 'data-trust' ? 'bg-[#19291F] text-[#89B96F]' : 'text-[#819082] hover:text-[#EDF3EC] hover:bg-[#121F17]'
          }`}
          title="Data & Trust Center (Formulas & Datasets)"
        >
          <Database className="w-4 h-4" />
        </button>

        {/* Notifications Bell */}
        <button
          type="button"
          onClick={onOpenAlerts}
          className="relative p-2 rounded-lg text-[#819082] hover:text-[#EDF3EC] hover:bg-[#121F17] transition-colors"
          title="In-app Environmental Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D96C63]" />
          )}
        </button>

        {/* AI Agronomist Chat Trigger */}
        <button
          type="button"
          onClick={onOpenAiChat}
          className="p-2 rounded-lg text-[#89B96F] hover:bg-[#19291F] border border-[#293B2E] transition-colors flex items-center gap-1"
          title="AI Agronomist Chat"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Page Guide Walkthrough Trigger */}
        <button
          type="button"
          onClick={onOpenPageGuide}
          className="p-2 rounded-lg text-[#819082] hover:text-[#EDF3EC] hover:bg-[#121F17] transition-colors"
          title="Page Guide & Tour"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={`p-2 rounded-lg transition-colors ${
            currentTab === 'settings' ? 'bg-[#19291F] text-[#89B96F]' : 'text-[#819082] hover:text-[#EDF3EC] hover:bg-[#121F17]'
          }`}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

import React from 'react';
import {
  Home,
  Sprout,
  BarChart3,
  RefreshCw,
  FlaskConical,
  Database,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export interface SidebarProps {
  currentTab: string;
  onNavigate: (tabId: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}) => {
  const items: SidebarItem[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'farms', label: 'My Farms', icon: <Sprout className="w-4 h-4" /> },
    { id: 'analysis', label: 'Analysis', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'rotations', label: 'Rotations', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'simulator', label: 'Simulator', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={`h-full bg-[#031923]/95 backdrop-blur-md border-r border-[#49AABE]/25 flex flex-col justify-between transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-60'
      } ${className}`}
    >
      <div className="p-3 space-y-4">
        {/* Logo and Brand in Sidebar */}
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 rounded-lg bg-[#42D6AE]/10 border border-[#42D6AE]/30 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
              <path
                d="M7 25C7 25 8 13 19 8C19 8 26 18 17 23C13 25.2 8.5 25 7 25Z"
                fill="#42D6AE"
              />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="text-base font-bold text-[#F0F7FA] tracking-tight truncate">
              FIELD SHIFT
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#42D6AE]/15 text-[#42D6AE] border border-[#42D6AE]/35 font-bold shadow-sm shadow-[#42D6AE]/10'
                    : 'text-[#A7C0CC] hover:text-[#F0F7FA] hover:bg-white/[0.04]'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={isActive ? 'text-[#42D6AE]' : 'text-[#718D9A]'}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#49AABE]/20 text-[#3BD9C2]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <div className="p-3 border-t border-[#49AABE]/20">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs text-[#A7C0CC] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
};

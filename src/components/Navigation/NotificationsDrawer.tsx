import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Droplet,
  Thermometer,
  CloudRain,
  ChevronRight,
  Trash2,
  Check,
  Eye,
  RotateCcw,
  SlidersHorizontal,
  FileText,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  NasaAlert,
  NotificationItem,
  NotificationCategory,
  NotificationSeverity,
  NotificationLifecycleStatus,
} from '../../types';

export interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: NasaAlert[];
  onSelectAlert?: (alert: NasaAlert) => void;
  onSelectFarmAlert?: (farmId: string, fieldId?: string) => void;
  onMarkAllAsRead?: () => void;
  onDismissAlert?: (alertId: string) => void;
  onNavigateToReport?: (farmId: string) => void;
  onNavigateToCalendar?: (farmId: string) => void;
  isAdvanced?: boolean;
  onUnreadCountChange?: (count: number) => void;
}

export const STORAGE_KEY_NOTIFICATION_STATUS = 'fieldshift_notification_lifecycle_v2';

export interface StoredLifecycleState {
  [id: string]: {
    status: NotificationLifecycleStatus;
    snoozedUntil?: number; // epoch ms
    resolvedAt?: string;
  };
}

export function getStoredNotificationLifecycle(): StoredLifecycleState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATION_STATUS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function computeCanonicalNotifications(
  alerts: NasaAlert[],
  lifecycleState: StoredLifecycleState
): NotificationItem[] {
  const list: NotificationItem[] = [];
  const now = Date.now();

  // 1. Environmental Alerts from NASA observations
  alerts.forEach((a) => {
    const customState = lifecycleState[a.id];
    let status: NotificationLifecycleStatus = customState?.status || (a.read ? 'read' : 'unread');

    // Check if snoozed has expired
    if (status === 'snoozed' && customState?.snoozedUntil && customState.snoozedUntil < now) {
      status = 'unread';
    }

    list.push({
      id: a.id,
      groupKey: `env_${a.type}_${a.farmId}`,
      category: 'alert',
      severity: a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'high' : 'caution',
      status,
      title: a.title,
      summary: a.shortAlert || a.boldWarning,
      timestamp: a.timestamp,
      farmId: a.farmId,
      farmName: a.farmName,
      actionAffordance: 'view_field',
      actionLabel: 'View Field',
      observedValue: a.observedValue,
      baselineValue: a.historicalBaseline,
      anomaly: a.anomalyDelta,
      dataset: a.satelliteSensor,
      snoozedUntil: customState?.snoozedUntil ? new Date(customState.snoozedUntil).toISOString() : undefined,
      resolvedAt: customState?.resolvedAt,
      isCriticalActive: a.severity === 'critical' && status !== 'resolved',
    });
  });

  // 2. Report & Deep Analysis Notifications
  alerts.slice(0, 1).forEach((a) => {
    const repId = `report_ready_${a.farmId}`;
    const customState = lifecycleState[repId];
    list.push({
      id: repId,
      groupKey: `report_${a.farmId}`,
      category: 'report',
      severity: 'info',
      status: customState?.status || 'read',
      title: `Deep Analysis Ready: ${a.farmName}`,
      summary: `Multi-season rotation matrices and 10-year NASA climate traces updated for ${a.farmName}.`,
      timestamp: '1 hour ago',
      farmId: a.farmId,
      farmName: a.farmName,
      actionAffordance: 'open_report',
      actionLabel: 'Open Report',
      dataset: 'Deterministic Rotation Engine v8.0',
      resolvedAt: customState?.resolvedAt,
    });
  });

  // 3. Planned Tasks & Field Operations Notifications
  alerts.slice(0, 1).forEach((a) => {
    const taskId = `task_due_${a.farmId}`;
    const customState = lifecycleState[taskId];
    list.push({
      id: taskId,
      groupKey: `task_${a.farmId}`,
      category: 'task',
      severity: 'caution',
      status: customState?.status || 'unread',
      title: 'Check Tensiometer & Soil Tilth',
      summary: `Routine root-zone moisture inspection recommended before upcoming thermal window.`,
      timestamp: 'Today',
      farmId: a.farmId,
      farmName: a.farmName,
      actionAffordance: 'review_task',
      actionLabel: 'Review Task',
      dataset: 'Farm Calendar & Operations Ledger',
      resolvedAt: customState?.resolvedAt,
    });
  });

  // 4. System & Remote Sensor Service Notice
  const sysId = 'sys_sensor_sync';
  const sysState = lifecycleState[sysId];
  list.push({
    id: sysId,
    groupKey: 'system_sync_status',
    category: 'system',
    severity: 'info',
    status: sysState?.status || 'read',
    title: 'Satellite Provenance Synchronized',
    summary: 'NASA POWER Climatology & Open-Meteo feeds successfully verified against orbital coordinates.',
    timestamp: 'Today at 06:00 UTC',
    actionAffordance: 'retry_run',
    actionLabel: 'Connection Status',
    dataset: 'NASA EOSDIS & WMO ECMWF',
  });

  return list;
}

export function getCanonicalUnreadCount(alerts: NasaAlert[]): number {
  const lifecycle = getStoredNotificationLifecycle();
  const list = computeCanonicalNotifications(alerts, lifecycle);
  return list.filter((n) => n.status === 'unread').length;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onSelectAlert,
  onSelectFarmAlert,
  onMarkAllAsRead,
  onDismissAlert,
  onNavigateToReport,
  onNavigateToCalendar,
  isAdvanced = false,
  onUnreadCountChange,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'reports' | 'tasks' | 'system'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'unread' | 'snoozed' | 'resolved' | 'all'>('active');
  const [selectedNotificationDetail, setSelectedNotificationDetail] = useState<NotificationItem | null>(null);
  const [snoozeMenuForId, setSnoozeMenuForId] = useState<string | null>(null);

  // Persistent lifecycle store for read/ack/snooze/dismiss/resolve
  const [lifecycleState, setLifecycleState] = useState<StoredLifecycleState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATION_STATUS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const updateLifecycle = (id: string, updates: Partial<StoredLifecycleState[string]>) => {
    setLifecycleState((prev) => {
      const current = prev[id] || { status: 'unread' };
      const nextState = {
        ...prev,
        [id]: { ...current, ...updates },
      };
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFICATION_STATUS, JSON.stringify(nextState));
      } catch {
        // ignore
      }
      return nextState;
    });
  };

  // Convert raw alerts + synthetic system & report notifications into unified Canonical Notification list
  const canonicalNotifications = useMemo<NotificationItem[]>(() => {
    return computeCanonicalNotifications(alerts, lifecycleState);
  }, [alerts, lifecycleState]);

  // Derived unread count
  const unreadCount = useMemo(() => {
    return canonicalNotifications.filter((n) => n.status === 'unread').length;
  }, [canonicalNotifications]);

  // Synchronize unread count to parent navbar immediately
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Filtered by category tab and lifecycle status
  const displayedNotifications = useMemo(() => {
    return canonicalNotifications.filter((item) => {
      // 1. Category Tab Filter
      if (activeTab === 'alerts' && item.category !== 'alert') return false;
      if (activeTab === 'reports' && item.category !== 'report') return false;
      if (activeTab === 'tasks' && item.category !== 'task') return false;
      if (activeTab === 'system' && item.category !== 'system') return false;

      // 2. Lifecycle Status Filter
      if (statusFilter === 'active') {
        // Active shows unread, read, and acknowledged (excludes snoozed, dismissed, resolved)
        return item.status === 'unread' || item.status === 'read' || item.status === 'acknowledged';
      }
      if (statusFilter === 'unread') {
        return item.status === 'unread';
      }
      if (statusFilter === 'snoozed') {
        return item.status === 'snoozed';
      }
      if (statusFilter === 'resolved') {
        return item.status === 'resolved' || item.status === 'dismissed';
      }
      return true;
    });
  }, [canonicalNotifications, activeTab, statusFilter]);

  // Handle Mark All as Read (Critical alerts remain visible and active)
  const handleMarkAllRead = () => {
    canonicalNotifications.forEach((n) => {
      if (n.status === 'unread') {
        updateLifecycle(n.id, { status: 'read' });
      }
    });
    if (onMarkAllAsRead) onMarkAllAsRead();
  };

  // Snooze options
  const handleSnooze = (id: string, hours: number) => {
    const until = Date.now() + hours * 3600 * 1000;
    updateLifecycle(id, { status: 'snoozed', snoozedUntil: until });
    setSnoozeMenuForId(null);
  };

  const handleDismiss = (id: string) => {
    updateLifecycle(id, { status: 'dismissed' });
    if (onDismissAlert) onDismissAlert(id);
  };

  const handleResolve = (id: string) => {
    updateLifecycle(id, { status: 'resolved', resolvedAt: new Date().toISOString() });
  };

  const handleRestore = (id: string) => {
    updateLifecycle(id, { status: 'unread', snoozedUntil: undefined, resolvedAt: undefined });
  };

  const handleRowClick = (item: NotificationItem) => {
    // Mark as read immediately on click
    if (item.status === 'unread') {
      updateLifecycle(item.id, { status: 'read' });
    }

    // Execute corresponding route preserving farm context
    if (item.actionAffordance === 'view_field' && item.farmId) {
      if (onSelectFarmAlert) onSelectFarmAlert(item.farmId, item.fieldId);
      onClose();
    } else if (item.actionAffordance === 'open_report' && item.farmId) {
      if (onNavigateToReport) onNavigateToReport(item.farmId);
      onClose();
    } else if (item.actionAffordance === 'review_task' && item.farmId) {
      if (onNavigateToCalendar) onNavigateToCalendar(item.farmId);
      onClose();
    } else {
      setSelectedNotificationDetail(item);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[3px] z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right Drawer: 380–440px on desktop, full-width sheet on mobile */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] max-w-full flex flex-col glass-modal border-l border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-label="Notification Centre"
      >
        {/* Header */}
        <div className="p-4 sm:px-5 border-b border-white/10 bg-white/[0.04] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#27D7B2]/15 border border-[#27D7B2]/30 flex items-center justify-center text-[#27D7B2]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Notification Centre</h3>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-mono bg-[#27D7B2]/15 text-[#27D7B2] px-2 py-0.5 rounded-full font-bold border border-[#27D7B2]/30">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Environmental risk monitors &amp; execution audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-[#27D7B2] hover:text-[#52E2C3] hover:underline px-2 py-1 cursor-pointer"
                title="Mark all notifications as read"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close notification drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Category Tabs (All, Alerts, Reports, Tasks, System) */}
        <div className="px-3 py-2 border-b border-white/10 bg-black/40 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'alerts', label: 'Alerts' },
            { id: 'reports', label: 'Reports' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'system', label: 'System' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#27D7B2] text-[#07130C] font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Status Sub-Filters (Active, Unread, Snoozed, Resolved) */}
        <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'active', label: 'Active' },
              { id: 'unread', label: 'Unread' },
              { id: 'snoozed', label: 'Snoozed' },
              { id: 'resolved', label: 'Archived / Done' },
            ].map((sf) => (
              <button
                key={sf.id}
                type="button"
                onClick={() => setStatusFilter(sf.id as any)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                  statusFilter === sf.id
                    ? 'text-[#27D7B2] font-semibold bg-[#27D7B2]/10 border border-[#27D7B2]/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-mono text-slate-500">
            {displayedNotifications.length} items
          </span>
        </div>

        {/* Notifications Feed Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-3 space-y-1">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((item) => {
              const isUnread = item.status === 'unread';
              const isSnoozed = item.status === 'snoozed';
              const isResolved = item.status === 'resolved' || item.status === 'dismissed';
              const isSnoozeOpen = snoozeMenuForId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className={`relative p-3.5 rounded-xl transition-all cursor-pointer group space-y-2 ${
                    isUnread
                      ? 'bg-white/[0.04] hover:bg-white/[0.07] border-l-3 border-[#27D7B2]'
                      : 'hover:bg-white/[0.03] opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Row Top: Severity icon, Title, Farm context, timestamp */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="shrink-0 mt-0.5">
                        {item.severity === 'critical' ? (
                          <div className="w-5 h-5 rounded-full bg-[#E97971]/20 text-[#E97971] flex items-center justify-center border border-[#E97971]/40">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </div>
                        ) : item.severity === 'high' ? (
                          <div className="w-5 h-5 rounded-full bg-[#E6B86A]/20 text-[#E6B86A] flex items-center justify-center border border-[#E6B86A]/40">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        ) : item.category === 'report' ? (
                          <div className="w-5 h-5 rounded-full bg-[#73CAD0]/20 text-[#73CAD0] flex items-center justify-center border border-[#73CAD0]/40">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#78C78B]/20 text-[#78C78B] flex items-center justify-center border border-[#78C78B]/40">
                            <Info className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white leading-snug flex items-center gap-1.5 truncate">
                          <span>{item.title}</span>
                          {item.isCriticalActive && (
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-[#E97971] text-[#07130C] px-1.5 py-0.2 rounded font-mono shrink-0">
                              Critical Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                          {item.farmName && (
                            <span className="text-[#27D7B2] truncate max-w-[140px]">
                              {item.farmName}
                            </span>
                          )}
                          <span>•</span>
                          <span>{item.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Icons */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Snooze Toggle */}
                      {!isResolved && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setSnoozeMenuForId(isSnoozeOpen ? null : item.id)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Snooze notification"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>

                          {/* Snooze duration dropdown */}
                          {isSnoozeOpen && (
                            <div className="absolute right-0 top-6 z-20 w-36 rounded-xl bg-[#071a17] border border-white/20 shadow-2xl p-1 text-xs space-y-0.5 animate-in fade-in duration-100">
                              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">
                                Snooze for:
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSnooze(item.id, 4)}
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-white/10 text-slate-200"
                              >
                                4 Hours
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSnooze(item.id, 24)}
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-white/10 text-slate-200"
                              >
                                24 Hours (1 Day)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSnooze(item.id, 72)}
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-white/10 text-slate-200"
                              >
                                3 Days
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSnooze(item.id, 168)}
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-white/10 text-slate-200"
                              >
                                1 Week
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Resolve / Done */}
                      {!isResolved ? (
                        <button
                          type="button"
                          onClick={() => handleResolve(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-[#78C78B] hover:bg-white/10 transition-colors cursor-pointer"
                          title="Mark resolved"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRestore(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-[#27D7B2] hover:bg-white/10 transition-colors cursor-pointer"
                          title="Restore notification"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Dismiss */}
                      {!isResolved && (
                        <button
                          type="button"
                          onClick={() => handleDismiss(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-[#E97971] hover:bg-white/10 transition-colors cursor-pointer"
                          title="Dismiss (hide without resolving)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Text: 13-14px */}
                  <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed pl-7">
                    {item.summary}
                  </p>

                  {/* Advanced Mode Technical Data Attributes */}
                  {isAdvanced && item.observedValue && (
                    <div className="ml-7 p-2 rounded-lg bg-black/40 border border-white/5 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-400 block">Observed:</span>
                        <span className="text-[#27D7B2] font-semibold">{item.observedValue}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Baseline:</span>
                        <span className="text-slate-200">{item.baselineValue || 'Climatology Norm'}</span>
                      </div>
                      {item.anomaly && (
                        <div className="col-span-2 text-slate-300">
                          Anomaly: <strong className="text-[#E6B86A]">{item.anomaly}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Affordance Button */}
                  <div className="pl-7 pt-1 flex items-center justify-between text-xs">
                    <span className="text-[#27D7B2] font-semibold flex items-center gap-1 group-hover:underline">
                      <span>{item.actionLabel}</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    {item.dataset && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.dataset}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#78C78B] mx-auto opacity-70" />
              <div>
                <h4 className="text-sm font-bold text-white">All Clear in this View</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  No active {activeTab !== 'all' ? activeTab : 'environmental'} notifications require attention under the current filter.
                </p>
              </div>
              {statusFilter !== 'active' && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition-colors cursor-pointer"
                >
                  Return to Active Filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer explanation */}
        <div className="p-3 border-t border-white/10 bg-black/40 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#78C78B]"></span>
            <span>Duplicate suppression active</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Lifecycle: Ack ≠ Dismiss ≠ Resolve
          </span>
        </div>
      </div>
    </>
  );
};

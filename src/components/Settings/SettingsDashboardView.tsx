import React, { useState, useEffect } from 'react';
import {
  Settings,
  ArrowLeft,
  User,
  Sliders,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Check,
  AlertTriangle,
  Info,
  Globe,
  Sparkles,
  Bell,
  Clock,
  Layers,
  Trash2,
  Lock,
  Eye,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  Compass,
  FileText,
  Activity,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Sprout,
} from 'lucide-react';
import {
  AppSettings,
  UserProfile,
  SavedFarmPlan,
  AppViewMode,
} from '../../types';
import {
  exportAllFarmsBackup,
  importFarmsBackup,
  resetAllLocalData,
  loadSavedFarms,
} from '../../store/farmStorage';

export interface SettingsDashboardViewProps {
  onNavigateTab?: (tab: any) => void;
  onBack?: () => void;
  previousTabTitle?: string;
  currentUser?: UserProfile;
  onUpdateUser?: (updated: UserProfile) => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  farms?: SavedFarmPlan[];
  activeFarmId?: string;
  onSelectFarmId?: (id: string) => void;
  onOpenSignIn?: () => void;
}

export type SettingsSectionId =
  | 'display'
  | 'units'
  | 'defaults'
  | 'notifications'
  | 'privacy'
  | 'automation'
  | 'connectors'
  | 'account'
  | 'export'
  | 'about';

interface PingResult {
  service: string;
  status: 'idle' | 'testing' | 'ok' | 'error';
  latencyMs?: number;
  statusCode?: number;
  endpoint?: string;
  qualityFlag?: string;
  server?: string;
  error?: string;
}

export const SettingsDashboardView: React.FC<SettingsDashboardViewProps> = ({
  onNavigateTab = () => {},
  onBack = () => {},
  previousTabTitle = 'Dashboard',
  currentUser,
  onUpdateUser = () => {},
  settings,
  onSaveSettings,
  farms = [],
  activeFarmId,
  onSelectFarmId,
  onOpenSignIn,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('display');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states with dirty tracking
  const [formSettings, setFormSettings] = useState<AppSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);

  // Profile Form State
  const [profileName, setProfileName] = useState(currentUser?.name || 'Lead Agronomist');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || 'farmer@fieldshift.ag');
  const [profileRole, setProfileRole] = useState(currentUser?.role || 'Lead Agronomist');
  const [profileOrg, setProfileOrg] = useState(currentUser?.organization || 'Field Shift Co-op');
  const [isProfileDirty, setIsProfileDirty] = useState(false);

  // Import / Export Feedback
  const [importStatus, setImportStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Dangerous Operation Modal State
  const [dangerousModal, setDangerousModal] = useState<{
    isOpen: boolean;
    type: 'clear_farms' | 'reset_all' | 'delete_reports';
    title: string;
    description: string;
    scope: string;
    affectedCount: number;
    canRecover: boolean;
  } | null>(null);

  // Live Ping Diagnostics State
  const [pingResults, setPingResults] = useState<Record<string, PingResult>>({
    nasa_power: { service: 'NASA POWER Climatology (0.5°)', status: 'idle' },
    open_meteo: { service: 'Open-Meteo High-Res Weather', status: 'idle' },
    gemini_ai: { service: 'Google Gemini GenAI Model Proxy', status: 'idle' },
    esri_imagery: { service: 'ESRI World Imagery Tiles', status: 'idle' },
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Immediate save for single local toggles (View mode, Theme, Motion)
  const handleImmediateSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...formSettings, [key]: value };
    setFormSettings(updated);
    onSaveSettings(updated);
    showToast(`Saved preference: ${String(key)}`);

    // Theme injection into document root
    if (key === 'theme' && typeof value === 'string') {
      document.documentElement.setAttribute('data-theme', value);
      localStorage.setItem('fieldshift_theme', value);
    }
  };

  // Multi-field update tracking
  const handleFieldChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setFormSettings((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSaveMultiFieldSettings = () => {
    onSaveSettings(formSettings);
    setIsDirty(false);
    showToast('Preferences updated and persisted.');
  };

  const handleDiscardChanges = () => {
    setFormSettings(settings);
    setIsDirty(false);
    showToast('Changes discarded.');
  };

  // Profile Save
  const handleSaveProfile = () => {
    if (currentUser) {
      onUpdateUser({
        ...currentUser,
        name: profileName,
        email: profileEmail,
        role: profileRole,
        organization: profileOrg,
      });
      setIsProfileDirty(false);
      showToast('Agronomist profile saved.');
    }
  };

  // Backup Export
  const handleExportBackup = () => {
    const json = exportAllFarmsBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fieldshift_portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Farm portfolio exported successfully.');
  };

  // Backup Import
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importFarmsBackup(content);
      if (res.success) {
        setImportStatus({
          success: true,
          msg: `Successfully restored ${res.importedCount} farm(s). Refreshing workspace...`,
        });
        setTimeout(() => window.location.reload(), 1400);
      } else {
        setImportStatus({
          success: false,
          msg: `Import failed: ${res.error || 'Invalid file format'}`,
        });
      }
    };
    reader.readAsText(file);
  };

  // Live Ping Test Action
  const runPingTest = async (serviceKey: string) => {
    setPingResults((prev) => ({
      ...prev,
      [serviceKey]: { ...prev[serviceKey], status: 'testing' },
    }));

    try {
      const res = await fetch(`/api/health-ping?service=${serviceKey}`);
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setPingResults((prev) => ({
          ...prev,
          [serviceKey]: {
            ...prev[serviceKey],
            status: 'ok',
            latencyMs: data.latencyMs,
            statusCode: data.statusCode,
            endpoint: data.endpoint,
            qualityFlag: data.qualityFlag,
            server: data.server,
          },
        }));
      } else {
        setPingResults((prev) => ({
          ...prev,
          [serviceKey]: {
            ...prev[serviceKey],
            status: 'error',
            latencyMs: data.latencyMs,
            statusCode: res.status,
            error: data.message || 'Service returned error',
          },
        }));
      }
    } catch (err: any) {
      setPingResults((prev) => ({
        ...prev,
        [serviceKey]: {
          ...prev[serviceKey],
          status: 'error',
          error: err?.message || 'Network fetch timeout',
        },
      }));
    }
  };

  // Dangerous Operation Confirmation Handler
  const handleConfirmDangerousAction = () => {
    if (!dangerousModal) return;

    if (dangerousModal.type === 'clear_farms' || dangerousModal.type === 'reset_all') {
      resetAllLocalData();
      showToast('All local farm and analysis data wiped.');
      setTimeout(() => window.location.reload(), 1000);
    } else if (dangerousModal.type === 'delete_reports') {
      try {
        localStorage.removeItem('fieldshift_deep_analysis_logs');
      } catch {
        // ignore
      }
      showToast('Historical analysis report logs deleted.');
    }

    setDangerousModal(null);
  };

  // Nav Rail Items
  const railItems: { id: SettingsSectionId; label: string; icon: any; scope: string }[] = [
    { id: 'display', label: 'Preferences & Display', icon: Sliders, scope: 'This device' },
    { id: 'units', label: 'Units & Time', icon: Clock, scope: 'This workspace' },
    { id: 'defaults', label: 'Farm Defaults', icon: Sprout, scope: 'This farm' },
    { id: 'notifications', label: 'Notifications', icon: Bell, scope: 'This device' },
    { id: 'privacy', label: 'Privacy & Data', icon: ShieldCheck, scope: 'This workspace' },
    { id: 'automation', label: 'Automation & Cadence', icon: Activity, scope: 'Scheduled analysis' },
    { id: 'connectors', label: 'Connected Services', icon: Globe, scope: 'Live status' },
    { id: 'account', label: 'Agronomist Account', icon: User, scope: 'This profile' },
    { id: 'export', label: 'Export & Deletion', icon: Database, scope: 'Dangerous actions' },
    { id: 'about', label: 'About & Methodology', icon: Info, scope: 'v8.0 Engine' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#102319] border border-[#27D7B2] text-white text-sm font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-[#27D7B2]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header: 30–34px title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {previousTabTitle}</span>
            </button>
            <span className="text-xs font-mono text-slate-400">/ Preferences &amp; Data Center</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-[#27D7B2]" />
            <span>Settings &amp; Workspace Preferences</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Grouped preferences workspace • Display depth, telemetry provenance, and offline data backups
          </p>
        </div>

        {/* Global Simple / Advanced Toggle Banner in Header */}
        <div className="flex items-center bg-black/40 border border-white/15 rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => handleImmediateSettingChange('viewMode', 'simple')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              formSettings.viewMode === 'simple'
                ? 'bg-[#27D7B2] text-[#07130C] font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Simple Mode
          </button>
          <button
            type="button"
            onClick={() => handleImmediateSettingChange('viewMode', 'advanced')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              formSettings.viewMode === 'advanced'
                ? 'bg-[#27D7B2] text-[#07130C] font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Advanced Mode</span>
            <Sparkles className="w-3 h-3 text-[#73CAD0]" />
          </button>
        </div>
      </div>

      {/* Main Layout: Left Navigation Rail (220–250px) + Right Content Pane */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Rail (collapses to segmented control at 768px, stacks at 430px) */}
        <aside className="md:col-span-4 lg:col-span-3 space-y-1 bg-black/30 md:bg-transparent p-2 md:p-0 rounded-2xl border border-white/10 md:border-none">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 px-3 py-1.5 hidden md:block">
            Settings Sections
          </div>
          <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1 scrollbar-none">
            {railItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#27D7B2] text-[#07130C] font-bold shadow-md shadow-[#27D7B2]/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-[#07130C]/20 text-[#07130C]' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {item.scope}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Settings Content Pane (Solid surface --fs-surface-solid, 1px neutral dividers) */}
        <div className="md:col-span-8 lg:col-span-9 rounded-2xl bg-[#102319] border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* ============================================================= */}
          {/* SECTION 1: PREFERENCES & DISPLAY                             */}
          {/* ============================================================= */}
          {activeSection === 'display' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#27D7B2]" />
                    <span>Preferences &amp; Presentation Display</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Controls display depth, visual theme, and motion preferences. Does not alter mathematical calculations.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  Scope: This device
                </span>
              </div>

              {/* View Mode Toggle with Depth Explanation */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#27D7B2] block">
                  Presentation Mode (Display Depth)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleImmediateSettingChange('viewMode', 'simple')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      formSettings.viewMode === 'simple'
                        ? 'bg-[#27D7B2]/10 border-[#27D7B2] ring-1 ring-[#27D7B2]/30'
                        : 'bg-black/20 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span>Simple Farmer Mode</span>
                      {formSettings.viewMode === 'simple' && <Check className="w-4 h-4 text-[#27D7B2]" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Curated recommendations, plain-language summaries, traffic-light status indicators, and glanceable daily trackers.
                    </p>
                  </div>

                  <div
                    onClick={() => handleImmediateSettingChange('viewMode', 'advanced')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      formSettings.viewMode === 'advanced'
                        ? 'bg-[#27D7B2]/10 border-[#27D7B2] ring-1 ring-[#27D7B2]/30'
                        : 'bg-black/20 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span className="flex items-center gap-1.5">
                        <span>Advanced Agronomist Mode</span>
                        <Sparkles className="w-3.5 h-3.5 text-[#73CAD0]" />
                      </span>
                      {formSettings.viewMode === 'advanced' && <Check className="w-4 h-4 text-[#27D7B2]" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Full radar suitability breakdowns, NDVI satellite indices, soil moisture strata, ET0 physics, and execution trace logs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Theme Selection */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#27D7B2] block">
                  Visual Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'cyan-dark', name: 'Dark Navy / Forest', color: '#27D7B2' },
                    { id: 'emerald-dark', name: 'Emerald Dark', color: '#10B981' },
                    { id: 'solar-amber', name: 'Solar Amber', color: '#F59E0B' },
                    { id: 'high-contrast', name: 'High Contrast', color: '#38BDF8' },
                  ].map((th) => {
                    const active = (formSettings.theme || 'cyan-dark') === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => handleImmediateSettingChange('theme', th.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-white/10 border-[#27D7B2] ring-1 ring-[#27D7B2]/30'
                            : 'bg-black/20 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: th.color }} />
                        <div className="text-xs font-semibold text-white">{th.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reduced Motion & Map Layer */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Reduced Motion Preference</div>
                    <div className="text-xs text-slate-400">Minimizes smooth camera zooms and background particle drift.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!formSettings.reducedMotion}
                    onChange={(e) => handleImmediateSettingChange('reducedMotion', e.target.checked)}
                    className="w-4 h-4 rounded accent-[#27D7B2] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <div className="text-sm font-semibold text-white">Default Map Base Layer</div>
                    <div className="text-xs text-slate-400">Initial tile provider loaded when opening geospatial tools.</div>
                  </div>
                  <select
                    value={formSettings.defaultMapLayer || 'satellite'}
                    onChange={(e) => handleImmediateSettingChange('defaultMapLayer', e.target.value as any)}
                    className="bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#27D7B2]"
                  >
                    <option value="satellite">ESRI World Imagery (High-Res Satellite)</option>
                    <option value="streets">OpenStreetMap Standard</option>
                    <option value="hybrid">Satellite + Boundaries Hybrid</option>
                    <option value="topographic">Topographic Terrain Elevation</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION 2: UNITS & TIME                                       */}
          {/* ============================================================= */}
          {activeSection === 'units' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#27D7B2]" />
                    <span>Unit Conventions &amp; Timezone</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Field Shift converts units at the render display layer. Canonical stored numbers remain metric to ensure zero calculation drift.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  Scope: This workspace
                </span>
              </div>

              {/* Unit System Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('units', 'metric');
                    handleFieldChange('landUnit', 'ha');
                    handleFieldChange('tempUnit', 'c');
                    handleFieldChange('waterUnit', 'mm');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    formSettings.units === 'metric'
                      ? 'bg-[#27D7B2]/10 border-[#27D7B2]'
                      : 'bg-black/20 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>Global Metric (Global Standard)</span>
                    {formSettings.units === 'metric' && <Check className="w-4 h-4 text-[#27D7B2]" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Hectares (ha), Celsius (°C), Millimeters (mm), Kilograms per hectare (kg/ha).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('units', 'imperial');
                    handleFieldChange('landUnit', 'ac');
                    handleFieldChange('tempUnit', 'f');
                    handleFieldChange('waterUnit', 'in');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    formSettings.units === 'imperial'
                      ? 'bg-[#27D7B2]/10 border-[#27D7B2]'
                      : 'bg-black/20 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>US Customary / Imperial</span>
                    {formSettings.units === 'imperial' && <Check className="w-4 h-4 text-[#27D7B2]" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Acres (ac), Fahrenheit (°F), Inches (in), Bushels per acre (bu/ac).
                  </p>
                </button>
              </div>

              {/* Timezone & Locale */}
              <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Display Timezone
                  </label>
                  <select
                    value={formSettings.timezone || 'local'}
                    onChange={(e) => handleFieldChange('timezone', e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#27D7B2]"
                  >
                    <option value="local">Local Device Timezone (Automatic)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                    <option value="America/Chicago">US Central (America/Chicago)</option>
                    <option value="America/Denver">US Mountain (America/Denver)</option>
                    <option value="America/New_York">US Eastern (America/New_York)</option>
                    <option value="Europe/London">Europe / London (GMT/BST)</option>
                    <option value="Asia/Dubai">Arabian Standard Time (Asia/Dubai)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Timezone changes recompute displayed local dates without rewriting absolute UTC report timestamps.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Locale Formatting
                  </label>
                  <select
                    value={formSettings.locale || 'en-US'}
                    onChange={(e) => handleFieldChange('locale', e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#27D7B2]"
                  >
                    <option value="en-US">English (United States) — MM/DD/YYYY</option>
                    <option value="en-GB">English (International) — DD/MM/YYYY</option>
                    <option value="es-ES">Español — DD/MM/AAAA</option>
                    <option value="fr-FR">Français — JJ/MM/AAAA</option>
                  </select>
                </div>
              </div>

              {/* Save / Discard Bar for Multi-Field changes */}
              {isDirty && (
                <div className="pt-4 border-t border-white/10 flex items-center justify-between bg-black/30 p-3.5 rounded-xl">
                  <span className="text-xs text-[#E6B86A] font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Unsaved unit &amp; timezone changes</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDiscardChanges}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-300 transition-colors cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMultiFieldSettings}
                      className="px-4 py-1.5 rounded-lg bg-[#27D7B2] text-[#07130C] font-bold text-xs transition-colors hover:bg-[#52E2C3] cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION 3: FARM DEFAULTS                                      */}
          {/* ============================================================= */}
          {activeSection === 'defaults' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-[#27D7B2]" />
                    <span>Farm Defaults &amp; Inherited Practice Scope</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Define default baseline properties applied when creating new fields or initializing rotation analyses.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  Scope: This farm
                </span>
              </div>

              {/* Default Farm Selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Default Active Farm Parcel
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {farms.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => {
                        if (onSelectFarmId) onSelectFarmId(f.id);
                        showToast(`Active default set to: ${f.name}`);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        f.id === activeFarmId
                          ? 'bg-[#27D7B2]/10 border-[#27D7B2] ring-1 ring-[#27D7B2]/30'
                          : 'bg-black/20 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="font-semibold text-white flex items-center justify-between">
                        <span>{f.name}</span>
                        {f.id === activeFarmId && <Check className="w-4 h-4 text-[#27D7B2]" />}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {f.locationName} • {f.fields?.length || 1} fields
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inherited Agronomic Practice Defaults */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#27D7B2]">
                  New Parcel Initialization Defaults
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-1">
                    <span className="text-slate-400 block">Default Irrigation:</span>
                    <strong className="text-white">Rain-fed (No supplemental)</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-1">
                    <span className="text-slate-400 block">Priority Balancer:</span>
                    <strong className="text-white">Anti-domination clamped (5% - 40%)</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-1">
                    <span className="text-slate-400 block">Horizon Length:</span>
                    <strong className="text-white">Auto (Optimal Agronomic Cycle)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION 4: NOTIFICATIONS                                      */}
          {/* ============================================================= */}
          {activeSection === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#27D7B2]" />
                    <span>Notification &amp; Environmental Alert Triggers</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure alert thresholds, report-ready triggers, and quiet hours. Critical active alerts cannot be silently hidden.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  Scope: This device
                </span>
              </div>

              {/* In-app & Browser Alerts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/20 border border-white/10">
                  <div>
                    <div className="text-sm font-semibold text-white">In-App Environmental Bell Alerts</div>
                    <div className="text-xs text-slate-400">Shows unread count badge and drawer items when moisture or heat deviates.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formSettings.inAppAlertsEnabled !== false}
                    onChange={(e) => handleImmediateSettingChange('inAppAlertsEnabled', e.target.checked)}
                    className="w-4 h-4 rounded accent-[#27D7B2] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/20 border border-white/10">
                  <div>
                    <div className="text-sm font-semibold text-white">High Sensitivity Satellite Anomaly Detection</div>
                    <div className="text-xs text-slate-400">Trigger moisture stress warnings at 15% deviation vs. 25% standard baseline.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formSettings.alertSensitivity === 'high'}
                    onChange={(e) => handleImmediateSettingChange('alertSensitivity', e.target.checked ? 'high' : 'standard')}
                    className="w-4 h-4 rounded accent-[#27D7B2] cursor-pointer"
                  />
                </div>
              </div>

              {/* Alert Category Preferences */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#27D7B2]">
                  Monitored Environmental Risk Categories
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    { key: 'moistureDrop', label: 'Soil Moisture Deficit (Drying Out)' },
                    { key: 'heatAnomaly', label: 'Midday Heat Anomaly (+3°C above baseline)' },
                    { key: 'rainfallDeficit', label: 'Precipitation Shortfall (Hold fertilizer)' },
                    { key: 'ndviStress', label: 'Regional Ecozone Vegetative Vigor Stress' },
                    { key: 'reportsReady', label: 'Deep Analysis Completion & Ready Reports' },
                    { key: 'taskReminders', label: 'Field Operations & Scouting Reminders' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 p-3 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:border-white/20"
                    >
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 rounded accent-[#27D7B2] cursor-pointer"
                      />
                      <span className="text-slate-200">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Quiet Hours (22:00 – 06:00)</div>
                  <div className="text-xs text-slate-400">Silences non-critical sound notifications during night hours.</div>
                </div>
                <input
                  type="checkbox"
                  checked={!!formSettings.quietHours?.enabled}
                  onChange={(e) =>
                    handleImmediateSettingChange('quietHours', {
                      enabled: e.target.checked,
                      start: '22:00',
                      end: '06:00',
                    })
                  }
                  className="w-4 h-4 rounded accent-[#27D7B2] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION 5: PRIVACY & DATA SOVEREIGNTY                         */}
          {/* ============================================================= */}
          {activeSection === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#27D7B2]" />
                    <span>Privacy Architecture &amp; Data Sovereignty</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Field Shift operates local-first. We explicitly outline what stays on this device versus what touches external APIs.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  Scope: This workspace
                </span>
              </div>

              {/* Privacy Breakdown Cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-black/30 border border-[#78C78B]/30 space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#78C78B] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>What Stays Strictly Local on This Device</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4 leading-relaxed">
                    <li>All farm parcel polygon geometries, GPS coordinates, and exclusion zones.</li>
                    <li>Farmer scouting notes, irrigation activity logs, and decision event records.</li>
                    <li>What-If scenario experiments and isolated stress sandbox results.</li>
                    <li>Operator profile credentials, preferences, and interface mode state.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-[#73CAD0]/30 space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#73CAD0] flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    <span>What Remote Providers Receive (Minimal Point Telemetry)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4 leading-relaxed">
                    <li><strong>NASA POWER:</strong> Anonymous point latitude/longitude to fetch 10-year solar and rainfall arrays.</li>
                    <li><strong>Open-Meteo:</strong> Coordinate point query for 7-day numerical forecast. No user account attached.</li>
                    <li><strong>Gemini GenAI:</strong> Selected crop parameters (soil texture, irrigation type) to formulate agronomic rationale. Never includes financial records, tenant data, or full archives.</li>
                  </ul>
                </div>
              </div>

              {/* Public Sharing / Cloud Sync Notice */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Public Regional Aggregation Sharing</div>
                    <div className="text-xs text-slate-400">
                      Anonymized ecozone soil health sharing. Off by default. You can revoke consent anytime.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!formSettings.publicSharingEnabled}
                    onChange={(e) => handleImmediateSettingChange('publicSharingEnabled', e.target.checked)}
                    className="w-4 h-4 rounded accent-[#27D7B2] cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-400 space-y-1.5">
                  <div className="font-semibold text-white">Data Storage Boundary &amp; Profile Scope</div>
                  <p>
                    Field Shift stores farm models and records in your browser&apos;s local profile storage (<code>localStorage</code>). This provides complete on-device sovereignty without requiring an external cloud server, but it is <strong>browser-profile storage</strong> rather than an authenticated multi-tenant account system.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Anyone using this same local operating system browser profile has access to these records. If using a shared workstation, export your farm archive using the Backup tool and clear local records when finished.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION 6: AUTOMATION & SCHEDULING                            */}
          {/* ============================================================= */}
          {activeSection === 'automation' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#27D7B2]" />
                    <span>Automation &amp; Scheduled Analysis</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Schedule periodic checks to detect moisture stress, thermal shifts, and disease risks automatically upon startup.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  Scope: Scheduled analysis
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <Clock className="w-4 h-4" />
                  <span>Local-Only Execution Boundary</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Field Shift operates locally in your browser. Scheduled checks execute automatically while the application is active. Missed due intervals are caught up upon your next launch.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Enable Periodic Deep Analysis Check</div>
                    <div className="text-xs text-slate-400">Silently verifies 10-year NASA anomalies if scheduled interval has elapsed.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={
                      typeof formSettings.autoScheduler === 'object'
                        ? formSettings.autoScheduler.enabled
                        : !!formSettings.autoScheduler
                    }
                    onChange={(e) =>
                      handleImmediateSettingChange('autoScheduler', {
                        enabled: e.target.checked,
                        intervalDays:
                          typeof formSettings.autoScheduler === 'object'
                            ? formSettings.autoScheduler.intervalDays
                            : 1,
                      })
                    }
                    className="w-4 h-4 rounded accent-[#27D7B2] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Check Cadence Frequency
                  </label>
                  <select
                    value={
                      typeof formSettings.autoScheduler === 'object'
                        ? formSettings.autoScheduler.intervalDays
                        : 1
                    }
                    onChange={(e) =>
                      handleImmediateSettingChange('autoScheduler', {
                        enabled: true,
                        intervalDays: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-64 bg-black/40 border border-white/15 text-xs text-white rounded-xl p-2.5 focus:border-[#27D7B2] focus:outline-none"
                  >
                    <option value={1}>Every 24 Hours (Daily)</option>
                    <option value={3}>Every 3 Days</option>
                    <option value={7}>Weekly (Every 7 Days)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION 7: CONNECTED SERVICES (REAL LIVE PINGS)                */}
          {/* ============================================================= */}
          {activeSection === 'connectors' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#27D7B2]" />
                    <span>Connected Remote Services &amp; Live Connectivity</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live connection test against remote observation endpoints. Zero simulated or mock statuses.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  Scope: Live status
                </span>
              </div>

              {/* Service Cards with Ping Buttons */}
              <div className="space-y-3">
                {[
                  {
                    key: 'nasa_power',
                    title: 'NASA POWER Temporal Climatology',
                    desc: 'Solar irradiance, historical rainfall, GDD, and thermal anomalies from NASA Langley.',
                    auth: 'Public Domain / Free Keyless (NASA EOSDIS)',
                  },
                  {
                    key: 'open_meteo',
                    title: 'Open-Meteo High-Resolution Numerical Forecast',
                    desc: 'Real-time hourly temperature, humidity, wind, and 7-day ECMWF/DWD ensemble outlook.',
                    auth: 'Free Non-Commercial Tier (CC-BY 4.0)',
                  },
                  {
                    key: 'gemini_ai',
                    title: 'Google Gemini GenAI Model (Interactions SDK)',
                    desc: 'Agronomic rationale synthesis, multi-season sequence explanation, and practice parsing.',
                    auth: 'Server-side Environment Variable (GEMINI_API_KEY)',
                  },
                  {
                    key: 'esri_imagery',
                    title: 'ESRI World Imagery Map Server',
                    desc: 'High-resolution sub-meter orbital satellite orthophotos for field boundary drawing.',
                    auth: 'Public MapServer Tile Service',
                  },
                ].map((srv) => {
                  const ping = pingResults[srv.key];
                  return (
                    <div
                      key={srv.key}
                      className="p-4 rounded-xl bg-black/30 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white truncate">{srv.title}</h4>
                          {ping?.status === 'ok' && (
                            <span className="text-[10px] font-mono bg-[#78C78B]/20 text-[#78C78B] px-2 py-0.5 rounded border border-[#78C78B]/30 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>{ping.latencyMs}ms</span>
                            </span>
                          )}
                          {ping?.status === 'error' && (
                            <span className="text-[10px] font-mono bg-[#E97971]/20 text-[#E97971] px-2 py-0.5 rounded border border-[#E97971]/30">
                              Offline ({ping.error})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{srv.desc}</p>
                        <div className="text-[11px] font-mono text-slate-500 mt-1">{srv.auth}</div>
                      </div>

                      <button
                        type="button"
                        disabled={ping?.status === 'testing'}
                        onClick={() => runPingTest(srv.key)}
                        className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-40 flex items-center justify-center gap-1.5"
                      >
                        {ping?.status === 'testing' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#27D7B2]" />
                            <span>Pinging...</span>
                          </>
                        ) : (
                          <span>Test Live Ping</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION 8: AGRONOMIST ACCOUNT                                 */}
          {/* ============================================================= */}
          {activeSection === 'account' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-[#27D7B2]" />
                    <span>Agronomist Profile &amp; Account Identity</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Operator credentials associated with field decision logs and routine task assignments.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  Scope: This profile
                </span>
              </div>

              {/* Profile Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Full Name / Operator Handle
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => {
                      setProfileName(e.target.value);
                      setIsProfileDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-[#27D7B2]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => {
                      setProfileEmail(e.target.value);
                      setIsProfileDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-[#27D7B2]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Professional Role
                  </label>
                  <input
                    type="text"
                    value={profileRole}
                    onChange={(e) => {
                      setProfileRole(e.target.value);
                      setIsProfileDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-[#27D7B2]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Organization / Farm Entity
                  </label>
                  <input
                    type="text"
                    value={profileOrg}
                    onChange={(e) => {
                      setProfileOrg(e.target.value);
                      setIsProfileDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-[#27D7B2]"
                  />
                </div>
              </div>

              {/* Data Isolation Rule when Switching Accounts */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-white">Zero Data Leakage on Switch</div>
                <p>
                  When switching user profiles, the workspace guarantees previous operators&apos; farm records are never displayed for even one frame.
                </p>
                {onOpenSignIn && (
                  <button
                    type="button"
                    onClick={onOpenSignIn}
                    className="mt-2 text-[#27D7B2] font-semibold hover:underline block cursor-pointer"
                  >
                    Switch or Add Agronomist Account →
                  </button>
                )}
              </div>

              {/* Profile Save Button */}
              {isProfileDirty && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="px-5 py-2 rounded-xl bg-[#27D7B2] text-[#07130C] font-bold text-xs hover:bg-[#52E2C3] transition-colors cursor-pointer"
                  >
                    Update Profile Credentials
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION 9: EXPORT & DELETION (SEPARATED DANGEROUS ACTIONS)    */}
          {/* ============================================================= */}
          {activeSection === 'export' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#27D7B2]" />
                    <span>Disaster Recovery &amp; Dangerous Operations</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Export offline archives or execute granular, auditable destructive operations with exact record scopes.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Destructive controls
                </span>
              </div>

              {importStatus && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-mono ${
                    importStatus.success
                      ? 'bg-[#78C78B]/20 text-[#78C78B] border border-[#78C78B]/40'
                      : 'bg-[#E97971]/20 text-[#E97971] border border-[#E97971]/40'
                  }`}
                >
                  {importStatus.msg}
                </div>
              )}

              {/* Backup & Restore Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Download className="w-4 h-4 text-[#27D7B2]" />
                    <span>Export Farm Portfolio (JSON)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Downloads an offline backup containing all {farms.length} saved farms, field boundaries, scouting notes, and rotation plans.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#27D7B2]" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Upload className="w-4 h-4 text-[#73CAD0]" />
                    <span>Restore / Import Portfolio</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Merge or restore a previously saved JSON backup. Existing unchanged records are safely preserved without overwriting.
                  </p>
                  <label className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4 text-[#73CAD0]" />
                    <span>Select Backup File (.json)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Granular Separated Dangerous Actions */}
              <div className="pt-4 border-t border-rose-500/20 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Separated Dangerous Operations</span>
                </div>

                <div className="space-y-2">
                  {/* Action 1: Clear Local Farm Data */}
                  <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">Clear Local Farm Records</div>
                      <div className="text-xs text-slate-400">
                        Deletes {farms.length} saved parcel boundaries and field configurations on this device.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDangerousModal({
                          isOpen: true,
                          type: 'clear_farms',
                          title: 'Clear Local Farm Data',
                          description:
                            'This will delete all saved farm polygons, field boundaries, and crop rotation plans from this browser.',
                          scope: 'This browser profile',
                          affectedCount: farms.length,
                          canRecover: false,
                        })
                      }
                      className="px-3.5 py-1.5 rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      Clear Farm Data
                    </button>
                  </div>

                  {/* Action 2: Delete Deep Analysis Reports */}
                  <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">Delete Historical Report Logs</div>
                      <div className="text-xs text-slate-400">
                        Wipes past executed Deep Analysis trace logs without removing farm parcel boundaries.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDangerousModal({
                          isOpen: true,
                          type: 'delete_reports',
                          title: 'Delete Deep Analysis Reports',
                          description:
                            'This will erase past dated execution trace runs and audit logs. Farm parcels and rotations will remain intact.',
                          scope: 'Analysis Log Store',
                          affectedCount: 1,
                          canRecover: false,
                        })
                      }
                      className="px-3.5 py-1.5 rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      Delete Reports
                    </button>
                  </div>

                  {/* Action 3: Complete Reset */}
                  <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-rose-300">Reset All Local Application Data</div>
                      <div className="text-xs text-slate-400">
                        Wipes all farms, preferences, What-If scenarios, and notification states back to pristine factory defaults.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDangerousModal({
                          isOpen: true,
                          type: 'reset_all',
                          title: 'Factory Reset All Data',
                          description:
                            'Permanently wipes all local farm records, What-If scenario branches, scouting logs, and custom preferences from this device.',
                          scope: 'Entire local browser storage',
                          affectedCount: farms.length,
                          canRecover: false,
                        })
                      }
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Reset All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION 10: ABOUT & METHODOLOGY                               */}
          {/* ============================================================= */}
          {activeSection === 'about' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#27D7B2]" />
                    <span>Scientific Methodology &amp; Engine Version</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Field Shift mathematical foundations and remote sensing specifications.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  Version 8.0 Deterministic
                </span>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
                  <h4 className="text-sm font-bold text-white">Algorithm &amp; Physics Foundations</h4>
                  <p>
                    Field Shift utilizes deterministic mathematical agronomy, combining FAO-56 Penman-Monteith dual crop coefficient evapotranspiration modeling, Baskerville-Emin thermal degree-day sine wave integration, and Baier-Robertson root-zone water balance equations.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
                  <h4 className="text-sm font-bold text-white">Crop Knowledge Base</h4>
                  <p>
                    Calibrated for arid, temperate, and sub-tropical agronomic ecozones across 12 primary cash crops, pulses, and cover sequences. Plant parameter thresholds (T_base, T_opt, drought factor p, root depths) derive from peer-reviewed agricultural research institutes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
                  <h4 className="text-sm font-bold text-white">Spatial Resolution Limitations</h4>
                  <p>
                    NASA POWER Climatology data is sampled at 0.5° × 0.5° grid cells (~50km). SMAP radiometer data is processed at 9km resolution. Local farm microclimates inside ravines or elevated hilltops may differ from orbital regional means.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DANGEROUS ACTION MODAL CONFIRMATION DIALOG (uses --fs-modal-surface, 96% opacity, 20px radius) */}
      {dangerousModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-2xl glass-modal border border-rose-500/40 shadow-2xl p-6 sm:p-7 space-y-5 text-[#F1F6EF]"
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {dangerousModal.title}
                </h3>
                <p className="text-xs text-rose-300 font-mono mt-0.5">
                  Scope: {dangerousModal.scope} • {dangerousModal.affectedCount} record(s) affected
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {dangerousModal.description}
            </p>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
              <div className="font-semibold text-white">Export before deleting:</div>
              <p className="text-slate-400">
                Recovery is NOT possible once cleared. We strongly recommend downloading a JSON backup first.
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-[#27D7B2] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup First</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDangerousModal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDangerousAction}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Yes, Execute Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

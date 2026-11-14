import React from 'react';
import {
  Settings,
  X,
  Sliders,
  Check,
  User,
  Bell,
  Database,
  Layers,
  Thermometer,
  Droplet,
} from 'lucide-react';
import { AppSettings, UserProfile } from '../../types';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onOpenSignIn: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  onSaveSettings,
  onOpenSignIn,
}) => {
  if (!isOpen) return null;

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onSaveSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[3px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl glass-modal border border-white/[0.18] shadow-2xl p-6 text-[#F0F7FA] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#27D7B2]/20 border border-[#27D7B2]/40 flex items-center justify-center text-[#27D7B2]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Platform Preferences</h3>
              <p className="text-xs text-slate-400">View mode, units &amp; data synchronization</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3.5 rounded-xl glass-card border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#27D7B2] text-[#020A10] font-bold text-sm flex items-center justify-center">
              {currentUser.avatarLetter}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{currentUser.name}</div>
              <div className="text-xs text-slate-400">{currentUser.role} • {currentUser.organization}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSignIn();
            }}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors cursor-pointer"
          >
            Switch
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Mode Selection */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Agronomic Interface Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateSetting('viewMode', 'simple')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer glass-card ${
                  settings.viewMode === 'simple'
                    ? 'border-[#27D7B2] ring-1 ring-[#27D7B2]/40 shadow-sm shadow-[#27D7B2]/20'
                    : 'glass-card-hover'
                }`}
              >
                <div className="font-semibold text-sm text-white flex items-center justify-between">
                  <span>Simple Mode</span>
                  {settings.viewMode === 'simple' && <Check className="w-4 h-4 text-[#27D7B2]" />}
                </div>
                <div className="text-slate-400 text-[11px] mt-1 leading-snug">
                  Curated metrics, clear traffic-light indicators and key action summaries.
                </div>
              </button>
              <button
                type="button"
                onClick={() => updateSetting('viewMode', 'advanced')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer glass-card ${
                  settings.viewMode === 'advanced'
                    ? 'border-[#27D7B2] ring-1 ring-[#27D7B2]/40 shadow-sm shadow-[#27D7B2]/20'
                    : 'glass-card-hover'
                }`}
              >
                <div className="font-semibold text-sm text-white flex items-center justify-between">
                  <span>Advanced Mode</span>
                  {settings.viewMode === 'advanced' && <Check className="w-4 h-4 text-[#27D7B2]" />}
                </div>
                <div className="text-slate-400 text-[11px] mt-1 leading-snug">
                  Full soil moisture strata, ET0 physics, Baskerville-Emin GDD, and scientific audit trails.
                </div>
              </button>
            </div>
          </div>

          {/* Unit Preferences */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Land Area</label>
              <div className="flex rounded-lg overflow-hidden border border-white/10 p-0.5 bg-black/30">
                <button
                  type="button"
                  onClick={() => updateSetting('landUnit', 'ha')}
                  className={`flex-1 py-1.5 font-semibold text-center rounded transition-colors cursor-pointer ${
                    settings.landUnit === 'ha' ? 'bg-[#27D7B2] text-[#020A10]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hectares (ha)
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('landUnit', 'ac')}
                  className={`flex-1 py-1.5 font-semibold text-center rounded transition-colors cursor-pointer ${
                    settings.landUnit === 'ac' ? 'bg-[#27D7B2] text-[#020A10]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Acres (ac)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Temperature</label>
              <div className="flex rounded-lg overflow-hidden border border-white/10 p-0.5 bg-black/30">
                <button
                  type="button"
                  onClick={() => updateSetting('tempUnit', 'c')}
                  className={`flex-1 py-1.5 font-semibold text-center rounded transition-colors cursor-pointer ${
                    settings.tempUnit === 'c' ? 'bg-[#27D7B2] text-[#020A10]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  °C
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('tempUnit', 'f')}
                  className={`flex-1 py-1.5 font-semibold text-center rounded transition-colors cursor-pointer ${
                    settings.tempUnit === 'f' ? 'bg-[#27D7B2] text-[#020A10]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  °F
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-medium">Rain / Water</label>
              <div className="flex rounded-lg overflow-hidden border border-white/10 p-0.5 bg-black/30">
                <button
                  type="button"
                  onClick={() => updateSetting('waterUnit', 'mm')}
                  className={`flex-1 py-1.5 font-semibold text-center rounded transition-colors cursor-pointer ${
                    settings.waterUnit === 'mm' ? 'bg-[#27D7B2] text-[#020A10]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  mm
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('waterUnit', 'in')}
                  className={`flex-1 py-1.5 font-semibold text-center rounded transition-colors cursor-pointer ${
                    settings.waterUnit === 'in' ? 'bg-[#27D7B2] text-[#020A10]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  inches
                </button>
              </div>
            </div>
          </div>

          {/* Sync Toggles */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Auto-Sync NASA POWER &amp; Open-Meteo</div>
                <div className="text-[11px] text-slate-400">Silently refresh climate data when switching farms</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSyncNasa}
                onChange={(e) => updateSetting('autoSyncNasa', e.target.checked)}
                className="w-4 h-4 rounded text-[#27D7B2] focus:ring-0 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <div className="font-semibold text-white">High Sensitivity Satellite Anomaly Alerts</div>
                <div className="text-[11px] text-slate-400">Trigger warnings at 15% deviation vs. 25% standard</div>
              </div>
              <input
                type="checkbox"
                checked={settings.alertSensitivity === 'high'}
                onChange={(e) => updateSetting('alertSensitivity', e.target.checked ? 'high' : 'standard')}
                className="w-4 h-4 rounded text-[#27D7B2] focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#3CCFB5] text-[#020A10] font-bold text-xs hover:brightness-110 shadow-lg shadow-[#27D7B2]/20 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

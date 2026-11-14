import { AppSettings, UserProfile } from '../types';

const STORAGE_KEY_SETTINGS = 'fieldshift_settings_v2';
const STORAGE_KEY_USER_PROFILE = 'fieldshift_user_profile_v2';

export const DEFAULT_USER: UserProfile = {
  id: 'user_bilal_abbasi',
  name: 'Bilal Abbasi',
  email: 'bilalaabbasi272011@gmail.com',
  organization: 'Al Marjan Agricultural Holdings',
  role: 'Lead Agronomist',
  avatarLetter: 'B',
};

export const DEFAULT_SETTINGS: AppSettings = {
  viewMode: 'simple',
  units: 'metric',
  landUnit: 'ha',
  tempUnit: 'c',
  waterUnit: 'mm',
  timezone: 'local',
  locale: 'en-US',
  theme: 'cyan-dark',
  reducedMotion: false,
  defaultMapLayer: 'satellite',
  autoSyncNasa: true,
  alertSensitivity: 'standard',
  emailAlerts: false,
  browserAlerts: true,
  inAppAlertsEnabled: true,
  autoScheduler: {
    enabled: true,
    intervalDays: 1,
  },
  dataSourcePreference: 'all',
  engineVersion: '8.0-deterministic',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '06:00',
  },
  notificationPreferences: {
    moistureDrop: true,
    heatAnomaly: true,
    rainfallDeficit: true,
    ndviStress: true,
    reportsReady: true,
    taskReminders: true,
    systemUpdates: true,
  },
  publicSharingEnabled: false,
  retainRecentSearches: true,
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return DEFAULT_USER;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

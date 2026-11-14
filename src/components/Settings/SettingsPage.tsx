import React from 'react';
import { AppSettings, SavedFarmPlan } from '../../types';
import { SettingsDashboardView } from './SettingsDashboardView';

export interface SettingsPageProps {
  settings: AppSettings;
  farms: SavedFarmPlan[];
  onUpdateSettings: (newSettings: AppSettings) => void;
  onDataReset?: () => void;
  activeFarmId?: string;
  onNavigateTab?: (tab: string) => void;
  onOpenSignIn?: () => void;
}

/**
 * SettingsPage canonical alignment wrapper.
 * Directly routes to SettingsDashboardView to maintain a single unified settings & privacy implementation.
 */
export const SettingsPage: React.FC<SettingsPageProps> = (props) => {
  return (
    <div className="w-full">
      <SettingsDashboardView
        settings={props.settings}
        onSaveSettings={props.onUpdateSettings}
        farms={props.farms}
        activeFarmId={props.activeFarmId}
        onSelectFarmId={props.activeFarmId ? () => {} : undefined}
        onOpenSignIn={props.onOpenSignIn}
      />
    </div>
  );
};

export default SettingsPage;

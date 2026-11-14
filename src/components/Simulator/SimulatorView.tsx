import React from 'react';
import { WhatIfSimulator } from './WhatIfSimulator';
import { SavedFarmPlan } from '../../types';

export interface SimulatorViewProps {
  farms: SavedFarmPlan[];
  activeFarmId: string;
  onSelectFarm: (farmId: string) => void;
  onOpenNewAnalysis: (farmId: string) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  farms,
  activeFarmId,
  onSelectFarm,
  onOpenNewAnalysis,
}) => {
  return (
    <WhatIfSimulator
      farms={farms}
      activeFarmId={activeFarmId}
      onSelectFarm={onSelectFarm}
      onOpenNewAnalysis={onOpenNewAnalysis}
    />
  );
};

import React from 'react';
import { Satellite, UserCheck, Cpu, AlertCircle, Database } from 'lucide-react';
import { ProvenanceSource } from '../../types';

interface ProvenanceTagProps {
  source?: ProvenanceSource | 'FARMER_CONFIRMED' | 'ESTIMATED';
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export const ProvenanceTag: React.FC<ProvenanceTagProps> = ({
  source = 'CALCULATED',
  label,
  className = '',
  showIcon = true,
}) => {
  let colorClass = 'text-[#5EEAD4]'; // mint calculated default
  let displayLabel = label || 'Calculated';
  let Icon = Cpu;

  switch (source) {
    case 'NASA_POWER':
      colorClass = 'text-[#38BDF8]';
      displayLabel = label || 'NASA · POWER';
      Icon = Satellite;
      break;
    case 'NASA_SMAP':
      colorClass = 'text-[#38BDF8]';
      displayLabel = label || 'NASA · SMAP';
      Icon = Satellite;
      break;
    case 'NASA_MODIS':
      colorClass = 'text-[#38BDF8]';
      displayLabel = label || 'NASA · MODIS';
      Icon = Satellite;
      break;
    case 'NASA_NASADEM':
      colorClass = 'text-[#38BDF8]';
      displayLabel = label || 'NASA · NASADEM';
      Icon = Satellite;
      break;
    case 'NASA_GPM':
      colorClass = 'text-[#38BDF8]';
      displayLabel = label || 'NASA · GPM IMERG';
      Icon = Satellite;
      break;
    case 'ISRIC_SOILGRIDS':
      colorClass = 'text-[#38BDF8]';
      displayLabel = label || 'ISRIC · SoilGrids';
      Icon = Database;
      break;
    case 'FARMER':
    case 'FARMER_CONFIRMED':
      colorClass = 'text-[#B7A6FF]';
      displayLabel = label || 'You provided this';
      Icon = UserCheck;
      break;
    case 'DEMO':
      colorClass = 'text-[#FBBF24]';
      displayLabel = label || 'Demo pattern';
      Icon = AlertCircle;
      break;
    case 'ESTIMATED':
    case 'REGIONAL_PRIOR':
      colorClass = 'text-amber-400/90';
      displayLabel = label || 'Estimated';
      Icon = AlertCircle;
      break;
    case 'CALCULATED':
    default:
      colorClass = 'text-[#5EEAD4]';
      displayLabel = label || 'Calculated';
      Icon = Cpu;
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-mono tracking-tight font-medium ${colorClass} ${className}`}
      title={`Data source: ${displayLabel}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />}
      <span>{displayLabel}</span>
    </span>
  );
};

import { SavedFarmPlan, FieldBoundaryItem, AppUnits } from '../../types';

export type MapMode = 'explore' | 'edit' | 'inspect' | 'regional';

export type EditorSubState =
  | 'viewing'
  | 'drawing'
  | 'draft_valid'
  | 'draft_invalid'
  | 'editing_vertices'
  | 'validating'
  | 'save_pending'
  | 'saved'
  | 'save_failed';

export type DrawTool = 'polygon' | 'rectangle' | 'exclusion';

export type BasemapType = 'satellite' | 'street' | 'terrain' | 'dark';

export type InspectorTab = 'overview' | 'layers' | 'inspect' | 'compare' | 'regional';

export type LayerId =
  | 'boundaries'
  | 'labels'
  | 'exclusions'
  | 'ndvi'
  | 'evi'
  | 'moisture'
  | 'precip'
  | 'et0'
  | 'soil_texture'
  | 'elevation'
  | 'regional_network';

export interface LayerMetadata {
  id: LayerId;
  name: string;
  category: 'basemap' | 'boundaries' | 'vegetation' | 'water_weather' | 'soil_terrain' | 'regional';
  source: string;
  product: string;
  resolution: string;
  units: string;
  dateWindow: string;
  status: 'available' | 'loading' | 'unavailable' | 'stale';
  caveat: string;
  paletteEndpoints?: {
    min: string;
    mid?: string;
    max: string;
    minLabel: string;
    maxLabel: string;
  };
}

export interface InspectedPixel {
  lat: number;
  lon: number;
  fieldName?: string;
  fieldAreaHa?: number;
  cropName?: string;
  layerValues: Record<
    string,
    {
      label: string;
      value: string;
      unit: string;
      quality: string;
      resolution: string;
    }
  >;
  retrievedAt: string;
}

export interface RegionalCohort {
  id: string;
  name: string;
  city: string;
  country: string;
  centroid: [number, number];
  farmCount: number;
  isPrivacyCompliant: boolean; // minimum 5 farms mandatory
  avgSoilOrganicMatterPct: number;
  coverCropAdoptionPct: number;
  moistureRetentionEfficiencyPct: number;
  dominantRotation: string;
  waterSourceMix: string;
  publicProfiles: Array<{
    id: string;
    displayName: string;
    verifiedPractices: string[];
    rotationSummary: string;
    sharedSince: string;
    waterStrategy: string;
  }>;
}

export interface MapsWorkspaceProps {
  farms: SavedFarmPlan[];
  activeFarmId: string;
  onSelectFarm: (farmId: string) => void;
  onOpenFarmView: (farmId: string, fieldId?: string) => void;
  onOpenCropRotation: (farmId: string, fieldId?: string) => void;
  onOpenDeepAnalysis?: (farmId: string, fieldId?: string) => void;
  onSaveFarmBoundary?: (
    farmId: string,
    fieldId: string | undefined,
    fieldName: string,
    coordinates: [number, number][],
    areaM2: number,
    areaHa: number,
    perimeterM: number,
    exclusions?: [number, number][][]
  ) => void;
  onCreateFarmFromBoundary?: (
    farmName: string,
    coordinates: [number, number][],
    areaM2: number,
    areaHa: number,
    perimeterM: number
  ) => SavedFarmPlan;
  onDeleteFarm?: (farmId: string) => void;
  onRemoveBoundary?: (farmId: string, fieldId?: string) => void;
  units?: AppUnits;
  isAdvanced?: boolean;
}

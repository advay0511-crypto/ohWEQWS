export type ProvenanceSource =
  | 'NASA_POWER'
  | 'NASA_SMAP'
  | 'NASA_MODIS'
  | 'NASA_NASADEM'
  | 'NASA_GPM'
  | 'ISRIC_SOILGRIDS'
  | 'FARMER'
  | 'CROP_DB'
  | 'CALCULATED'
  | 'DEMO'
  | 'REGIONAL_PRIOR'
  | 'OPEN_METEO_LIVE';

export type AppUnits = 'metric' | 'imperial';

export interface DataCoverageInfo {
  coveragePct?: number;
  percentage?: number;
  level?: ConfidenceLevel | string;
  validVariablesCount?: number;
  totalVariablesCount?: number;
  sourcesUsed?: string[];
  missingSources?: string[];
  freshnessLabel?: string;
  spatialResolutionLabel?: string;
  isImputed?: boolean;
  description?: string;
}

export interface DomainUndoAction {
  id: string;
  type?: string;
  description: string;
  timestamp: number;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

export interface DeepAnalysisFinding {
  id: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical' | 'positive' | 'caution' | string;
  title: string;
  detail?: string;
  description?: string;
  fieldName?: string;
  source?: string;
  confidence?: string;
  recommendation?: string;
  evidence?: any;
  observationDate?: string;
  dueWindow?: any;
}

export interface DeepAnalysisReport {
  id: string;
  farmId: string;
  farmName: string;
  fieldId?: string;
  fieldName?: string;
  scope?: string;
  runAt?: string;
  trigger?: string;
  summaryText?: string;
  overallStatus?: string;
  durationMs?: number;
  traceEvents?: any[];
  recommendationConfidence?: string;
  dataCoverage?: any;
  recommendations?: any[];
  whatChangedSinceLastRun?: any[];
  strengths?: any[];
  concerns?: any[];
  dataLimitations?: any[];
  generatedAt?: string;
  createdAt?: string;
  overallScore?: number;
  overallStatusReason?: string;
  summaryStatus?: string;
  summaryHeadline?: string;
  fieldsAssessedCount?: number;
  confidence?: string;
  dataReadinessPct?: number;
  fieldReports?: any[];
  fieldResults?: any[];
  status?: string;
  watchPoints?: any[];
  fieldsNeedingAttentionCount?: number;
  calculationsSnapshot?: any;
  changesSinceLastReport?: any;
  metadataSnapshot?: any;
  managementRoutineConfirmed?: boolean | any;
  recommendedActions?: any[];
  findings?: DeepAnalysisFinding[];
  provenanceTraces?: any[];
  farmContextSnapshot?: {
    farmName: string;
    locationName: string;
    lat?: number;
    lon?: number;
    fieldSizeHa?: number;
    soilTexture?: string;
    irrigationMode?: string;
    soilPh?: number | null;
    hasSoilLabTest?: boolean;
    fields?: Array<{
      id: string;
      name: string;
      areaHa: number;
      areaAcres?: number;
      perimeterM?: number;
      currentCrop?: string;
      stage?: string;
      soilTexture?: string;
      pH?: number;
      irrigationMethod?: string;
      polygon?: [number, number][];
    }>;
    rotations?: RotationResult[];
    climateData?: ClimateObservation;
  };
  telemetrySnapshot?: Array<{
    key: string;
    label: string;
    value: string;
    unit: string;
    source: string;
    status: 'observed' | 'sourced' | 'calculated' | 'estimated' | 'demo' | 'unavailable';
    note?: string;
    timestamp?: string;
  }>;
  engineVersion?: string;
  units?: 'metric' | 'imperial';
}

export interface TraceEvent {
  id: string;
  timestamp: string;
  stage?: string;
  message?: string;
  level?: string;
  durationMs?: number;
  stepName?: string;
  stepType?: string;
  status?: string;
  details?: string;
  formulaOrRule?: string;
  outputSummary?: string;
  sourceId?: string;
}

export interface FindingItem {
  id: string;
  title: string;
  description: string;
  category?: string;
  severity: string;
  evidence?: string;
}

export interface ActionRecommendation {
  id: string;
  title: string;
  action?: string;
  urgency?: string;
  reason?: string;
  rationale?: string;
  supportedBy?: any;
  actionCategory?: string;
}

export interface FarmerRoutine {
  id: string;
  farmId: string;
  fieldId?: string;
  title: string;
  category: 'irrigation' | 'fertilizer' | 'protection' | 'tillage' | 'scouting' | string;
  frequency: 'daily' | 'every_2_days' | 'every_3_days' | 'weekly' | 'bi-weekly' | 'as_needed' | string;
  notes?: string;
  quantityValue?: number;
  quantityUnit?: string;
  durationMinutes?: number;
  activity?: any;
  active?: boolean;
  parsedParameters?: any;
  recurrence?: any;
  timePreference?: any;
  rainSkipCondition?: any;
  amountMm?: number | null;
  rawStatement?: string;
  rawNaturalLanguage?: string;
  confirmedByUser?: boolean;
  lastConfirmedAt?: string;
  createdAt?: string;
}

export interface AutomationSchedule {
  id: string;
  farmId: string;
  farmName?: string;
  scope?: 'all' | string;
  fieldId?: string;
  fieldName?: string;
  enabled: boolean;
  frequencyDays: number;
  cadence?: 'manual' | 'daily' | 'every_3_days' | 'weekly' | 'custom' | string;
  timezone?: string;
  preferredTime?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  consentGranted?: boolean;
  consentGrantedAt?: string;
  storageMode?: 'local_only' | 'scheduled_backend';
  disclosedFields?: string[];
  lastRun?: string;
  nextRun?: string;
  lastOutcome?: 'completed' | 'partial' | 'failed' | 'skipped' | string;
  lastJobId?: string;
  retryCount?: number;
  notificationsEnabled?: {
    highPriorityAlerts: boolean;
    completedReports: boolean;
    materialChanges: boolean;
    routineReminders: boolean;
    connectionIssues: boolean;
  };
  jobHistory?: Array<{
    jobId: string;
    correlationId: string;
    startTime: string;
    endTime: string;
    status: 'completed' | 'partial' | 'failed' | 'retrying' | 'cancelled' | string;
    attemptCount: number;
    sourcesSummary: string;
    reportId?: string;
  }>;
}

export interface FieldRecord {
  id: string;
  name: string;
  acres?: number;
  hectares?: number;
  coordinates?: [number, number][];
  crop?: string;
  soilTexture?: SoilTextureType;
}

export type FieldEntity = FieldBoundaryItem;
export interface CalendarEvent {
  id: string;
  farmId: string;
  fieldId?: string;
  fieldName?: string;
  cropName?: string;
  title: string;
  eventType: 'planting' | 'harvest' | 'irrigation' | 'soil_test' | 'fertilizer' | 'scouting' | 'rotation_transition' | 'analysis' | string;
  date: string;
  endDate?: string;
  isCompleted?: boolean;
  completedAt?: string;
  source?: string;
  certaintyBasis?: 'planned' | 'observed' | 'modelled' | 'completed' | string;
  notes?: string;
  evidence?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  stage?: string;
  auditLog?: Array<{
    action: string;
    timestamp: string;
    note?: string;
  }>;
}

export type FarmField = FieldBoundaryItem;
export interface FieldBoundary {
  type?: string;
  coordinates: [number, number][];
  areaHa: number;
  areaAcres: number;
}

export interface FarmActivity {
  id: string;
  farmId: string;
  fieldId?: string;
  timestamp?: string;
  date?: string;
  type?: string;
  category?: 'irrigation' | 'fertilizer' | 'scouting' | 'tillage' | 'harvest' | 'spray' | string;
  title: string;
  details?: any;
  notes?: string;
  operator?: string;
  source?: string;
  createdAt?: string;
}

export interface Provenance {
  source: ProvenanceSource;
  dataset: string;
  version?: string;
  resolution?: string;
  retrievedAt: string;
  quality: 'observed' | 'modeled' | 'estimated' | 'imputed' | 'demo';
  notes?: string;
}

export interface Sourced<T> {
  value: T;
  provenance: Provenance;
  uncertainty?: number;
}

export type ConfidenceLevel = 'High' | 'Moderate' | 'Limited';

export interface ConfidenceBreakdown {
  overall: ConfidenceLevel;
  score: number; // 0 - 1
  inputCompleteness: number;
  dataQuality: number;
  rankStability: number;
  cropParamCoverage: number;
  scaleFit: number;
  limitingReasons: string[];
  suggestedInputsToRaise: { field: string; label: string; potentialGain: string }[];
}

export type SoilTextureType =
  | 'sandy'
  | 'sandy_loam'
  | 'loam'
  | 'silt_loam'
  | 'clay_loam'
  | 'clay'
  | 'unknown';

export type IrrigationMode = 'rain_only' | 'irrigation_only' | 'rain_and_irrigation' | 'not_sure';
export type IrrigationType = 'drip' | 'sprinkler' | 'pivot' | 'flood' | 'manual';
export type WaterReliability = 'very_reliable' | 'mostly' | 'often_short' | 'unpredictable';
export type PlanningHorizon = '3_seasons' | '5_seasons' | '3_years' | '5_years' | '10_years' | 'auto';
export type RiskAttitude = 'steady' | 'balanced' | 'upside';

export interface HistoricalSeasonCrop {
  seasonIndex: number;
  seasonLabel: string;
  cropId: string;
  performance: 'good' | 'ok' | 'poor' | 'unknown';
}

export interface PrioritiesState {
  waterSaving: number; // 0 - 4
  soilHealth: number; // 0 - 4
  climateResilience: number; // 0 - 4
  cropSuitability: number; // 0 - 4
  productivity: number; // 0 - 4
}

export interface NormalizedWeights {
  waterSaving: number;
  soilHealth: number;
  climateResilience: number;
  cropSuitability: number;
  productivity: number;
  wasClamped: boolean;
}

export interface FarmAnswers {
  // Farm identification
  farmName?: string;

  // Q1: Location
  locationName: string;
  lat: number;
  lon: number;
  country?: string;
  locationConfirmed: boolean;

  // Q2: Soil texture
  soilTexture: SoilTextureType;
  soilTextureConfirmed: boolean;

  // Q3: Water
  irrigationMode: IrrigationMode;
  irrigationType?: IrrigationType;
  waterReliability?: WaterReliability;
  seasonalWaterQuotaMm?: number | null;

  // Q4: Crop history
  cropHistory: HistoricalSeasonCrop[];

  // Q5: Planning horizon
  planningHorizon: PlanningHorizon;

  // Q6: Priorities
  priorities: PrioritiesState;

  // Sharpen stage (optional)
  excludedCropIds: string[];
  forcedCropIds: string[];
  soilPh?: number | null;
  soilPhEstimated?: boolean;
  hasSoilLabTest?: boolean;
  soilOrganicMatterPct?: number | null;
  soilNitrogenPpm?: number | null;
  drainageClass?: 'fast' | 'good' | 'slow' | 'waterlogged';
  slopeClass?: 'flat' | 'gentle' | 'moderate' | 'steep';
  tillagePractice?: 'full' | 'reduced' | 'no_till' | 'mixed';
  fertilizerPractice?: 'synthetic' | 'organic' | 'both' | 'minimal';
  coverCropPractice?: 'cover_crops' | 'residue' | 'both' | 'neither';
  cropsPerYear?: 'one' | 'two' | 'varies';
  knownPestsOrDiseases?: string[];
  waterSalinity?: 'good' | 'somewhat_salty' | 'very_salty' | 'not_sure';
  fieldSizeHa?: number;
  riskAttitude?: RiskAttitude;
}

export interface CropInfo {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  iconName: string;
  description: string;
  isLegume: boolean;
  isPerennial: boolean;
  minDurationSeasons: number;
  maxDurationSeasons: number;
  defaultDurationSeasons: number;
  minReturnIntervalSeasons: number;
  maxConsecutiveSeasons: number;
  tBase: number;
  tOptLow: number;
  tOptHigh: number;
  tMax: number;
  gddRequirement: number;
  kcInit: number;
  kcMid: number;
  kcEnd: number;
  rootDepthMeters: number;
  rootType: 'fibrous' | 'taproot' | 'deep_taproot';
  droughtDepletionFraction: number; // p in FAO-56
  salinityThresholdECe: number;
  optimalPhLow: number;
  optimalPhHigh: number;
  minPh: number;
  maxPh: number;
  nitrogenFixationKgHa: number;
  nitrogenDemandKgHa: number;
  residueCToNRatio: number;
  biomassResidueTonsHa: number;
  frostSensitivity: 'high' | 'moderate' | 'tolerant';
  heatSensitivity: 'high' | 'moderate' | 'tolerant';
  waterloggingSensitivity: 'high' | 'moderate' | 'tolerant';
  diseaseHostFamilies: string[];
}

export interface CropSuitabilityBreakdown {
  cropId: string;
  cropName: string;
  overallScore: number; // 0 - 100
  temperatureFit: number;
  waterFit: number;
  soilTextureFit: number;
  soilPhFit: number;
  drainageFit: number;
  growingPeriodFit: number;
  limitingFactor: string | null;
  confidence: ConfidenceLevel;
  breakdown?: any;
}

export interface RotationSeasonPlan {
  seasonIndex: number;
  seasonName: string;
  calendarYear?: number; // Clear distinction: Year (e.g. Year 1, Year 2)
  durationDays?: number; // Exact days planted in field for hover display
  cropId: string;
  cropName: string;
  durationSeasons: number;
  cropFamily: string;
  isLegume: boolean;
  waterDemandMm: number;
  waterStressDays: number;
  nitrogenCarryoverKgHa: number;
  soilOrganicMatterTrend: number;
  diseasePressureScore: number;
  erosionRiskLevel: 'low' | 'moderate' | 'elevated';
  plantingWindow: string;
  harvestWindow: string;
  transitionGap?: string;
  whyThisCrop: string;
  status?: string;
  expectedYield?: string;
}

export interface ComponentScores {
  suitability: number;
  water: number;
  soilHealth: number;
  resilience: number;
  productivity: number;
  diversity: number;
}

export interface RotationRisk {
  label: string;
  riskName: string;
  level: 'Low' | 'Medium' | 'High';
  cropOrSeason: string;
  cause: string;
  whatToDo: string;
}

export interface RotationDisadvantage {
  title: string;
  description: string;
  howToManage: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface RotationResult {
  id: string;
  rank: number;
  name: string;
  sequence: RotationSeasonPlan[];
  cycleLengthSeasons: number;
  cycleLengthYears?: number;
  reviewAfterSeason: number;
  totalScore: number;
  overallScore?: number;
  componentScores: ComponentScores;
  confidence: ConfidenceLevel;
  confidenceBreakdown?: ConfidenceBreakdown;
  dataCoverage?: DataCoverageInfo;
  isRecommended: boolean;
  notRecommendedReason?: string;
  rejectionReasonDetails?: {
    factor: 'water_stress' | 'soil_health' | 'suitability';
    actualValue: number;
    thresholdValue: number;
    unit: string;
    plainLanguage: string;
    whatWouldNeedToChange: string;
  };
  explanationSummary: string;
  deepExplanation: string;
  whyThisLength: string;
  whyThisOrder: string;
  bestReason?: string;
  riskshortfallWorst20Pct: number;
  waterDemandAnnualMm: number;
  nitrogenBalanceNetKgHa: number;
  somChangeTrajectory: number[]; // across seasons
  nitrogenTrajectory: number[];
  uncertaintyP10: number;
  uncertaintyP90: number;
  benefits?: string[];
  disadvantages?: RotationDisadvantage[];
  risksManagement?: RotationRisk[];
}

export interface ClimateObservation {
  annualPrecipitationMm: number;
  gddAnnual: number;
  meanTempC: number;
  maxSummerTempC: number;
  minWinterTempC: number;
  drySpellMaxDays: number;
  referenceEt0AnnualMm: number;
  soilMoisturePercentile: number;
  soilMoistureHistoricalBaseline?: number;
  vegetationNdviMean: number;
  groundwaterTrendCoarse: 'stable' | 'depleting' | 'recharging';
  warmingTrendDecadalC: number;
  precipitationTrendPctDecade: number;
  warmingTrendSignificance?: 'statistically_significant_warming' | 'statistically_significant_cooling' | 'no_clear_trend';
  warmingTrendPValue?: number;
  warmingTrendMethod?: string;
  historicalYearsCount?: number;
  annualHistorySeries?: { year: number; precipitationMm: number; meanTempC: number; summerMaxTempC: number }[];
  imputedDataFields?: string[];
  et0Method?: string;
  gddMethod?: string;
  growingDegreeDays?: number;
  annualPetMm?: number;
  solarRadiationMj?: number;
  aridityIndex?: number;
}

export interface AnalysisPayload {
  id: string;
  runId?: string;
  createdAt: string;
  inputHash: string;
  farmAnswers: FarmAnswers;
  climateData: ClimateObservation;
  climateDataProvenance: Record<string, Provenance>;
  rotations: RotationResult[];
  candidateSuitabilities: CropSuitabilityBreakdown[];
  normalizedWeights: NormalizedWeights;
  isDemo?: boolean;
  riskTradeoffAnswers?: any;
}

export interface WhatIfParameters {
  tempDeltaC: number; // -3 to +5
  precipDeltaPct: number; // -50 to +50
  waterSupplyDeltaPct: number; // -60 to +50
  initialSoilMoistureDeltaPct: number; // -30 to +30
  plantingDateShiftDays?: number; // -30 to +30
  soilTextureOverride?: SoilTextureType;
  soilPhOverride?: number;
  notes?: string;
}

export interface WhatIfComparison {
  baselineRotationId: string;
  rotationName: string;
  baselineScore: number;
  scenarioScore: number;
  scoreDelta: number;
  baselineRank: number;
  scenarioRank: number;
  rankDelta: number;
  primaryMovingFactor: string;
  waterStressDeltaDays: number;
  breachesSafetyFloor: boolean;
  isInfeasible?: boolean;
  infeasibleReason?: string;
  confidenceLevel?: 'High' | 'Moderate' | 'Extrapolated';
}

export interface SavedWhatIfScenario {
  id: string;
  name: string;
  baselineRunId: string;
  farmId: string;
  fieldId?: string;
  parameters: WhatIfParameters;
  results: WhatIfComparison[];
  createdAt: string;
  scenarioOnly?: boolean;
}

export interface FarmerLogEntry {
  id: string;
  date: string;
  category: 'observation' | 'yield' | 'issue' | 'irrigation' | 'fertilizer' | 'management';
  title: string;
  note: string;
  yieldAmount?: string;
  fieldId?: string;
  fieldName?: string;
}

export interface PlanDecisionEvent {
  id: string;
  farmId: string;
  fieldId?: string;
  timestamp: string;
  action: 'selected' | 'rejected' | 'deferred' | 'replaced';
  priorPlanName?: string;
  newPlanName?: string;
  actor: string;
  reason?: 'water' | 'cost' | 'equipment' | 'market' | 'management_preference' | 'other';
  reasonDetail?: string;
  sourceReportId?: string;
}

export interface FieldBoundaryItem {
  id: string;
  name: string;
  areaHa: number;
  areaAcres?: number;
  areaM2?: number;
  geometryVersion?: number;
  polygon?: [number, number][]; // coordinates [lat, lon]
  coordinates?: [number, number][]; // alias for polygon
  boundary?: any;
  acres?: number;
  hectares?: number;
  currentCrop?: any;
  crop?: string;
  soilTexture?: SoilTextureType;
  soilPh?: number;
  irrigationMode?: IrrigationMode;
  notes?: string;
  status?: string;
  farmId?: string;
  color?: string;
  cropHistory?: any;
  type?: string;
  perimeterM?: number;
  exclusionZones?: [number, number][][];
  lastModified?: string;
}

export interface SavedFarmPlan {
  id: string;
  name: string;
  locationName: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  farmAnswers: FarmAnswers;
  analysis: AnalysisPayload | null;
  notes?: string;
  isDefault?: boolean;
  isDemo?: boolean;
  fields?: FieldBoundaryItem[];
  farmerLogs?: FarmerLogEntry[];
  historicalLogs?: FarmerLogEntry[];
  decisionEvents?: PlanDecisionEvent[];
  polygon?: [number, number][];
  activeRotationPlanId?: string;
  boundary?: any;
  lat?: number;
  lon?: number;
}

export interface NasaAlertActionGuide {
  label: string;
  detail: string;
}

export interface NasaAlert {
  id: string;
  farmId: string;
  farmName: string;
  type: 'moisture_drop' | 'heat_anomaly' | 'rainfall_deficit' | 'ndvi_stress' | 'waterlogging';
  title: string;
  shortAlert: string;
  boldWarning: string;
  actionRecommendation: string;
  conciseAction: string;
  metricName: string;
  observedValue: string;
  historicalBaseline: string;
  anomalyDelta: string;
  satelliteSensor: string;
  cropImpact: string;
  actionGuidance: NasaAlertActionGuide[];
  severity: 'warning' | 'critical' | 'info';
  timestamp: string;
  read: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  avatarLetter: string;
}

export type AppViewMode = 'simple' | 'advanced';

export interface AppSettings {
  viewMode: AppViewMode;
  landUnit: 'ha' | 'ac';
  tempUnit: 'c' | 'f';
  waterUnit: 'mm' | 'in';
  units?: 'metric' | 'imperial';
  timezone?: string; // e.g. 'UTC', 'America/Chicago', 'Europe/London', 'Asia/Dubai', 'local'
  locale?: string;
  theme?: 'cyan-dark' | 'emerald-dark' | 'solar-amber' | 'high-contrast';
  reducedMotion?: boolean;
  defaultMapLayer?: 'satellite' | 'streets' | 'hybrid' | 'topographic';
  defaultFarmId?: string;
  autoScheduler?: boolean | { enabled: boolean; intervalDays: number; lastRun?: string };
  autoSyncNasa: boolean;
  alertSensitivity: 'standard' | 'high';
  emailAlerts: boolean;
  browserAlerts: boolean;
  inAppAlertsEnabled?: boolean;
  dataSourcePreference?: 'all' | 'nasa_only' | 'verified_only';
  cacheRefreshStatus?: 'synced' | 'refreshing' | 'offline';
  engineVersion?: string;
  offlineSync?: boolean;
  autoSaveIntervalSeconds?: number;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  notificationPreferences?: {
    moistureDrop: boolean;
    heatAnomaly: boolean;
    rainfallDeficit: boolean;
    ndviStress: boolean;
    reportsReady: boolean;
    taskReminders: boolean;
    systemUpdates: boolean;
  };
  publicSharingEnabled?: boolean;
  retainRecentSearches?: boolean;
}

export type NotificationCategory = 'alert' | 'report' | 'task' | 'system';
export type NotificationSeverity = 'info' | 'caution' | 'high' | 'critical';
export type NotificationLifecycleStatus = 'unread' | 'read' | 'acknowledged' | 'snoozed' | 'dismissed' | 'resolved';

export interface NotificationItem {
  id: string;
  groupKey: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  status: NotificationLifecycleStatus;
  title: string;
  summary: string;
  timestamp: string;
  farmId?: string;
  farmName?: string;
  fieldId?: string;
  fieldName?: string;
  entityRef?: string;
  reportId?: string;
  taskId?: string;
  actionAffordance: 'view_field' | 'open_report' | 'review_task' | 'retry_run' | 'restore_alert' | 'snooze';
  actionLabel: string;
  observedValue?: string;
  baselineValue?: string;
  anomaly?: string;
  dataset?: string;
  snoozedUntil?: string;
  resolvedAt?: string;
  isCriticalActive?: boolean;
}

export interface DailyStatusSnapshot {
  farmId: string;
  farmName: string;
  locationName: string;
  computedAt: string;
  overallStatus: 'good' | 'needs_attention' | 'alert';
  overallStatusReason?: string;
  currentCrop: {
    cropId: string;
    name: string;
    cropFamily: string; // Plain botanical family, e.g. "Grain", "Legume", "Oilseed"
    seasonLabel: string;
    stageLabel: string; // e.g. "Season 1 of 4" (never repeating "Season")
    growthStage: 'sowing' | 'growing' | 'flowering' | 'harvest_ready';
    growthStageText: string;
    daysIntoSeason: number;
    daysUntilNextTransition: number;
    nextCropId?: string;
    nextCropName?: string;
    nextCropFamily?: string;
    expectedHarvestWindow: string;
    // Advanced mode attributes:
    plantingDate?: string;
    exactDaysInField?: number;
    waterDemandMm?: number;
    waterNeedVsSupplyText?: string;
  };
  rotationShortView: string; // e.g. "Wheat → **Chickpea** → Lentil → Sorghum"
  sequenceCropsDetail: Array<{
    name: string;
    family: string;
    isCoverCrop: boolean;
    isFallow: boolean;
    typeLabel: 'Crop' | 'Cover Crop' | 'Fallow';
    durationDays: number;
    reasonForPlacement: string;
  }>;
  cycleLengthText: string;
  reviewCountdownText: string;
  whyNextCropFollows: string;
  water: {
    status: 'sufficient' | 'low' | 'critical';
    statusLabel: 'Enough' | 'Getting Low' | 'Critically Low';
    plainLanguage: string;
    rainComparison: string;
    waterSource: 'Rain only' | 'Irrigated' | 'Both (supplemental)';
    daysBufferWithoutRain: number;
    allowanceUsedText?: string;
    // Advanced mode attributes:
    topsoilMoisturePct: number;
    rootZoneMoisturePct: number;
    percentileAgainstHistory: number;
    waterStressDaysSeason: number;
    waterNeedMm: number;
    waterSupplyMm: number;
    detail?: string;
  };
  soil: {
    status: 'good' | 'watch' | 'poor';
    statusLabel: 'Healthy & Stable' | 'Moisture Watch' | 'Nutrient Depleted';
    plainLanguage: string;
    soilTypeEveryday: string;
    soilMoistureVsUsual: string;
    soilWarning?: string;
    // Advanced mode attributes:
    phValue: number;
    phClassification: string;
    organicMatterPct: number;
    nitrogenKgHa: number;
    salinityEc: string;
    drainageClass: string;
    provenanceTags: Record<string, string>;
    detail?: string;
  };
  weather: {
    isRainingRecently: boolean;
    isRainingNow: boolean;
    recentRainMm: number;
    sevenDayRainMm: number;
    tempC: number;
    humidityPct: number;
    windSpeedKmH: number;
    windDirection: string;
    solarRadiationMj?: number;
    dailyHighC: number;
    dailyLowC: number;
    hotDaysThisMonth: number;
    vsNormal: 'drier' | 'normal' | 'wetter';
    vsNormalText: string;
    conditionText: string;
  };
  cropHealth: {
    satelliteStatus: 'Vibrant & Healthy' | 'Normal Vigor' | 'Moisture Stressed' | 'Unavailable';
    plainStressSign: string;
    // Advanced mode:
    ndviValue?: number;
    ndviAnomalyPct?: number;
    ndviTrend?: 'Rising' | 'Stable' | 'Dropping';
    sensorSource: string;
    ndviStatusMessage?: string;
  };
  diseaseRisk: {
    level: 'Low' | 'Moderate' | 'Elevated';
    reason: string;
    // Advanced mode:
    wetCanopyHours24h: number;
    relativeHumidityAvg: number;
    primaryPathogenWatch: string;
  };
  nextAction?: {
    label: string;
    dueInDays?: number;
    isNeeded: boolean;
    reasonTiedToData?: string;
  };
  upcomingTasks: Array<{
    title: string;
    timing: string;
    reason: string;
    exactWindow?: string;
  }>;
  trends: {
    soilMoisture30DaysText: string;
    rainThisMonthVsNormalText: string;
    driftingConditionNote?: string;
  };
  trustInfo: {
    confidence?: 'High' | 'Moderate' | 'Limited';
    recommendationConfidence?: 'High' | 'Moderate' | 'Limited';
    dataCoverage?: string;
    coveragePercentage?: number;
    confidenceReason: string;
    keyNumbersSource: string;
    dataFreshnessWeather: string;
    dataFreshnessSoil: string;
    dataFreshnessSatellite: string;
    missingDetailTip?: string;
  };
  reviewCountdown?: {
    daysUntilReview: number;
  };
  trendNote?: {
    label: string;
  };
  activeAlerts: NasaAlert[];
  isStale?: boolean;
  lastUpdatedText: string;
}

export interface FarmTask {
  id: string;
  farmId: string;
  title: string;
  dueDate: string;
  date?: string;
  category: 'planting' | 'irrigation' | 'soil_test' | 'harvest' | 'scouting';
  completed: boolean;
}

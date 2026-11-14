import { SavedFarmPlan, FarmAnswers, AnalysisPayload, FarmTask, SavedWhatIfScenario, DeepAnalysisReport, DeepAnalysisFinding, FarmerRoutine, AutomationSchedule, CalendarEvent } from '../types';
import { PRESET_REGIONS } from '../services/nasaApi';
import { calculateNormalizedWeights, generateAndScoreRotations, hashString } from '../engine/scoring';

const STORAGE_KEY_FARMS = 'fieldshift_farms_v6';
const STORAGE_KEY_ACTIVE_FARM = 'fieldshift_active_farm_v6';
const STORAGE_KEY_WIZARD_DRAFT = 'fieldshift_wizard_draft_v1';

export function sanitizeCropName(name: string, isRainfedOrArid = true): string {
  if (!name) return '';
  if (/fallow.*cover|cover.*fallow/i.test(name)) {
    return isRainfedOrArid ? 'Fallow' : 'Cover Crop';
  }
  if (name.includes(' / ')) return name.split(' / ')[0].trim();
  if (name.includes('/')) return name.split('/')[0].trim();
  return name.trim();
}

export function sanitizeFarmCrops(farm: SavedFarmPlan): SavedFarmPlan {
  if (!farm) return farm;
  const isRainfedOrArid =
    farm.farmAnswers?.irrigationMode === 'rain_only' ||
    (farm.analysis?.climateData?.annualPrecipitationMm ?? 350) < 450;

  if (farm.analysis?.rotations) {
    farm.analysis.rotations.forEach((rot) => {
      if (rot.sequence) {
        rot.sequence.forEach((seq) => {
          seq.cropName = sanitizeCropName(seq.cropName, isRainfedOrArid);
          if (/fallow.*cover|cover.*fallow/i.test(seq.cropId)) {
            seq.cropId = isRainfedOrArid ? 'summer_fallow' : 'cover_crop';
          }
        });
      }
      rot.name = sanitizeCropName(rot.name, isRainfedOrArid);
    });
  }
  return farm;
}

export interface WizardDraft {
  currentStep: number;
  answers: FarmAnswers;
  isComplete: boolean;
  lastSavedAt: string;
  farmId?: string;
}

// -------------------------------------------------------------
// DRAFT / RESUME STATE MACHINE FOR FARM CREATION WIZARD
// -------------------------------------------------------------
export function determineWizardResumeStep(answers: FarmAnswers): number {
  if (!answers.locationConfirmed) return 1;
  if (!answers.soilTextureConfirmed) return 2;
  if (!answers.irrigationMode) return 3;
  if (!answers.cropHistory || answers.cropHistory.length === 0) return 4;
  if (!answers.planningHorizon) return 5;
  if (!answers.priorities) return 6;
  return 7; // Ready for review & analysis
}

export function saveWizardDraft(draft: WizardDraft): void {
  try {
    localStorage.setItem(STORAGE_KEY_WIZARD_DRAFT, JSON.stringify(draft));
  } catch (err) {
    console.warn('Failed to save wizard draft to localStorage:', err);
  }
}

export function loadWizardDraft(): WizardDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WIZARD_DRAFT);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse wizard draft from localStorage:', err);
  }
  return null;
}

export function clearWizardDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_WIZARD_DRAFT);
  } catch (err) {
    // ignore
  }
}

// -------------------------------------------------------------
// DISASTER RECOVERY & CROSS-DEVICE JSON EXPORT / IMPORT
// -------------------------------------------------------------
export function exportAllFarmsBackup(): string {
  const farms = loadSavedFarms();
  const activeId = getActiveFarmId();
  const draft = loadWizardDraft();
  const backup = {
    app: 'Field Shift Agricultural Intelligence Platform',
    version: '5.0',
    exportedAt: new Date().toISOString(),
    activeFarmId: activeId,
    wizardDraft: draft,
    farms,
  };
  return JSON.stringify(backup, null, 2);
}

export function importFarmsBackup(jsonString: string): { success: boolean; importedCount: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.farms)) {
      return { success: false, importedCount: 0, error: 'Invalid backup format: missing farms array.' };
    }
    const currentFarms = loadSavedFarms();
    const mergedMap = new Map<string, SavedFarmPlan>();
    currentFarms.forEach((f) => mergedMap.set(f.id, f));
    parsed.farms.forEach((f: SavedFarmPlan) => {
      if (f.id && f.name && f.farmAnswers) {
        mergedMap.set(f.id, f);
      }
    });
    const updatedList = Array.from(mergedMap.values());
    saveAllFarms(updatedList);
    if (parsed.activeFarmId && mergedMap.has(parsed.activeFarmId)) {
      setActiveFarmId(parsed.activeFarmId);
    }
    return { success: true, importedCount: parsed.farms.length };
  } catch (err: any) {
    return { success: false, importedCount: 0, error: err?.message || 'JSON parse error' };
  }
}

// Helper to generate seed analyses for default farms
function createDefaultSeedFarm1(): SavedFarmPlan {
  const answers: FarmAnswers = {
    locationName: 'Ras Al Khaimah, UAE',
    lat: 25.6741,
    lon: 55.9804,
    country: 'United Arab Emirates',
    locationConfirmed: true,
    soilTexture: 'sandy_loam',
    soilTextureConfirmed: true,
    irrigationMode: 'rain_and_irrigation',
    irrigationType: 'drip',
    waterReliability: 'mostly',
    seasonalWaterQuotaMm: 350,
    cropHistory: [
      { seasonIndex: 1, seasonLabel: 'Winter', cropId: 'winter_wheat', performance: 'good' },
      { seasonIndex: 2, seasonLabel: 'Spring', cropId: 'lettuce', performance: 'good' },
      { seasonIndex: 3, seasonLabel: 'Summer', cropId: 'dry_beans', performance: 'good' },
      { seasonIndex: 4, seasonLabel: 'Autumn', cropId: 'maize_grain', performance: 'good' },
    ],
    planningHorizon: 'auto',
    priorities: {
      waterSaving: 4,
      soilHealth: 4,
      climateResilience: 4,
      cropSuitability: 3,
      productivity: 3,
    },
    excludedCropIds: [],
    forcedCropIds: [],
    soilPh: 7.4,
    soilPhEstimated: false,
    drainageClass: 'good',
    tillagePractice: 'reduced',
    fieldSizeHa: 32.5,
    riskAttitude: 'balanced',
  };

  const climate = {
    ...PRESET_REGIONS.kansas_wheat.climate,
    annualPrecipitationMm: 145,
    soilMoisturePercentile: 38,
    gddAnnual: 3450,
    vegetationNdviMean: 0.42,
  };
  const weights = calculateNormalizedWeights(answers.priorities);
  const { rotations, suitabilities } = generateAndScoreRotations(answers, climate);

  const payload: AnalysisPayload = {
    id: 'analysis_seed_marjan',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    inputHash: 'seed_marjan_hash',
    farmAnswers: answers,
    climateData: climate,
    climateDataProvenance: {},
    rotations,
    candidateSuitabilities: suitabilities,
    normalizedWeights: weights,
    isDemo: false,
  };

  return {
    id: 'farm_marjan_01',
    name: 'Al Marjan Farm',
    locationName: 'Ras Al Khaimah, UAE',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    farmAnswers: answers,
    analysis: payload,
    fields: [
      {
        id: 'fld_marjan_north',
        name: 'North Terrace A',
        areaHa: 18.5,
        polygon: [
          [25.6741, 55.9804],
          [25.6765, 55.9818],
          [25.6752, 55.9852],
          [25.6728, 55.9835],
        ],
        currentCrop: 'Winter Wheat',
        soilTexture: 'sandy_loam',
        irrigationMode: 'rain_and_irrigation',
        notes: 'Drip-line fertigation, 30cm probe installed',
      },
      {
        id: 'fld_marjan_south',
        name: 'South Pivot B',
        areaHa: 14.0,
        polygon: [
          [25.6715, 55.9790],
          [25.6738, 55.9802],
          [25.6722, 55.9838],
          [25.6702, 55.9822],
        ],
        currentCrop: 'Chickpea',
        soilTexture: 'silt_loam',
        irrigationMode: 'rain_and_irrigation',
        notes: 'Low-salinity groundwater blend',
      },
    ],
    farmerLogs: [
      {
        id: 'log_seed_1',
        date: 'Oct 04, 2026',
        category: 'yield',
        title: 'Previous Winter Wheat Harvest',
        yieldAmount: '3.9 t/ha',
        fieldId: 'fld_marjan_north',
        fieldName: 'North Terrace A',
        note: 'Good protein test, minimal rust observed after timely fungicide application.',
      },
      {
        id: 'log_seed_2',
        date: 'Oct 08, 2026',
        category: 'irrigation',
        title: 'Irrigation Valve Inspection',
        fieldId: 'fld_marjan_south',
        fieldName: 'South Pivot B',
        note: 'South pivot pressure sensor recalibrated; moisture probes calibrated to 30cm root zone.',
      },
      {
        id: 'log_seed_3',
        date: 'Oct 14, 2026',
        category: 'observation',
        title: 'Canopy Emergence Check',
        fieldId: 'fld_marjan_north',
        fieldName: 'North Terrace A',
        note: 'Uniform germination across sandy loam zones; 94% emergence count.',
      },
    ],
    decisionEvents: [
      {
        id: 'dec_seed_1',
        farmId: 'farm_marjan_01',
        fieldId: 'fld_marjan_north',
        timestamp: new Date(Date.now() - 86400000 * 12).toISOString(),
        action: 'selected',
        priorPlanName: 'Continuous Cereal Baseline',
        newPlanName: 'Wheat — Chickpea — Lentil Rotation',
        actor: 'Lead Agronomist',
        reason: 'water',
        reasonDetail: 'Legume integration cuts seasonal groundwater demand by 28%.',
      },
      {
        id: 'dec_seed_2',
        farmId: 'farm_marjan_01',
        fieldId: 'fld_marjan_south',
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        action: 'deferred',
        priorPlanName: 'Alfalfa Perennial',
        newPlanName: 'Deferred for Soil Salt Flushes',
        actor: 'Farm Manager',
        reason: 'management_preference',
        reasonDetail: 'Awaiting secondary drainage ditch completion before establishing alfalfa.',
      },
    ],
    notes: 'Coastal agricultural parcel in RAK with micro-drip irrigation.',
    isDefault: true,
  };
}

function createDefaultSeedFarm2(): SavedFarmPlan {
  const answers: FarmAnswers = {
    locationName: 'RAK, UAE',
    lat: 25.7895,
    lon: 55.9432,
    country: 'United Arab Emirates',
    locationConfirmed: true,
    soilTexture: 'silt_loam',
    soilTextureConfirmed: true,
    irrigationMode: 'rain_and_irrigation',
    irrigationType: 'drip',
    waterReliability: 'mostly',
    seasonalWaterQuotaMm: 380,
    cropHistory: [
      { seasonIndex: 1, seasonLabel: 'Winter', cropId: 'winter_wheat', performance: 'good' },
      { seasonIndex: 2, seasonLabel: 'Spring', cropId: 'lettuce', performance: 'good' },
      { seasonIndex: 3, seasonLabel: 'Summer', cropId: 'dry_beans', performance: 'good' },
      { seasonIndex: 4, seasonLabel: 'Autumn', cropId: 'maize_grain', performance: 'good' },
    ],
    planningHorizon: 'auto',
    priorities: {
      waterSaving: 4,
      soilHealth: 3,
      climateResilience: 4,
      cropSuitability: 3,
      productivity: 3,
    },
    excludedCropIds: [],
    forcedCropIds: [],
    soilPh: 7.1,
    soilPhEstimated: false,
    drainageClass: 'good',
    tillagePractice: 'reduced',
    fieldSizeHa: 18.2,
    riskAttitude: 'balanced',
  };

  const climate = {
    ...PRESET_REGIONS.kansas_wheat.climate,
    annualPrecipitationMm: 152,
    soilMoisturePercentile: 41,
    gddAnnual: 3380,
    vegetationNdviMean: 0.39,
  };
  const weights = calculateNormalizedWeights(answers.priorities);
  const { rotations, suitabilities } = generateAndScoreRotations(answers, climate);

  const payload: AnalysisPayload = {
    id: 'analysis_seed_rak',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    inputHash: 'seed_rak_hash',
    farmAnswers: answers,
    climateData: climate,
    climateDataProvenance: {},
    rotations,
    candidateSuitabilities: suitabilities,
    normalizedWeights: weights,
    isDemo: false,
  };

  return {
    id: 'farm_rak_02',
    name: 'Ras Al Khaimah Farm',
    locationName: 'RAK, UAE',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    farmAnswers: answers,
    analysis: payload,
    notes: 'Inland greenhouse & pivot test parcel. [Demonstration]',
    isDefault: false,
    isDemo: true,
  };
}

export function createDemoFarmFixture(): SavedFarmPlan {
  const farm1 = createDefaultSeedFarm1();
  farm1.isDemo = true;
  farm1.notes = 'Demonstration Farm — Al Marjan Sample Workspace. All metrics carry Demo provenance.';
  return farm1;
}

export function loadSavedFarms(): SavedFarmPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FARMS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(sanitizeFarmCrops);
      }
    }
  } catch (err) {
    console.warn('Failed to load saved farms from storage', err);
  }

  // First visit / clean state: Return honest empty list (no implicit mock seeding!)
  return [];
}

export function loadDemoFarm(): SavedFarmPlan {
  const current = loadSavedFarms();
  const existingDemo = current.find((f) => f.isDemo);
  if (existingDemo) {
    setActiveFarmId(existingDemo.id);
    return existingDemo;
  }
  const demoFarm = createDemoFarmFixture();
  const updated = [demoFarm, ...current];
  saveAllFarms(updated);
  setActiveFarmId(demoFarm.id);
  return demoFarm;
}

export function removeDemoFarm(): SavedFarmPlan[] {
  const current = loadSavedFarms();
  const filtered = current.filter((f) => !f.isDemo);
  saveAllFarms(filtered);
  const activeId = getActiveFarmId();
  if (!filtered.some((f) => f.id === activeId)) {
    setActiveFarmId(filtered[0]?.id || '');
  }
  return filtered;
}

export function saveAllFarms(farms: SavedFarmPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FARMS, JSON.stringify(farms));
  } catch (err) {
    console.warn('Failed to persist farms', err);
  }
}

export function saveFarmPlan(farm: SavedFarmPlan): SavedFarmPlan[] {
  const current = loadSavedFarms();
  const index = current.findIndex((f) => f.id === farm.id);

  const updatedFarm: SavedFarmPlan = {
    ...farm,
    updatedAt: new Date().toISOString(),
  };

  let updatedList: SavedFarmPlan[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = updatedFarm;
  } else {
    updatedList = [updatedFarm, ...current];
  }

  saveAllFarms(updatedList);
  return updatedList;
}

export function deleteFarmPlan(farmId: string): SavedFarmPlan[] {
  const current = loadSavedFarms();
  const updated = current.filter((f) => f.id !== farmId);
  saveAllFarms(updated);
  const currentActive = getActiveFarmId();
  if (currentActive === farmId) {
    setActiveFarmId(updated[0]?.id || '');
  }
  return updated;
}

export function duplicateFarmPlan(farmId: string): SavedFarmPlan[] {
  const current = loadSavedFarms();
  const source = current.find((f) => f.id === farmId);
  if (!source) return current;
  const duplicate: SavedFarmPlan = {
    ...source,
    id: `farm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: `${source.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemo: false,
    isDefault: false,
    farmerLogs: [], // historical logs not duplicated
  };
  const updated = [duplicate, ...current];
  saveAllFarms(updated);
  return updated;
}

export function createNewFarm(
  name: string,
  answers: FarmAnswers,
  analysis: AnalysisPayload | null = null,
  fields?: any[]
): SavedFarmPlan {
  const newFarm: SavedFarmPlan = {
    id: `farm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || answers.locationName || 'Untitled Farm',
    locationName: answers.locationName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    farmAnswers: answers,
    analysis,
    isDemo: false,
    fields: fields || (answers.fieldSizeHa ? [{
      id: `field_1_${Date.now()}`,
      name: `${name.trim() || 'Field'} Main Parcel`,
      areaHa: answers.fieldSizeHa,
      soilTexture: answers.soilTexture,
      irrigationMode: answers.irrigationMode,
    }] : []),
  };

  saveFarmPlan(newFarm);
  setActiveFarmId(newFarm.id);
  return newFarm;
}

export function getActiveFarmId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_FARM);
    if (saved) return saved;
  } catch {
    // ignore
  }
  const farms = loadSavedFarms();
  return farms[0]?.id || '';
}

export function setActiveFarmId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_FARM, id);
  } catch {
    // ignore
  }
}

// -------------------------------------------------------------
// FARM CALENDAR TASKS PERSISTENCE
// -------------------------------------------------------------
const STORAGE_KEY_TASKS = 'fieldshift_farm_tasks_v1';

const DEFAULT_TASKS: FarmTask[] = [
  {
    id: 'task_default_1',
    farmId: 'farm_marjan_01',
    title: 'Pre-season drip flush & pressure regulator calibration',
    dueDate: '2026-03-15',
    category: 'irrigation',
    completed: true,
  },
  {
    id: 'task_default_2',
    farmId: 'farm_marjan_01',
    title: 'Root-zone nitrate 30cm probe measurement',
    dueDate: '2026-03-22',
    category: 'soil_test',
    completed: false,
  },
  {
    id: 'task_default_3',
    farmId: 'farm_marjan_01',
    title: 'Winter wheat flag-leaf scouting & stripe rust inspection',
    dueDate: '2026-03-28',
    category: 'scouting',
    completed: false,
  },
];

export function loadFarmTasks(): FarmTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_TASKS;
}

export function saveFarmTask(task: FarmTask): FarmTask[] {
  const current = loadFarmTasks();
  const index = current.findIndex((t) => t.id === task.id);
  let updated: FarmTask[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = task;
  } else {
    updated = [task, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function deleteFarmTask(taskId: string): FarmTask[] {
  const current = loadFarmTasks();
  const updated = current.filter((t) => t.id !== taskId);
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

const STORAGE_KEY_WHATIF = 'fieldshift_whatif_scenarios';

export function loadWhatIfScenarios(farmId?: string): SavedWhatIfScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WHATIF);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return farmId ? parsed.filter((s: SavedWhatIfScenario) => s.farmId === farmId) : parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveWhatIfScenario(scenario: SavedWhatIfScenario): SavedWhatIfScenario[] {
  const current = loadWhatIfScenarios();
  const index = current.findIndex((s) => s.id === scenario.id);
  let updated: SavedWhatIfScenario[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = scenario;
  } else {
    updated = [scenario, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY_WHATIF, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function deleteWhatIfScenario(scenarioId: string): SavedWhatIfScenario[] {
  const current = loadWhatIfScenarios();
  const updated = current.filter((s) => s.id !== scenarioId);
  try {
    localStorage.setItem(STORAGE_KEY_WHATIF, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function duplicateWhatIfScenario(scenarioId: string): SavedWhatIfScenario | null {
  const current = loadWhatIfScenarios();
  const target = current.find((s) => s.id === scenarioId);
  if (!target) return null;
  const duplicate: SavedWhatIfScenario = {
    ...target,
    id: `scen_${Date.now()}`,
    name: `${target.name} (Copy)`,
    createdAt: new Date().toISOString(),
  };
  saveWhatIfScenario(duplicate);
  return duplicate;
}

export function renameWhatIfScenario(scenarioId: string, newName: string): SavedWhatIfScenario[] {
  const current = loadWhatIfScenarios();
  const index = current.findIndex((s) => s.id === scenarioId);
  if (index >= 0) {
    current[index] = { ...current[index], name: newName.trim() };
    try {
      localStorage.setItem(STORAGE_KEY_WHATIF, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
  return current;
}

export function resetAllLocalData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_FARMS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_FARM);
    localStorage.removeItem(STORAGE_KEY_WIZARD_DRAFT);
    localStorage.removeItem(STORAGE_KEY_TASKS);
    localStorage.removeItem(STORAGE_KEY_WHATIF);
  } catch {
    // ignore
  }
}

const STORAGE_KEY_DEEP_LOGS = 'fieldshift_deep_analysis_logs';
const STORAGE_KEY_ROUTINES = 'fieldshift_farmer_routines';
const STORAGE_KEY_SCHEDULES = 'fieldshift_automation_schedules';

export function loadDeepAnalysisLogs(farmId?: string): DeepAnalysisReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEEP_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return farmId ? parsed.filter((r: DeepAnalysisReport) => r.farmId === farmId) : parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveDeepAnalysisLog(report: DeepAnalysisReport): void {
  const current = loadDeepAnalysisLogs();
  const filtered = current.filter((r) => r.id !== report.id);
  const updated = [report, ...filtered];
  try {
    localStorage.setItem(STORAGE_KEY_DEEP_LOGS, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export const loadFarmReports = loadDeepAnalysisLogs;
export function saveFarmReport(report: DeepAnalysisReport): DeepAnalysisReport[] {
  saveDeepAnalysisLog(report);
  return loadDeepAnalysisLogs(report.farmId);
}

export function createReportSnapshot(
  farm: SavedFarmPlan,
  scope: string = 'all',
  fieldId?: string,
  trigger: string = 'manual_snapshot'
): DeepAnalysisReport {
  const analysis = farm.analysis;
  const climate = analysis?.climateData;
  const selectedField = fieldId ? farm.fields?.find((f) => f.id === fieldId) : undefined;
  const nowIso = new Date().toISOString();

  // Clone fields to guarantee complete snapshot immutability
  const clonedFields = (farm.fields || []).map((f) => ({
    id: f.id,
    name: f.name,
    areaHa: f.areaHa || 0,
    areaAcres: f.areaAcres || Number(((f.areaHa || 0) * 2.47105).toFixed(1)),
    perimeterM: f.perimeterM || 0,
    currentCrop: (f as any).currentCrop || f.crop || 'Unspecified',
    stage: (f as any).stage || 'Vegetative Growth',
    soilTexture: (f as any).soilTexture || f.soilTexture || farm.farmAnswers?.soilTexture || 'Unspecified',
    pH: (f as any).pH ?? f.soilPh ?? farm.farmAnswers?.soilPh ?? undefined,
    irrigationMethod: (f as any).irrigationMethod || (f as any).irrigationMode || farm.farmAnswers?.irrigationMode || 'Unspecified',
    polygon: f.polygon || f.coordinates,
  }));

  // Build canonical findings from analysis data if available
  const findings: DeepAnalysisFinding[] = [];
  const leadingRotation = analysis?.rotations?.[0];

  if (analysis) {
    if (leadingRotation) {
      findings.push({
        id: `fnd_${farm.id}_rot`,
        category: 'rotation',
        severity: 'positive',
        title: `Canonical Succession Plan: ${leadingRotation.name}`,
        description: leadingRotation.explanationSummary || 'Multi-season rotation formulated by canonical agronomic scoring engine.',
        fieldName: selectedField?.name || 'Whole Farm',
        source: 'Canonical Rotation Engine (crops.ts & scoring.ts)',
        recommendation: `Follow planned ${leadingRotation.sequence?.length || 4}-season succession to sustain soil biology and prevent pathogen accumulation.`,
        dueWindow: 'Next Seasonal Planting Window',
      });
    }

    if (climate) {
      const soilMoist = climate.soilMoisturePercentile ?? 45;
      findings.push({
        id: `fnd_${farm.id}_moist`,
        category: 'hydrology',
        severity: soilMoist < 35 ? 'caution' : 'positive',
        title: soilMoist < 35 ? 'Root-Zone Moisture Depletion Watch' : 'Root-Zone Soil Hydration Buffer',
        description: `Modeled root-zone soil water is operating at the ${soilMoist}th historical percentile.`,
        fieldName: selectedField?.name || 'All Parcels',
        source: 'NASA POWER MERRA-2 Hydrology (GWETROOT)',
        recommendation: soilMoist < 35 ? 'Monitor wetting front and schedule supplemental irrigation if dry spell persists.' : 'Hydration reserves adequate for current vegetative growth.',
        dueWindow: soilMoist < 35 ? 'Within 48–72 Hours' : 'Ongoing Monitoring',
      });
    }
  }

  const recommendations = [
    {
      id: `rec_${farm.id}_1`,
      title: farm.farmAnswers?.irrigationMode === 'rain_only' ? 'Monitor Seasonal Weather Window' : 'Verify Irrigation Wetting Front',
      urgency: 'medium',
      rationale: 'Ensure root-zone moisture remains above Readily Available Water (RAW) depletion threshold.',
      supportedBy: 'FAO-56 Soil Water Balance',
      actionCategory: 'irrigation',
    },
    {
      id: `rec_${farm.id}_2`,
      title: 'Soil Nutrient & Nitrogen Scavenge Review',
      urgency: 'low',
      rationale: 'Review preceding season biological nitrogen credit before finalizing fertility orders.',
      supportedBy: 'Legume N-Fixation Carryover Model',
      actionCategory: 'soil',
    },
  ];

  const reportId = `rep_${farm.id}_${Date.now()}`;
  const snapshot: DeepAnalysisReport = {
    id: reportId,
    farmId: farm.id,
    farmName: farm.name,
    fieldId: selectedField?.id,
    fieldName: selectedField?.name || 'Whole Farm (All Fields)',
    scope: selectedField ? 'single_field' : 'all_fields',
    trigger,
    createdAt: nowIso,
    runAt: nowIso,
    generatedAt: nowIso,
    overallStatus: analysis ? 'good' : 'needs_attention',
    overallScore: leadingRotation ? Math.round(leadingRotation.totalScore) : 80,
    confidence: leadingRotation?.confidence || 'Moderate',
    summaryHeadline: leadingRotation
      ? `${leadingRotation.name} · Site-Specific Succession Plan`
      : `${farm.name} Baseline Operational Brief`,
    summaryText: leadingRotation?.explanationSummary ||
      'Agronomic field brief compiled from canonical farm answers, field geometry, and NASA POWER agro-meteorological reanalysis.',
    findings,
    recommendations,
    recommendedActions: recommendations,
    strengths: findings.filter((f) => f.severity === 'positive'),
    concerns: findings.filter((f) => f.severity !== 'positive'),
    dataLimitations: [
      'Atmospheric meteorology derived from NASA POWER 0.5° × 0.5° reanalysis grid.',
      'Copernicus Sentinel-2 optical NDVI reflectance is unconnected; no synthetic vegetation index is fabricated.',
      'Root-zone available moisture represents FAO-56 hydrological water balance simulation; not in-situ capacitance probes.',
    ],
    calculationsSnapshot: {
      referenceEt0Mm: climate?.referenceEt0AnnualMm || 1420,
      estimatedCropDemandMm: leadingRotation?.sequence?.[0]?.waterDemandMm || 380,
      annualPrecipitationMm: climate?.annualPrecipitationMm || 350,
      thermalGddAnnual: climate?.gddAnnual || 2400,
    },
    engineVersion: 'Field Shift Agro-Engine v8.4.2',
    units: 'metric',
    farmContextSnapshot: {
      farmName: farm.name,
      locationName: farm.locationName,
      lat: farm.farmAnswers?.lat,
      lon: farm.farmAnswers?.lon,
      fieldSizeHa: farm.farmAnswers?.fieldSizeHa,
      soilTexture: farm.farmAnswers?.soilTexture,
      irrigationMode: farm.farmAnswers?.irrigationMode,
      soilPh: farm.farmAnswers?.soilPh ?? null,
      hasSoilLabTest: farm.farmAnswers?.hasSoilLabTest ?? false,
      fields: clonedFields,
      rotations: analysis?.rotations ? JSON.parse(JSON.stringify(analysis.rotations)) : [],
      climateData: climate ? JSON.parse(JSON.stringify(climate)) : undefined,
    },
  };

  saveDeepAnalysisLog(snapshot);
  return snapshot;
}

export function getOrInitFarmReportSnapshot(farm: SavedFarmPlan): DeepAnalysisReport {
  const existing = loadDeepAnalysisLogs(farm.id);
  if (existing.length > 0) {
    return existing[0];
  }
  return createReportSnapshot(farm, 'all', undefined, 'initial_creation');
}

export function loadFarmerRoutines(farmId?: string): FarmerRoutine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROUTINES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return farmId ? parsed.filter((r: FarmerRoutine) => r.farmId === farmId) : parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveFarmerRoutine(routine: FarmerRoutine): FarmerRoutine[] {
  const current = loadFarmerRoutines();
  const index = current.findIndex((r) => r.id === routine.id);
  let updated: FarmerRoutine[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = routine;
  } else {
    updated = [routine, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY_ROUTINES, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated.filter((r) => r.farmId === routine.farmId);
}

export function deleteFarmerRoutine(routineId: string): FarmerRoutine[] {
  const current = loadFarmerRoutines();
  const updated = current.filter((r) => r.id !== routineId);
  try {
    localStorage.setItem(STORAGE_KEY_ROUTINES, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function loadAutomationSchedules(farmId?: string): AutomationSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCHEDULES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return farmId ? parsed.filter((s: AutomationSchedule) => s.farmId === farmId) : parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveAutomationSchedule(schedule: AutomationSchedule): AutomationSchedule[] {
  const current = loadAutomationSchedules();
  const index = current.findIndex((s) => s.id === schedule.id);
  let updated: AutomationSchedule[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = schedule;
  } else {
    updated = [schedule, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated.filter((s) => s.farmId === schedule.farmId);
}

export function deleteAutomationSchedule(scheduleId: string): AutomationSchedule[] {
  const current = loadAutomationSchedules();
  const updated = current.filter((s) => s.id !== scheduleId);
  try {
    localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

const STORAGE_KEY_CALENDAR = 'fieldshift_calendar_events';

export function loadCalendarEvents(farmId?: string): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CALENDAR);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return farmId ? parsed.filter((e: CalendarEvent) => e.farmId === farmId) : parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveCalendarEvent(event: CalendarEvent): CalendarEvent[] {
  const current = loadCalendarEvents();
  const index = current.findIndex((e) => e.id === event.id);
  let updated: CalendarEvent[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = event;
  } else {
    updated = [event, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY_CALENDAR, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function deleteCalendarEvent(eventId: string): CalendarEvent[] {
  const current = loadCalendarEvents();
  const updated = current.filter((e) => e.id !== eventId);
  try {
    localStorage.setItem(STORAGE_KEY_CALENDAR, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

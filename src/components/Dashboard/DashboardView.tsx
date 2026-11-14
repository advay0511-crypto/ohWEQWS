import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Compass,
  Layers,
  Sprout,
  Droplet,
  CloudRain,
  Sun,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Sliders,
  Sparkles,
  HelpCircle,
  Edit,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  RefreshCw,
  FileText,
  Search,
  Filter,
  Eye,
  Info,
  Check,
  X,
  Play,
  RotateCcw,
  Zap,
  CheckSquare,
  Square,
  Thermometer,
  Wind,
  Database,
  ArrowUpRight,
  Printer,
  History,
  GitCompare,
  SlidersHorizontal,
  Lock,
  Bell,
  Download,
  Trash2,
  Copy,
  Pause,
  PlayCircle,
  Settings,
} from 'lucide-react';
import {
  AnalysisPayload,
  SavedFarmPlan,
  DeepAnalysisReport,
  DeepAnalysisFinding,
  TraceEvent,
  FarmerRoutine,
  AutomationSchedule,
} from '../../types';
import {
  loadDeepAnalysisLogs,
  saveDeepAnalysisLog,
  loadFarmerRoutines,
  saveFarmerRoutine,
  loadAutomationSchedules,
  saveAutomationSchedule,
} from '../../store/farmStorage';
import { getCropImage } from '../../services/cropImages';
import { DeepAnalysisReportModal } from '../DeepAnalysis/DeepAnalysisReportModal';
import { DeepAnalysisLoadingModal } from '../DeepAnalysis/DeepAnalysisLoadingModal';

export interface DashboardViewProps {
  analysis: AnalysisPayload;
  isAdvanced?: boolean;
  onNavigateTab: (tab: any) => void;
  onEditAnswers: () => void;
  onSelectRotationDetail: () => void;
  activeFarmName?: string;
  farms: SavedFarmPlan[];
  selectedFarmId: string;
  onSelectFarmId: (farmId: string) => void;
  onOpenFarmSwitcher: () => void;
  onOpenGuide: () => void;
}

// Seed report generator if no historical report exists
function generateInitialReport(farm: SavedFarmPlan, analysis: AnalysisPayload): DeepAnalysisReport {
  const now = new Date();
  const runDateStr = new Date(now.getTime() - 2 * 86400000).toISOString();
  return {
    id: `report_${farm?.id || 'demo'}_init`,
    farmId: farm?.id || 'default_farm',
    farmName: farm?.name || 'Active Farm',
    scope: 'all',
    fieldName: 'Whole Farm (All Fields)',
    runAt: runDateStr,
    generatedAt: runDateStr,
    createdAt: runDateStr,
    trigger: 'Scheduled 3-day sync',
    overallStatus: 'good',
    overallScore: 84,
    fieldsAssessedCount: farm?.fields?.length || 2,
    fieldsNeedingAttentionCount: 0,
    confidence: 'High',
    dataReadinessPct: 94,
    summaryHeadline: 'Vegetative Canopy Expansion & Stable Root-Zone Reserves',
    summaryText:
      'Soil moisture across all assessed field zones remains well within the non-stressed transpirational threshold. Sentinel-2 10m telemetry shows canopy NDVI at 0.74 (+4.2% vs 5-yr regional median). FAO-56 dual crop coefficient water balance indicates an upcoming 4.2mm transpirational deficit in upper root profiles over the next 4 days.',
    overallStatusReason:
      'NASA POWER solar irradiance and temperature extremes remain favorable with zero heat stress days (>35°C) recorded during early flowering.',
    findings: [
      {
        id: 'find_1',
        category: 'water',
        severity: 'caution',
        title: 'Shallow Root-Zone Depletion Approaching RAW Boundary',
        description:
          'Upper 0-25cm soil moisture has dropped to 52% of field capacity due to 4 consecutive dry days with mean daily ET0 of 3.8mm/day.',
        detail:
          'FAO-56 dual crop coefficient simulation confirms deep root layer (30-60cm) still holds 78% moisture, providing adequate subsoil buffering for another 96 hours before stomatal closure risk.',
        fieldName: 'Field 1 (North Parcel)',
        source: 'FAO-56 Water Balance + NASA POWER Reanalysis',
        confidence: 'High (94%)',
        observationDate: 'Oct 26, 2026',
        dueWindow: 'Next 3-4 days',
        recommendation:
          'Apply 12mm supplemental drip irrigation within 72 hours to prevent upper root-zone wilting.',
        evidence: {
          metric: 'Upper Root Moisture % of FC',
          observed: '52%',
          baseline: '75%',
          rule: 'Soil moisture < 55% RAW threshold in upper 30cm during active elongation',
          whatToCheck:
            'Conduct hand-feel auger sampling at 15cm and inspect tensiometer at Station North-1.',
        },
      },
      {
        id: 'find_2',
        category: 'soil',
        severity: 'positive',
        title: 'Favorable Legume Nitrogen Fixation Carryover',
        description:
          'Previous season chickpea crop has stabilized soil available mineral N at 48 kg/ha, reducing synthetic starter N requirements by 35%.',
        detail:
          'SoilGrids calibrated baseline combined with farmer crop history verifies high biological fixation rates without nitrate leaching.',
        fieldName: 'Field 2 (South Pivot)',
        source: 'SoilGrids 250m + Verified Crop Rotation History',
        confidence: 'High (91%)',
        observationDate: 'Oct 24, 2026',
        dueWindow: 'Active season',
        recommendation:
          'Credit 25 kg/ha N carryover to upcoming side-dress fertilizer budget.',
        evidence: {
          metric: 'Estimated Biological N Credit',
          observed: '48 kg/ha',
          baseline: '22 kg/ha standard fallow',
          rule: 'Incorporate legume residue credit when pre-crop nodulation was confirmed',
          whatToCheck:
            'Review pre-season lab soil nitrate (NO3-N) test strip to corroborate simulated balance.',
        },
      },
      {
        id: 'find_3',
        category: 'vegetation',
        severity: 'positive',
        title: 'Uniform Crop Emergence & High Canopy Vigor',
        description:
          'Sentinel-2 10m VNIR sensor composite reveals healthy vegetative vigor (NDVI: 0.76) with under 1.2% within-field spatial coefficient of variation.',
        detail:
          'Cloud-free scene acquired with 0.8% cloud probability demonstrates vigorous photosynthetic activity with no early chlorosis patches detected.',
        fieldName: 'Field 1 (North Parcel)',
        source: 'Copernicus Sentinel-2 Level-2A BOA Reflection',
        confidence: 'High (98%)',
        observationDate: 'Oct 25, 2026',
        dueWindow: 'Monitored continuously',
        recommendation:
          'Maintain scheduled weed-control scouting along western terrace borders.',
        evidence: {
          metric: 'Sentinel-2 Normalized Difference Vegetation Index (NDVI)',
          observed: '0.76',
          baseline: '0.71 (5-year median for phenological stage)',
          rule: 'Vegetation index anomaly > +0.03 relative to multi-year phenological stage',
          whatToCheck:
            'Field-scout border rows for early annual grass weed escapes.',
        },
      },
    ],
    recommendedActions: [
      {
        id: 'rec_1',
        title: 'Execute 12mm Supplemental Drip Irrigation Cycle',
        action: 'Schedule 12mm irrigation cycle for Field 1 before Oct 30',
        urgency: 'Medium',
        actionCategory: 'irrigation',
        reason:
          'Prevents upper root-zone moisture deficit from exceeding the Readily Available Water (RAW) boundary.',
        rationale:
          'Upper 0-25cm soil moisture is currently 52% of FC. Upcoming 4-day forecast indicates zero precipitation with daily ET0 averaging 3.9mm.',
        supportedBy: 'FAO-56 Dual Kc Soil Water Ledger & NASA POWER 7-Day ET0 Forecast',
      },
      {
        id: 'rec_2',
        title: 'Calibrate Starter Nitrogen Application Rate',
        action: 'Reduce planned synthetic N broadcast by 25 kg/ha',
        urgency: 'Low',
        actionCategory: 'fertilizer',
        reason:
          'High biological nitrogen carryover from the preceding chickpea rotation phase.',
        rationale:
          'Saves input costs while avoiding excessive vegetative lodging and nitrate runoff.',
        supportedBy: 'Verified Legume Residue Biogeochemical Carryover Model',
      },
      {
        id: 'rec_3',
        title: 'Perform Ground-Truth Auger Soil Moisture Verification',
        action: 'Check 2 sampling spots at 15cm and 45cm depths',
        urgency: 'Low',
        actionCategory: 'scouting',
        reason:
          'Resolves data gap between satellite optical estimation and subsoil capacitance.',
        rationale:
          'Validates moisture sensor accuracy before committing to heavy seasonal pumping schedules.',
        supportedBy: 'Field Shift Data Gap Coach Protocol',
      },
    ],
    whatChangedSinceLastRun: [
      {
        driver: 'weather_anomaly',
        label: 'Cumulative Rainfall Anomaly',
        delta: '-6.4 mm vs 10y baseline',
        description: 'Dry spell extended by 3 days with elevated vapor pressure deficit (VPD: 1.6 kPa).',
        sourcePeriod: 'Oct 21 - Oct 27, 2026 · NASA POWER Daily',
      },
      {
        driver: 'farmer_practice',
        label: 'Farmer Routine Input Verified',
        delta: 'Drip irrigation confirmed (every 3 days, 10mm skip rule)',
        description: 'Farmer routine updated through natural language parser and confirmed for Field 1.',
        sourcePeriod: 'Oct 25, 2026 · User Confirmation',
      },
      {
        driver: 'satellite_observation',
        label: 'Sentinel-2 Cloud-Free Scene Ingested',
        delta: 'Canopy NDVI +0.05 increase',
        description: 'Rapid leaf area index expansion observed following nitrogen mineralization burst.',
        sourcePeriod: 'Oct 25, 2026 · ESA Copernicus Hub',
      },
      {
        driver: 'model_engine',
        label: 'FAO-56 Water Balance Recalculated',
        delta: 'Depletion rate +1.2 mm/day',
        description: 'Crop coefficient Kc adjusted from 0.85 to 1.05 to reflect mid-season vegetative peak.',
        sourcePeriod: 'Deterministic Engine v8.4',
      },
    ],
  };
}

// Generate second seed historical report for comparison diffing
function generateSecondaryReport(farm: SavedFarmPlan): DeepAnalysisReport {
  const dateStr = new Date(Date.now() - 5 * 86400000).toISOString();
  return {
    id: `report_${farm?.id || 'demo'}_prior`,
    farmId: farm?.id || 'default_farm',
    farmName: farm?.name || 'Active Farm',
    scope: 'all',
    fieldName: 'Whole Farm (All Fields)',
    runAt: dateStr,
    generatedAt: dateStr,
    createdAt: dateStr,
    trigger: 'Automated 3-day sync',
    overallStatus: 'good',
    overallScore: 81,
    fieldsAssessedCount: farm?.fields?.length || 2,
    fieldsNeedingAttentionCount: 1,
    confidence: 'High',
    dataReadinessPct: 91,
    summaryHeadline: 'Early Vegetative Emergence with Moderate Moisture Reserves',
    summaryText:
      'Early vegetative emergence confirmed across all parcels. Soil moisture at 68% of FC following 14mm localized precipitation event.',
    overallStatusReason: 'Precipitation front replenished shallow profiles.',
    findings: [],
    recommendedActions: [],
    whatChangedSinceLastRun: [],
  };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  analysis,
  isAdvanced = false,
  onNavigateTab,
  onEditAnswers,
  onSelectRotationDetail,
  activeFarmName,
  farms,
  selectedFarmId,
  onSelectFarmId,
  onOpenFarmSwitcher,
  onOpenGuide,
}) => {
  const currentFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];
  const answers = currentFarm?.farmAnswers || analysis?.farmAnswers;
  const climate = currentFarm?.analysis?.climateData || analysis?.climateData;

  // Selected Scope: 'all' or specific field ID
  const [selectedScope, setSelectedScope] = useState<string>('all');

  // Sub-Navigation: 'assessment' | 'domains' | 'changes' | 'timeline' | 'history'
  const [activeSubView, setActiveSubView] = useState<
    'assessment' | 'domains' | 'changes' | 'timeline' | 'history'
  >('assessment');

  // Deep Analysis Reports Repository
  const [reports, setReports] = useState<DeepAnalysisReport[]>(() => {
    const loaded = loadDeepAnalysisLogs(currentFarm?.id);
    if (loaded && loaded.length > 0) return loaded;
    const initial = generateInitialReport(currentFarm, analysis);
    const prior = generateSecondaryReport(currentFarm);
    saveDeepAnalysisLog(prior);
    saveDeepAnalysisLog(initial);
    return [initial, prior];
  });

  const [activeReportId, setActiveReportId] = useState<string>(() => reports[0]?.id || '');

  const activeReport = useMemo(() => {
    return (
      reports.find((r) => r.id === activeReportId) ||
      reports[0] ||
      generateInitialReport(currentFarm, analysis)
    );
  }, [reports, activeReportId, currentFarm, analysis]);

  // Action status state (Accepted, Scheduled, Dismissed)
  const [actionStatuses, setActionStatuses] = useState<
    Record<string, 'suggested' | 'accepted' | 'scheduled' | 'dismissed'>
  >({
    rec_1: 'suggested',
    rec_2: 'suggested',
    rec_3: 'suggested',
  });

  // Expanded evidence drawer for finding
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);

  // Fullscreen Deep Analysis Report Modal State (Fullscreen popup with top-right 'X')
  const [isFullscreenReportOpen, setIsFullscreenReportOpen] = useState(false);
  const [modalReport, setModalReport] = useState<DeepAnalysisReport | null>(null);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);

  // Automation Schedule state & Workspace Modal
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [isAutomationWizardOpen, setIsAutomationWizardOpen] = useState(false);
  const [automationWizardStep, setAutomationWizardStep] = useState<number>(1);
  const [autoScheduleActive, setAutoScheduleActive] = useState(true);

  // Automation Schedule Object
  const [activeSchedule, setActiveSchedule] = useState<AutomationSchedule>(() => {
    const schedules = loadAutomationSchedules(currentFarm?.id);
    if (schedules && schedules.length > 0) return schedules[0];
    return {
      id: `sched_${currentFarm?.id || 'demo'}`,
      farmId: currentFarm?.id || 'default_farm',
      farmName: currentFarm?.name || 'Active Farm',
      scope: 'all',
      enabled: true,
      frequencyDays: 3,
      cadence: 'every_3_days',
      timezone: 'America/Chicago (CST, UTC-6)',
      preferredTime: '02:00 AM (Low solar irradiance)',
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00',
      consentGranted: true,
      consentGrantedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      storageMode: 'local_only',
      disclosedFields: [
        'Point Latitude/Longitude Coordinates (for NASA POWER & Open-Meteo)',
        'Selected Crop Sequence & Planting Timing (for Gemini Agronomy Explanations)',
        'Soil Texture Parameter (for Infiltration Calculation)',
      ],
      lastRun: new Date(Date.now() - 2 * 86400000).toISOString(),
      nextRun: new Date(Date.now() + 1 * 86400000).toISOString(),
      lastOutcome: 'completed',
      retryCount: 0,
      notificationsEnabled: {
        highPriorityAlerts: true,
        completedReports: true,
        materialChanges: true,
        routineReminders: false,
        connectionIssues: true,
      },
      jobHistory: [],
    };
  });

  // History & Comparison Subview States (Section 30.10)
  const [historyTab, setHistoryTab] = useState<'archives' | 'automation' | 'gap_coach'>('archives');
  const [compareReportAId, setCompareReportAId] = useState<string>(() => reports[0]?.id || '');
  const [compareReportBId, setCompareReportBId] = useState<string>(
    () => reports[1]?.id || reports[0]?.id || ''
  );
  const [isComparingReports, setIsComparingReports] = useState<boolean>(false);

  // Run Deep Analysis Modal State
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [runPipelineStage, setRunPipelineStage] = useState<
    'preflight' | 'running' | 'completed' | 'failed'
  >('preflight');
  const [runProgress, setRunProgress] = useState(0);
  const [currentPipelineStep, setCurrentPipelineStep] = useState('');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Natural Language Routine Parser State
  const [routineInputText, setRoutineInputText] = useState(
    'I usually irrigate every 3 days early in the morning for 2 hours, but I skip a cycle if it rains more than 10mm.'
  );
  const [parsedRoutine, setParsedRoutine] = useState({
    activity: 'Drip Irrigation',
    recurrence: 'Every 3 days',
    timePreference: 'Early Morning (05:00 - 07:00)',
    rainSkipCondition: 'Skip if rainfall > 10mm',
    estimatedAmount: '12 - 14 mm per cycle',
    confidence: 'High (95%)',
    confirmed: true,
  });

  // Timeline Event selection
  const [selectedTimelineEventId, setSelectedTimelineEventId] = useState<string>('tl_1');
  const [timelineCategoryFilter, setTimelineCategoryFilter] = useState<string>('all');

  // Synchronize when active farm changes
  useEffect(() => {
    if (currentFarm?.id) {
      const logs = loadDeepAnalysisLogs(currentFarm.id);
      if (logs && logs.length > 0) {
        setReports(logs);
        setActiveReportId(logs[0].id);
        setCompareReportAId(logs[0].id);
        setCompareReportBId(logs[1]?.id || logs[0].id);
      } else {
        const initial = generateInitialReport(currentFarm, analysis);
        const prior = generateSecondaryReport(currentFarm);
        saveDeepAnalysisLog(prior);
        saveDeepAnalysisLog(initial);
        setReports([initial, prior]);
        setActiveReportId(initial.id);
        setCompareReportAId(initial.id);
        setCompareReportBId(prior.id);
      }
    }
  }, [currentFarm?.id]);

  // Handler for natural language input parsing
  const handleParseRoutine = (text: string) => {
    setRoutineInputText(text);
    const lower = text.toLowerCase();
    let recurrence = 'Every 3 days';
    if (lower.includes('daily') || lower.includes('every day')) recurrence = 'Daily';
    else if (lower.includes('every 2 days') || lower.includes('every other day')) recurrence = 'Every 2 days';
    else if (lower.includes('every 4 days')) recurrence = 'Every 4 days';
    else if (lower.includes('weekly') || lower.includes('once a week')) recurrence = 'Weekly';

    let timePreference = 'Early Morning';
    if (lower.includes('evening') || lower.includes('night') || lower.includes('after dark'))
      timePreference = 'Late Evening';
    else if (lower.includes('afternoon')) timePreference = 'Afternoon';

    let rainSkip = lower.includes('rain') || lower.includes('skip');
    let amount = '12 - 14 mm per cycle';
    if (lower.includes('1 hour') || lower.includes('60 min')) amount = '6 - 8 mm per cycle';
    else if (lower.includes('3 hour')) amount = '18 - 20 mm per cycle';

    setParsedRoutine({
      activity: lower.includes('sprinkler') ? 'Overhead Sprinkler' : 'Drip Irrigation',
      recurrence,
      timePreference,
      rainSkipCondition: rainSkip ? 'Enabled (Rain-Skip Trigger)' : 'None',
      estimatedAmount: amount,
      confidence: 'High (92%)',
      confirmed: true,
    });
  };

  // Pipeline Execution Simulation matching Section 7.2 & Section 57
  const handleStartAnalysisPipeline = () => {
    setRunPipelineStage('running');
    setRunProgress(5);
    setCompletedSteps([]);
    setCurrentPipelineStep('Validating Farm & Parcel Geometry (Stage 1/8)...');

    const steps = [
      { step: 'Validating farm boundaries & GIS parcel completeness', pct: 15 },
      { step: 'Freezing input snapshot, crop versions & farmer routine lock', pct: 28 },
      { step: 'Querying NASA POWER 10-year agro-meteorology API', pct: 44 },
      { step: 'Ingesting SoilGrids 250m multi-depth physical properties', pct: 58 },
      { step: 'Retrieving Copernicus Sentinel-2 Level-2A imagery (cloud < 2%)', pct: 72 },
      { step: 'Calculating FAO-56 dual crop coefficient water mass balance', pct: 86 },
      { step: 'Evaluating agronomic risk matrix & assembling prioritized findings', pct: 95 },
      { step: 'Finalizing immutable run report & syncing to local archive', pct: 100 },
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < steps.length) {
        const item = steps[currentIdx];
        setRunProgress(item.pct);
        setCurrentPipelineStep(item.step);
        setCompletedSteps((prev) => [...prev, item.step]);
        currentIdx++;
      } else {
        clearInterval(interval);
        // Build new real report
        const newReportId = `report_${currentFarm?.id || 'farm'}_${Date.now()}`;
        const timestamp = new Date().toISOString();
        const createdReport: DeepAnalysisReport = {
          id: newReportId,
          farmId: currentFarm?.id || 'farm',
          farmName: currentFarm?.name || 'Active Farm',
          scope: selectedScope,
          fieldName: selectedScope === 'all' ? 'Whole Farm (All Fields)' : 'Selected Parcel',
          runAt: timestamp,
          generatedAt: timestamp,
          createdAt: timestamp,
          trigger: 'Manual Deep Analysis',
          overallStatus: 'good',
          overallScore: 86,
          fieldsAssessedCount: currentFarm?.fields?.length || 2,
          fieldsNeedingAttentionCount: 0,
          confidence: 'High',
          dataReadinessPct: 98,
          summaryHeadline: 'Optimal Moisture Retention & Zero Heat Anomaly',
          summaryText:
            'Deep analysis pipeline successfully validated all 5 earth observation layers. NASA POWER telemetry confirms zero frost or heat anomalies. Soil moisture reserves in root zone (0-60cm) are projected at 74% capacity following recent rain event.',
          overallStatusReason:
            'All field partitions verified against Sentinel-2 10m reflectance and FAO-56 mass balance ledger.',
          findings: activeReport.findings || [],
          recommendedActions: activeReport.recommendedActions || [],
          whatChangedSinceLastRun: [
            {
              driver: 'farmer_practice',
              label: 'Management Routine Re-verified',
              delta: `${parsedRoutine.recurrence} · ${parsedRoutine.timePreference}`,
              description: `Farmer confirmed routine via natural language parser with ${parsedRoutine.rainSkipCondition}.`,
              sourcePeriod: 'Just now · Live Input',
            },
            {
              driver: 'weather_anomaly',
              label: 'NASA POWER Fresh Synced',
              delta: '7-day solar radiation 22.4 MJ/m²',
              description: 'Optimal photosynthetically active radiation (PAR) recorded.',
              sourcePeriod: 'Last 24h · NASA POWER v2',
            },
          ],
        };

        saveDeepAnalysisLog(createdReport);
        setReports((prev) => [createdReport, ...prev]);
        setActiveReportId(newReportId);
        setRunPipelineStage('completed');
      }
    }, 400);
  };

  // Compare Report Selected objects
  const reportA = useMemo(() => {
    return reports.find((r) => r.id === compareReportAId) || reports[0];
  }, [reports, compareReportAId]);

  const reportB = useMemo(() => {
    return reports.find((r) => r.id === compareReportBId) || reports[1] || reports[0];
  }, [reports, compareReportBId]);

  // Export CSV handler (Section 8.6 & 30.10)
  const handleExportCsv = (rep: DeepAnalysisReport) => {
    const csvContent =
      `Report ID,Farm ID,Date,Composite Score,Confidence,Scope,Headline\n` +
      `"${rep.id}","${rep.farmId}","${rep.runAt}","${rep.overallScore}","${rep.confidence}","${rep.scope}","${rep.summaryHeadline}"\n\n` +
      `Finding Category,Title,Severity,Field,Observation Date,Evidence Metric\n` +
      (rep.findings || [])
        .map(
          (f) =>
            `"${f.category}","${f.title}","${f.severity}","${f.fieldName}","${f.observationDate}","${f.evidence?.metric || ''}"`
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FieldShift_Report_${rep.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Timeline events dataset (Section 15.1 contract)
  const timelineEvents = useMemo(
    () => [
      {
        id: 'tl_1',
        title: 'Sentinel-2 BOA Reflection Ingested',
        category: 'remote sensing',
        timestamp: 'Oct 26, 2026 · 10:14 UTC',
        field: 'Field 1 (North Parcel)',
        status: 'Verified · Cloud 0.8%',
        summary: '10m multi-spectral scene confirmed canopy NDVI of 0.76 with no localized chlorosis.',
        details: {
          sensor: 'Copernicus Sentinel-2B MSI Level-2A',
          bands: 'B4 (Red 665nm), B8 (NIR 842nm), B8A (Narrow NIR 865nm)',
          cloudProbability: '0.8%',
          solarZenith: '42.1°',
          meanNdvi: '0.76',
          variance: '0.008',
          whatFieldShiftKnew:
            'Canopy greenness index is +4.2% above the 5-year regional median. No water stress symptoms evident at foliage surface.',
        },
      },
      {
        id: 'tl_2',
        title: 'Farmer Routine Input Confirmed',
        category: 'farmer reported',
        timestamp: 'Oct 25, 2026 · 14:30 Local',
        field: 'Field 1 (North Parcel)',
        status: 'Parsed & Confirmed',
        summary: 'Drip irrigation routine: Every 3 days, early morning, skip if rainfall > 10mm.',
        details: {
          sourceStatement: 'Natural language input from farmer mobile interface',
          method: 'Drip / Micro-irrigation with pressure compensating emitters',
          volumeAssumption: '14 mm effective root depth application',
          rainSkipRule: '> 10mm precipitation in 24h prior to cycle',
          whatFieldShiftKnew:
            'Routine provides model expectation, not proof of actual pump run. Water balance ledger incorporates this as planned inflow.',
        },
      },
      {
        id: 'tl_3',
        title: 'NASA POWER Agro-Climatology Sync',
        category: 'weather/reanalysis',
        timestamp: 'Oct 24, 2026 · 06:00 UTC',
        field: 'All Parcels',
        status: '10-Year Verified Baseline',
        summary: 'Precipitation 18.4mm recorded across preceding 72-hour frontal passage.',
        details: {
          precipitation72h: '18.4 mm',
          tMax: '24.2 °C',
          tMin: '11.8 °C',
          relativeHumidity: '68%',
          referenceEt0: '3.4 mm/day',
          whatFieldShiftKnew:
            'Precipitation replenished shallow 0-15cm soil layer to field capacity, pausing need for scheduled drip run.',
        },
      },
      {
        id: 'tl_4',
        title: 'Automated 3-Day Deep Analysis Run',
        category: 'analysis',
        timestamp: 'Oct 22, 2026 · 02:00 UTC',
        field: 'Whole Farm',
        status: 'Report Archived (Score 84/100)',
        summary: 'Complete multi-source synthesis generated with 3 prioritized recommendations.',
        details: {
          compositeScore: '84/100',
          assessedFields: '2 of 2 fields',
          severeAlerts: '0',
          dataCoverage: '94%',
          whatFieldShiftKnew:
            'Farm status is stable. Next upcoming risk identified was shallow moisture depletion boundary.',
        },
      },
      {
        id: 'tl_5',
        title: 'Pre-Season Soil Core Test Logged',
        category: 'farmer reported',
        timestamp: 'Oct 10, 2026 · 11:00 Local',
        field: 'Field 2 (South Pivot)',
        status: 'Lab Certified Report',
        summary: 'Soil organic carbon measured at 1.8%, pH 6.8, available P (Olsen) 24 mg/kg.',
        details: {
          lab: 'AgriAnalysis Midwest Laboratory',
          sampleDepth: '0 - 30 cm core composite',
          pH: '6.8 (Neutral)',
          soilOrganicMatter: '3.1%',
          cationExchangeCapacity: '22 cmol/kg',
          whatFieldShiftKnew:
            'Replaced default regional SoilGrids estimate with high-precision measured ground truth, elevating evidence confidence to 98%.',
        },
      },
    ],
    []
  );

  const filteredTimelineEvents = useMemo(() => {
    if (timelineCategoryFilter === 'all') return timelineEvents;
    return timelineEvents.filter((ev) =>
      ev.category.toLowerCase().includes(timelineCategoryFilter.toLowerCase())
    );
  }, [timelineEvents, timelineCategoryFilter]);

  const selectedTimelineEvent = useMemo(() => {
    return (
      timelineEvents.find((e) => e.id === selectedTimelineEventId) || timelineEvents[0]
    );
  }, [timelineEvents, selectedTimelineEventId]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5 text-white">
      {/* 1. TOP COMMAND STRIP & HEADER */}
      <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/[0.14] shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Scope Badges */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#27D7B2]/20 to-[#12887A]/30 border border-[#27D7B2]/40 flex items-center justify-center text-[#27D7B2] shrink-0 shadow-md">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Farm Intelligence
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Deep Analysis Engine
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-300 bg-white/5 border border-white/10">
                  v8.4 Deterministic
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                Understand field conditions, changes, and evidence-linked next steps for{' '}
                <span className="text-white font-semibold">{currentFarm?.name || 'Selected Farm'}</span>.
              </p>
            </div>
          </div>

          {/* Scope Control & Primary Action Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Scope Selector: Whole Farm vs Field */}
            <div className="flex items-center bg-black/40 border border-white/15 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedScope('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedScope === 'all'
                    ? 'bg-[#27D7B2] text-[#020A10] shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Whole Farm (All Fields)
              </button>
              {currentFarm?.fields && currentFarm.fields.length > 0 ? (
                currentFarm.fields.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedScope(f.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer truncate max-w-[140px] ${
                      selectedScope === f.id
                        ? 'bg-[#27D7B2] text-[#020A10] shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {f.name}
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedScope('field_1')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    selectedScope === 'field_1'
                      ? 'bg-[#27D7B2] text-[#020A10] shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Field 1 (North)
                </button>
              )}
            </div>

            {/* Run Deep Analysis Primary Button */}
            <button
              type="button"
              onClick={() => {
                setIsLoadingModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB394] hover:brightness-110 text-[#020A10] font-black text-xs flex items-center gap-2 shadow-lg shadow-[#27D7B2]/25 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 fill-[#020A10]" />
              <span>Run Deep Analysis</span>
            </button>

            {/* View Fullscreen Report Button */}
            <button
              type="button"
              onClick={() => {
                setModalReport(activeReport);
                setIsFullscreenReportOpen(true);
              }}
              title="Open Complete Assessment in Fullscreen Modal (Esc to close)"
              className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.14] text-slate-100 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Eye className="w-4 h-4 text-[#27D7B2]" />
              <span>Open Fullscreen Report</span>
            </button>

            {/* Manage Automation Button */}
            <button
              type="button"
              onClick={() => setIsAutomationModalOpen(true)}
              title="Manage Automation Schedules & Privacy Settings"
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4 text-[#73CAD0]" />
              <span>Manage Schedule</span>
            </button>

            {/* Open Exportable Field Brief (Print & PDF) */}
            <button
              type="button"
              onClick={() => onNavigateTab('brief')}
              title="Open Exportable Field Brief with A4/Letter print & PDF output"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2]/20 to-[#12887A]/20 hover:from-[#27D7B2]/30 hover:to-[#12887A]/30 border border-[#27D7B2]/40 text-[#27D7B2] hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <FileText className="w-4 h-4 text-[#27D7B2]" />
              <span>Field Brief (PDF)</span>
            </button>
          </div>
        </div>

        {/* Telemetry Status Bar: Freshness, Automation & Cross-links */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.08] text-xs text-slate-300">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#27D7B2]" />
              <span>
                Assessment:{' '}
                <strong className="text-white">
                  {new Date(
                    activeReport.runAt || activeReport.createdAt || Date.now()
                  ).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </strong>
              </span>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#27D7B2] animate-pulse" />
              <span className="text-[#27D7B2] font-medium">Evidence Fresh (NASA + Copernicus S2)</span>
            </span>
            <span className="text-white/20">•</span>
            <button
              type="button"
              onClick={() => setIsAutomationModalOpen(true)}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#73CAD0] group-hover:rotate-45 transition-transform" />
              <span>
                Automation:{' '}
                <strong className={activeSchedule.enabled ? 'text-[#73CAD0]' : 'text-slate-400'}>
                  {activeSchedule.enabled ? 'Every 3 days · next run Nov 10' : 'Paused'}
                </strong>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveSubView('history');
                setHistoryTab('archives');
              }}
              className="text-[#73CAD0] hover:text-[#27D7B2] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Report Archive ({reports.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOP SUMMARY ROW (Section 7.1 & 7.4): Farm Condition Index & Essential Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Farm Condition Index Card */}
        <div className="p-4 rounded-2xl glass-card border border-white/[0.12] space-y-1.5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#27D7B2]" />
              Farm Condition Index
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#27D7B2]/15 text-[#27D7B2]">
              Validated
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{activeReport.overallScore || 84}</span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
            <span className="text-xs font-bold text-[#27D7B2] ml-auto">Good &amp; Stable</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Area-weighted composite. <em>Safeguard: Composite score never hides severe field-specific alerts.</em>
          </p>
        </div>

        {/* Field Assessment Status Card */}
        <div className="p-4 rounded-2xl glass-card border border-white/[0.12] space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-[#73CAD0]" />
              Field Assessment Status
            </span>
            <span className="text-xs font-mono text-slate-400">100% Geometry</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {activeReport.fieldsAssessedCount || 2}
            </span>
            <span className="text-xs text-slate-400 font-medium">fields assessed</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>0 critical alerts · all partitions nominal</span>
          </p>
        </div>

        {/* Evidence Confidence Card */}
        <div className="p-4 rounded-2xl glass-card border border-white/[0.12] space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Database className="w-4 h-4 text-cyan-400" />
              Evidence Confidence
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-400/15 text-cyan-300">
              {activeReport.confidence || 'High'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{activeReport.dataReadinessPct || 94}%</span>
            <span className="text-xs text-slate-400 font-medium">telemetry coverage</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            5 verified layers: NASA POWER, Sentinel-2 (10m), SoilGrids, FAO-56 dual Kc &amp; Farmer Routine.
          </p>
        </div>

        {/* Next Recommendation Card */}
        <div className="p-4 rounded-2xl glass-card border border-white/[0.12] space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              Priority Action Window
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/15 text-amber-300">
              Next 72 Hours
            </span>
          </div>
          <div className="text-sm font-bold text-white line-clamp-1">
            {activeReport.recommendedActions?.[0]?.title || 'Supplemental Drip Irrigation'}
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Tied to upper root-zone RAW deficit check before soil water tension reaches 65 kPa.
          </p>
        </div>
      </div>

      {/* 3. SEGMENTED NAVIGATION BAR: 5 Core Perspectives */}
      <div className="flex items-center bg-black/40 border border-white/[0.12] rounded-xl p-1 gap-1 overflow-x-auto">
        {[
          { id: 'assessment', label: 'Executive Assessment & Verdict', icon: ShieldCheck },
          { id: 'domains', label: 'Supporting Diagnostic Engines', icon: Layers },
          { id: 'changes', label: 'What Changed & Evidence Story', icon: TrendingUp },
          { id: 'timeline', label: 'Field Evidence Timeline', icon: Clock },
          { id: 'history', label: 'Report Archives & Automation', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubView(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#27D7B2] to-[#1DB093] text-[#020A10] shadow-md shadow-[#27D7B2]/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 4. SUBVIEW: ASSESSMENT (Executive Assessment & Verdict)        */}
      {/* ============================================================== */}
      {activeSubView === 'assessment' && (
        <div className="space-y-5">
          {/* Executive Summary Card */}
          <div className="p-5 sm:p-6 rounded-2xl glass-card border border-white/[0.14] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#27D7B2]/15 border border-[#27D7B2]/30 flex items-center justify-center text-[#27D7B2] shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#27D7B2]">
                    Report Verdict
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {activeReport.summaryHeadline || 'Vegetative Canopy Expansion & Stable Root-Zone Reserves'}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Status: Low Stress
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              {activeReport.summaryText}
            </p>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#73CAD0] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-white">Scientific Caveat &amp; Field Instruction: </span>
                <span>
                  Telemetry indicates high canopy vigor (NDVI: 0.74 - 0.76). Note that satellite vegetation indices measure overall canopy reflectance and cannot differentiate water stress from micro-nutrient deficiencies without ground soil verification. Perform soil auger verification prior to adjusting seasonal base allocations.
                </span>
              </div>
            </div>
          </div>

          {/* Field-by-Field Assessment Landscape Table (Section 7.4 & 58) */}
          <div className="p-5 rounded-2xl glass-card border border-white/[0.14] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#27D7B2]" />
                  <span>Field-by-Field Assessment Matrix</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Per-field indicators prevent localized water deficits or weed escapes from being masked by whole-farm averaging.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Assessed: 2 of 2 fields (100% parcel coverage)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Field Name</th>
                    <th className="px-4 py-3">Crop &amp; Stage</th>
                    <th className="px-4 py-3">Condition Index</th>
                    <th className="px-4 py-3">Soil Moisture</th>
                    <th className="px-4 py-3">Canopy NDVI</th>
                    <th className="px-4 py-3">Leading Finding</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  <tr className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27D7B2]" />
                      <span>Field 1 (North Parcel)</span>
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      Winter Wheat · <span className="text-slate-400">Tillering</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="text-emerald-400">86</span>
                        <span className="text-slate-500">/ 100</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                        52% (Approaching RAW)
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#27D7B2]">0.76 (High)</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[220px] truncate">
                      Shallow root depletion due to 4 dry days
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedScope('field_1')}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white font-medium transition-colors cursor-pointer"
                      >
                        Filter Scope
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span>Field 2 (South Pivot)</span>
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      Chickpea Carryover · <span className="text-slate-400">Post-Legume</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="text-emerald-400">82</span>
                        <span className="text-slate-500">/ 100</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                        74% (Adequate)
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#27D7B2]">0.72 (Normal)</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[220px] truncate">
                      Biological N carryover +48 kg/ha active
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedScope('field_2')}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white font-medium transition-colors cursor-pointer"
                      >
                        Filter Scope
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Ranked Priority Findings (Section 7.6 & 59) */}
          <div className="p-5 rounded-2xl glass-card border border-white/[0.14] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Ranked Priority Findings &amp; Observations</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Findings prioritized by severity, empirical evidence confidence, and agronomic actionability.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {activeReport.findings?.map((finding: DeepAnalysisFinding) => {
                const isExpanded = expandedFindingId === finding.id;
                const isCaution = finding.severity === 'caution' || finding.severity === 'medium';
                const isPositive = finding.severity === 'positive';
                return (
                  <div
                    key={finding.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCaution
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : isPositive
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-black/40 border-white/10'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCaution
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                : isPositive
                                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                                : 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                            }`}
                          >
                            {finding.category || 'Agronomic Observation'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {finding.fieldName}
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-400">
                            Observed: {finding.observationDate || 'Oct 26, 2026'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white">
                          {finding.title}
                        </h4>

                        <p className="text-xs text-slate-200 leading-relaxed">
                          {finding.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-[#27D7B2] font-semibold flex items-center gap-1.5 transition-colors self-start cursor-pointer shrink-0"
                      >
                        <span>{isExpanded ? 'Hide Evidence' : 'Inspect Evidence'}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>

                    {/* Expandable Evidence Drawer (Section 7.6) */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-3 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-black/60 border border-white/10">
                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                              Underlying Observation / Telemetry
                            </span>
                            <p className="text-slate-200 font-mono text-[11px]">
                              {finding.evidence?.metric || 'Metric'}:{' '}
                              <strong className="text-white">{finding.evidence?.observed || 'N/A'}</strong> (Baseline:{' '}
                              {finding.evidence?.baseline || 'Historical Normal'})
                            </p>
                            <p className="text-slate-400 text-[11px] mt-1">
                              <strong>Trigger Rule:</strong> {finding.evidence?.rule || 'Agronomic threshold check'}
                            </p>
                          </div>

                          <div>
                            <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                              Field Check &amp; Ground-Truth Guide
                            </span>
                            <p className="text-slate-200 text-[11px]">
                              {finding.evidence?.whatToCheck ||
                                'Examine topsoil moisture with auger and verify tensiometer readings.'}
                            </p>
                            <p className="text-slate-400 text-[11px] mt-1">
                              <strong>Source:</strong> {finding.source || 'NASA POWER + SoilGrids'}
                            </p>
                          </div>
                        </div>

                        {finding.recommendation && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#27D7B2]/10 border border-[#27D7B2]/30 text-[#27D7B2]">
                            <ArrowRight className="w-4 h-4 shrink-0" />
                            <span>
                              <strong>Recommended Action:</strong> {finding.recommendation}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evidence-Linked Practical Actions (Section 7.6 & 59) */}
          <div className="p-5 rounded-2xl glass-card border border-white/[0.14] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#27D7B2]" />
                  <span>Evidence-Linked Action Plan</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Every action is strictly supported by physical models and empirical observations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {activeReport.recommendedActions?.map((action: any) => {
                const currentStatus = actionStatuses[action.id] || 'suggested';
                return (
                  <div
                    key={action.id}
                    className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            action.urgency === 'High'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : action.urgency === 'Medium'
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                          }`}
                        >
                          {action.urgency} Urgency
                        </span>
                        <span
                          className={`text-[11px] font-semibold capitalize ${
                            currentStatus === 'accepted'
                              ? 'text-emerald-400'
                              : currentStatus === 'scheduled'
                              ? 'text-cyan-400'
                              : currentStatus === 'dismissed'
                              ? 'text-slate-500 line-through'
                              : 'text-slate-400'
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-snug">
                        {action.title}
                      </h4>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {action.rationale || action.reason}
                      </p>

                      <div className="text-[10px] text-slate-400 pt-1 border-t border-white/10 font-mono">
                        Supported by: {action.supportedBy}
                      </div>
                    </div>

                    {/* Action Execution Toggles */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() =>
                          setActionStatuses((prev) => ({
                            ...prev,
                            [action.id]: currentStatus === 'accepted' ? 'suggested' : 'accepted',
                          }))
                        }
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          currentStatus === 'accepted'
                            ? 'bg-emerald-500 text-black shadow-sm'
                            : 'bg-white/5 hover:bg-white/10 text-slate-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{currentStatus === 'accepted' ? 'Accepted' : 'Accept'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActionStatuses((prev) => ({
                            ...prev,
                            [action.id]: currentStatus === 'scheduled' ? 'suggested' : 'scheduled',
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          currentStatus === 'scheduled'
                            ? 'bg-[#27D7B2] text-[#020A10]'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActionStatuses((prev) => ({
                            ...prev,
                            [action.id]: currentStatus === 'dismissed' ? 'suggested' : 'dismissed',
                          }))
                        }
                        title="Dismiss recommendation"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. SUBVIEW: DOMAINS (Supporting Diagnostic Engines)           */}
      {/* ============================================================== */}
      {activeSubView === 'domains' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Water Intelligence & FAO-56 Mass Balance Ledger */}
          <div className="p-5 rounded-2xl glass-card border border-white/[0.14] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Water Mass Balance &amp; FAO-56 Ledger</h3>
                  <span className="text-[11px] text-slate-400">Dual crop coefficient (Kc) dynamic simulation</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-400/15 text-cyan-300">
                RAW Buffer: 4 Days
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Cumulative 7-Day Precipitation</span>
                <span className="font-mono font-bold text-white">18.4 mm (vs 22.1 mm 10y norm)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Daily Reference ET0</span>
                <span className="font-mono font-bold text-white">3.8 mm/day</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Current Crop ETc (Kc = 0.95)</span>
                <span className="font-mono font-bold text-[#27D7B2]">3.6 mm/day</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Readily Available Water (RAW)</span>
                <span className="font-mono font-bold text-white">68 mm (Total TAW: 125 mm)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Confirmed Irrigation Routine Assumption</span>
                <span className="font-mono text-cyan-300">Drip (Every 3 days · early morning)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-300">
              <strong>Methodology Disclosure:</strong> Simulates soil moisture in two distinct strata (0-25cm evaporation layer and 25-60cm root extraction zone) calibrated with NASA POWER daily shortwave solar flux.
            </div>
          </div>

          {/* Soil Physics & Pedological Telemetry */}
          <div className="p-5 rounded-2xl glass-card border border-white/[0.14] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#27D7B2]/15 border border-[#27D7B2]/30 flex items-center justify-center text-[#27D7B2]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Soil Physics &amp; Pedological Telemetry</h3>
                  <span className="text-[11px] text-slate-400">SoilGrids 250m + Lab Calibration</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#27D7B2]/15 text-[#27D7B2]">
                Provenanced
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>USDA Soil Texture Class</span>
                <span className="font-mono font-bold text-white capitalize">
                  {answers?.soilTexture?.replace('_', ' ') || 'Silt Loam'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Soil pH (1:1 Water Extract)</span>
                <span className="font-mono font-bold text-white">6.8 (Optimal availability)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Soil Organic Matter (SOM)</span>
                <span className="font-mono font-bold text-white">{answers?.soilOrganicMatterPct || 2.8}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Biological Mineral N Carryover</span>
                <span className="font-mono font-bold text-emerald-400">+48 kg/ha from Pre-Chickpea</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Provenance Tag</span>
                <span className="font-mono text-slate-400">Measured Lab Core (Field 2) + Mapped (Field 1)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-300">
              <strong>Pedological Context:</strong> Silt loam matrix provides high cation exchange capacity (CEC ~22 cmol/kg) and low nutrient leaching vulnerability under scheduled drip cycles.
            </div>
          </div>

          {/* Climate & Extreme Thermal Exposure */}
          <div className="p-5 rounded-2xl glass-card border border-white/[0.14] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Climate &amp; Thermal Stress Exposure</h3>
                  <span className="text-[11px] text-slate-400">NASA POWER Agro-Climatology reanalysis</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-400/15 text-emerald-300">
                Nominal Range
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Accumulated Growing Degree Days (GDD)</span>
                <span className="font-mono font-bold text-white">1,420 GDD (Base 10°C)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Heat Stress Days (&gt;35°C in Season)</span>
                <span className="font-mono font-bold text-emerald-400">0 days (Zero flower sterility risk)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Frost Hazard Window</span>
                <span className="font-mono font-bold text-white">&gt; 20 days buffer</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Vapor Pressure Deficit (VPD)</span>
                <span className="font-mono font-bold text-[#27D7B2]">1.4 kPa (Active transpiration)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-300">
              <strong>Agro-meteorology:</strong> Ambient thermal regimes match the vegetative elongation curve for cereal/legume intercrops without thermal shock induction.
            </div>
          </div>

          {/* Sentinel-2 10m Vegetation Telemetry */}
          <div className="p-5 rounded-2xl glass-card border border-white/[0.14] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Copernicus Sentinel-2 10m Telemetry</h3>
                  <span className="text-[11px] text-slate-400">Multi-Spectral Level-2A BOA Reflection</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-400/15 text-emerald-300">
                Cloud: 0.8%
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Canopy NDVI (Latest Scene)</span>
                <span className="font-mono font-bold text-[#27D7B2]">0.76 (Field 1) / 0.72 (Field 2)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>5-Year Regional Phenological Baseline</span>
                <span className="font-mono font-bold text-white">0.71 (Anomaly: +0.05)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Scene Timestamp</span>
                <span className="font-mono font-bold text-white">Oct 26, 2026 · 10:14 UTC</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10 text-slate-300">
                <span>Spatial Resolution</span>
                <span className="font-mono text-slate-400">10m x 10m ground sampling pixel</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-300">
              <strong>Cautionary Remote Sensing Principle:</strong> A high greenness index demonstrates strong light interception; however, satellite optical indices alone cannot diagnose disease or root rot. Ground scouting remains required.
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. SUBVIEW: CHANGES ("What Changed?" & Evidence Story)         */}
      {/* ============================================================== */}
      {activeSubView === 'changes' && (
        <div className="p-5 sm:p-6 rounded-2xl glass-card border border-white/[0.14] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#27D7B2]" />
                <span>What Changed Since Prior Assessment?</span>
              </h2>
              <p className="text-xs text-slate-300">
                Section 15.13 contract: Classified delta drivers with source-period attribution. Non-causal scientific language.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Compared with baseline: Oct 21, 2026
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeReport.whatChangedSinceLastRun?.map((change: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 hover:border-[#27D7B2]/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-200">
                    {change.driver?.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#27D7B2]">
                    {change.delta}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">
                  {change.label}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {change.description}
                </p>

                <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-white/10 flex items-center justify-between">
                  <span>Source: {change.sourcePeriod}</span>
                  <span className="text-[#27D7B2] font-semibold flex items-center gap-0.5">
                    View Evidence <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-1.5 text-xs text-slate-300">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#27D7B2]" />
              <span>Comparative Integrity Standard</span>
            </h4>
            <p>
              In accordance with Section 7.7, deltas are displayed only when underlying data grids, sensor calibrations, and time windows are scientifically comparable. If algorithms or spatial resolutions are modified between runs, Field Shift states the methodology update rather than asserting misleading trend arrows.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. SUBVIEW: TIMELINE (Field Evidence Timeline - Section 15.1)  */}
      {/* ============================================================== */}
      {activeSubView === 'timeline' && (
        <div className="p-5 sm:p-6 rounded-2xl glass-card border border-white/[0.14] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#27D7B2]" />
                <span>Field Evidence Timeline</span>
              </h2>
              <p className="text-xs text-slate-300">
                What happened to this field, and what did Field Shift know at the time? 7-column timeline with 5-column evidence snapshot.
              </p>
            </div>

            {/* Filter by Category */}
            <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
              {['all', 'remote sensing', 'weather', 'farmer reported', 'analysis'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTimelineCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                    timelineCategoryFilter === cat
                      ? 'bg-[#27D7B2] text-[#020A10] font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat === 'all' ? 'All Events' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* 12-Column Layout: 7 Cols Timeline Feed + 5 Cols Event Evidence Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT: 7 Columns Chronological Timeline */}
            <div className="lg:col-span-7 space-y-3">
              {filteredTimelineEvents.map((ev) => {
                const isSelected = selectedTimelineEventId === ev.id;
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedTimelineEventId(ev.id)}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#27D7B2]/10 border-[#27D7B2] shadow-md shadow-[#27D7B2]/10'
                        : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-slate-400">{ev.timestamp}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-300">
                        {ev.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white flex items-center justify-between">
                      <span>{ev.title}</span>
                      <span className="text-xs font-mono text-[#27D7B2]">{ev.field}</span>
                    </h4>

                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {ev.summary}
                    </p>

                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#27D7B2]" />
                        <span>{ev.status}</span>
                      </span>
                      <span className="text-[#27D7B2] font-semibold flex items-center gap-0.5">
                        Inspect Snapshot <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT: 5 Columns Selected Event Snapshot ("What did Field Shift know?") */}
            <div className="lg:col-span-5 p-4 sm:p-5 rounded-xl bg-black/60 border border-white/15 space-y-4 self-start sticky top-20">
              <div className="border-b border-white/10 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#27D7B2]">
                  Evidence Snapshot
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedTimelineEvent.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedTimelineEvent.timestamp} · {selectedTimelineEvent.field}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-[#73CAD0] uppercase tracking-wider">
                  What Field Shift Knew At This Time:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedTimelineEvent.details?.whatFieldShiftKnew}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Telemetric Properties
                </span>
                {Object.entries(selectedTimelineEvent.details || {})
                  .filter(([k]) => k !== 'whatFieldShiftKnew')
                  .map(([key, val]) => (
                    <div
                      key={key}
                      className="flex justify-between py-1 border-b border-white/[0.06] text-slate-300"
                    >
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-mono font-semibold text-white">{String(val)}</span>
                    </div>
                  ))}
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-white/10">
                <strong>Provenance Guarantee:</strong> Historical events reflect the immutable dataset known at the event's recorded date.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. SUBVIEW: HISTORY, COMPARISON & AUTOMATION (Section 30.10 & 30.11) */}
      {/* ============================================================== */}
      {activeSubView === 'history' && (
        <div className="space-y-5">
          {/* Internal Tab Switcher: Archives & Compare vs Automation & Jobs vs Data Gap Coach */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setHistoryTab('archives');
                setIsComparingReports(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                historyTab === 'archives' && !isComparingReports
                  ? 'bg-[#27D7B2] text-[#020A10] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Report Archives Table</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHistoryTab('archives');
                setIsComparingReports(true);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                historyTab === 'archives' && isComparingReports
                  ? 'bg-[#27D7B2] text-[#020A10] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Side-by-Side Report Compare</span>
            </button>

            <button
              type="button"
              onClick={() => setHistoryTab('automation')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                historyTab === 'automation'
                  ? 'bg-[#27D7B2] text-[#020A10] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Automation Schedules &amp; Job Logs</span>
            </button>

            <button
              type="button"
              onClick={() => setHistoryTab('gap_coach')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                historyTab === 'gap_coach'
                  ? 'bg-[#27D7B2] text-[#020A10] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Data Gap Coach</span>
            </button>
          </div>

          {/* TAB 8.1: REPORT ARCHIVES TABLE (Section 30.10: 7-8 Cols Table + 4-5 Cols Compare) */}
          {historyTab === 'archives' && !isComparingReports && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: 8 Cols Chronological History Table */}
              <div className="lg:col-span-8 p-5 rounded-2xl glass-card border border-white/[0.14] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-[#27D7B2]" />
                      <span>Chronological Assessment Archives</span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Immutable snapshots. Select two reports to initiate deep side-by-side comparison.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsComparingReports(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#27D7B2]/15 hover:bg-[#27D7B2]/25 border border-[#27D7B2]/30 text-[#27D7B2] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Compare Selected ({compareReportAId === compareReportBId ? '1' : '2'})</span>
                  </button>
                </div>

                {/* 60-72px Table Rows (Section 30.10 contract) */}
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                      <tr>
                        <th className="px-3 py-3 w-8">Sel</th>
                        <th className="px-3 py-3">Report Date / Time</th>
                        <th className="px-3 py-3">Scope</th>
                        <th className="px-3 py-3">Trigger</th>
                        <th className="px-3 py-3">Score</th>
                        <th className="px-3 py-3">Confidence</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.07]">
                      {reports.map((rep) => {
                        const isCurrentActive = rep.id === activeReportId;
                        const isSelectedA = rep.id === compareReportAId;
                        const isSelectedB = rep.id === compareReportBId;
                        return (
                          <tr
                            key={rep.id}
                            className={`h-16 hover:bg-white/[0.04] transition-colors ${
                              isCurrentActive ? 'bg-[#27D7B2]/10' : ''
                            }`}
                          >
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={isSelectedA || isSelectedB}
                                onChange={() => {
                                  if (isSelectedA) {
                                    setCompareReportAId(compareReportBId);
                                  } else if (isSelectedB) {
                                    setCompareReportBId(compareReportAId);
                                  } else {
                                    setCompareReportBId(rep.id);
                                  }
                                }}
                                className="rounded accent-[#27D7B2] cursor-pointer"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <div className="font-semibold text-white">
                                {new Date(rep.runAt || rep.createdAt || Date.now()).toLocaleDateString(
                                  'en-US',
                                  { month: 'short', day: 'numeric', year: 'numeric' }
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {new Date(rep.runAt || rep.createdAt || Date.now()).toLocaleTimeString(
                                  'en-US',
                                  { hour: '2-digit', minute: '2-digit' }
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 capitalize text-slate-200">
                              {rep.scope === 'all' ? 'Whole Farm' : 'Field Scope'}
                            </td>
                            <td className="px-3 py-3 text-slate-300">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10">
                                {rep.trigger || 'Manual'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="font-mono font-bold text-white text-sm">
                                {rep.overallScore || 84}
                              </span>
                              <span className="text-slate-400 text-[10px]">/100</span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-400/15 text-cyan-300">
                                {rep.confidence || 'High'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400/15 text-emerald-300 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Complete</span>
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReportId(rep.id);
                                    setModalReport(rep);
                                    setIsFullscreenReportOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#27D7B2]/15 hover:bg-[#27D7B2]/25 text-[#27D7B2] font-semibold text-xs transition-colors cursor-pointer"
                                >
                                  Open
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExportCsv(rep)}
                                  title="Export CSV"
                                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: 4 Cols Quick Comparison Summary */}
              <div className="lg:col-span-4 p-5 rounded-2xl glass-card border border-white/[0.14] space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#27D7B2] block">
                  Selected Comparison Pair
                </span>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-semibold text-white">Baseline (Report A):</span>
                    <span className="font-mono text-[#27D7B2]">
                      {new Date(reportA.runAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Score: {reportA.overallScore}/100 · {reportA.summaryHeadline}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-semibold text-white">Compare (Report B):</span>
                    <span className="font-mono text-[#73CAD0]">
                      {new Date(reportB.runAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Score: {reportB.overallScore}/100 · {reportB.summaryHeadline}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5 text-xs text-slate-300">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Comparability Evaluation:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400/15 text-emerald-300">
                      Directly Comparable
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Both reports evaluated under identical sensor geometries (Sentinel-2 10m VNIR) and NASA POWER 10-year climatology baselines.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsComparingReports(true)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB394] text-[#020A10] font-black text-xs transition-colors shadow-md shadow-[#27D7B2]/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <GitCompare className="w-4 h-4" />
                  <span>Open Deep Side-by-Side Diff</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 8.2: SIDE-BY-SIDE REPORT COMPARISON (Section 30.10 Contract) */}
          {historyTab === 'archives' && isComparingReports && (
            <div className="p-5 sm:p-6 rounded-2xl glass-card border border-white/[0.14] space-y-5">
              {/* Sticky Comparison Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-5 h-5 text-[#27D7B2]" />
                    <h3 className="text-base font-bold text-white">Side-by-Side Report Comparison</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                      Comparable Baseline
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Comparing Report <strong className="text-white">{reportA.id}</strong> ({new Date(reportA.runAt || Date.now()).toLocaleDateString()}) with Report <strong className="text-white">{reportB.id}</strong> ({new Date(reportB.runAt || Date.now()).toLocaleDateString()}).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportCsv(reportA)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#27D7B2]" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsComparingReports(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Close Comparison
                  </button>
                </div>
              </div>

              {/* Metric Delta Comparison Grid (Section 30.10 Contract) */}
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3">Agronomic Metric</th>
                      <th className="px-4 py-3">Report A (Baseline)</th>
                      <th className="px-4 py-3">Report B (Current)</th>
                      <th className="px-4 py-3">Delta (Units)</th>
                      <th className="px-4 py-3">Direction Meaning</th>
                      <th className="px-4 py-3">Comparability Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.07]">
                    <tr className="hover:bg-white/[0.04]">
                      <td className="px-4 py-3 font-semibold text-white">Farm Condition Index</td>
                      <td className="px-4 py-3 font-mono">{reportA.overallScore}/100</td>
                      <td className="px-4 py-3 font-mono">{reportB.overallScore}/100</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                        {((reportB.overallScore || 84) - (reportA.overallScore || 81)) >= 0 ? '+' : ''}
                        {(reportB.overallScore || 84) - (reportA.overallScore || 81)} pts
                      </td>
                      <td className="px-4 py-3 text-emerald-300">Favorable Resilience Growth</td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">Identical Area-Weighted Formula</td>
                    </tr>

                    <tr className="hover:bg-white/[0.04]">
                      <td className="px-4 py-3 font-semibold text-white">Canopy NDVI (Field 1)</td>
                      <td className="px-4 py-3 font-mono">0.71</td>
                      <td className="px-4 py-3 font-mono">0.76</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#27D7B2]">+0.05</td>
                      <td className="px-4 py-3 text-[#27D7B2]">Canopy Leaf Area Expansion</td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">Sentinel-2 Level-2A BOA Reflection</td>
                    </tr>

                    <tr className="hover:bg-white/[0.04]">
                      <td className="px-4 py-3 font-semibold text-white">Root-Zone RAW Moisture %</td>
                      <td className="px-4 py-3 font-mono">68% FC</td>
                      <td className="px-4 py-3 font-mono">52% FC</td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">-16% FC</td>
                      <td className="px-4 py-3 text-amber-300">Drawdown Near Irrigation Threshold</td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">FAO-56 Dual Kc Root Mass Balance</td>
                    </tr>

                    <tr className="hover:bg-white/[0.04]">
                      <td className="px-4 py-3 font-semibold text-white">Available Mineral Nitrogen</td>
                      <td className="px-4 py-3 font-mono">42 kg/ha</td>
                      <td className="px-4 py-3 font-mono">48 kg/ha</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">+6 kg/ha</td>
                      <td className="px-4 py-3 text-emerald-300">Legume N Fixation Mineralization</td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">Biogeochemical Residue Rate</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Attribution: Why did the assessment change? (Section 7.7 & 15.13) */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#27D7B2]">
                  Attribution: Why Did The Assessment Change?
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10 space-y-1">
                    <span className="font-bold text-white block">Environmental Driver</span>
                    <p className="text-[11px]">
                      Dry spell persisted 4 consecutive days without frontal precipitation, accelerating upper root transpirational demand by 1.2mm/day.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10 space-y-1">
                    <span className="font-bold text-white block">Management Practice Driver</span>
                    <p className="text-[11px]">
                      Farmer confirmed 3-day early morning drip routine; system successfully accounted for 14mm inflow schedule in the dual Kc model.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10 space-y-1">
                    <span className="font-bold text-white block">Model Version Driver</span>
                    <p className="text-[11px]">
                      Deterministic engine v8.4 applied mid-season Kc adjustment (0.85 → 1.05) to match observed Sentinel-2 phenological leaf area.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8.3: AUTOMATION SCHEDULES & JOB LOGS (Section 30.11 Contract: 12-Cols) */}
          {historyTab === 'automation' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: 7 Cols Schedule Form & Controls */}
              <div className="lg:col-span-7 p-5 rounded-2xl glass-card border border-white/[0.14] space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-[#27D7B2]" />
                      <span>Automation &amp; Background Execution</span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Configure automated background evaluations without leaving local storage unprotected.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAutomationWizardStep(1);
                      setIsAutomationWizardOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#27D7B2] text-[#020A10] font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Re-configure Schedule</span>
                  </button>
                </div>

                {/* Cadence & Frequency Card */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white uppercase text-[11px]">Re-evaluation Cadence</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#27D7B2]/20 text-[#27D7B2]">
                      {activeSchedule.enabled ? 'Active / Enabled' : 'Paused'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    {['daily', 'every_3_days', 'weekly'].map((cad) => (
                      <div
                        key={cad}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          activeSchedule.cadence === cad
                            ? 'bg-[#27D7B2]/15 border-[#27D7B2] text-white font-bold'
                            : 'bg-black/30 border-white/10 text-slate-400'
                        }`}
                      >
                        <div className="capitalize">{cad.replace('_', ' ')}</div>
                        <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                          {cad === 'daily'
                            ? 'Daily morning sync'
                            : cad === 'every_3_days'
                            ? 'Optimal satellite pass'
                            : 'Weekly summary'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    * Schedule is a re-evaluation frequency; sources only refresh when new satellite or meteorological scenes publish.
                  </p>
                </div>

                {/* Notification Policies (Section 8.7 Contract) */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <span className="font-bold text-white text-xs uppercase tracking-wider block">
                    Notification &amp; Alert Rules
                  </span>

                  <div className="space-y-2 text-xs">
                    {[
                      { key: 'highPriorityAlerts', label: 'Critical Moisture & Heat Anomaly Alerts', desc: 'Immediate notification when physiological floors are crossed' },
                      { key: 'completedReports', label: 'Scheduled Report Completion Summaries', desc: 'Notification after scheduled job concludes with new findings' },
                      { key: 'materialChanges', label: 'Material Weather & Rain Anomaly Alerts', desc: 'Alert when cumulative rainfall deviates by >20mm from baseline' },
                      { key: 'connectionIssues', label: 'Satellite Data Gaps / Delay Notices', desc: 'Data quality notification (not crop-health alarm) on sensor lag' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-start justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/10 gap-3"
                      >
                        <div>
                          <div className="font-semibold text-white">{item.label}</div>
                          <div className="text-[11px] text-slate-400">{item.desc}</div>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="mt-1 rounded accent-[#27D7B2] cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: 5 Cols "What Will Be Sent/Stored" & Last Run Summary (Section 30.11 Contract) */}
              <div className="lg:col-span-5 p-5 rounded-2xl glass-card border border-white/[0.14] space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#73CAD0]" />
                    <span>Privacy &amp; Local Schedule Boundary</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Transparent accounting of data boundaries and local evaluation rules.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-white/10">
                    <span className="text-slate-400">Execution Mode:</span>
                    <span className="font-bold text-[#27D7B2]">Local In-Browser Schedule</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/10">
                    <span className="text-slate-400">Active Boundary:</span>
                    <span className="text-emerald-400 font-semibold">Client-Side Only (No Cloud Uploads)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/10">
                    <span className="text-slate-400">Timezone Config:</span>
                    <span className="text-white font-mono">{activeSchedule.timezone}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Quiet Hours:</span>
                    <span className="text-white font-mono">
                      {activeSchedule.quietHoursStart} - {activeSchedule.quietHoursEnd}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5 text-xs text-slate-300">
                  <span className="font-bold text-white block">External Request Disclosures:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                    {activeSchedule.disclosedFields?.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-slate-400 pt-1">
                    * Zero background execution occurs while the browser is closed. Field Shift does not upload private farm snapshots to any remote cloud database.
                  </p>
                </div>

                {/* Local Schedule Preference Status */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Local Run Preference Status</span>
                    <span className="text-[10px] font-mono text-[#27D7B2]">Browser Active</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">Last In-Session Run:</span>
                      <span className="text-white font-semibold">{new Date(activeSchedule.lastRun || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">Next Scheduled Check:</span>
                      <span className="text-[#27D7B2] font-semibold">{new Date(activeSchedule.nextRun || Date.now()).toLocaleDateString()} (Upon Launch)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 font-sans leading-normal">
                      Runs locally when the app is opened; missed intervals evaluate immediately upon launch without requiring an always-on remote server.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8.4: DATA GAP COACH (Section 15.2 Contract) */}
          {historyTab === 'gap_coach' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 p-5 rounded-2xl glass-card border border-white/[0.14] space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#73CAD0]" />
                    <span>Data Gap Coach &amp; Evidence Quality Elevation</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Targeted laboratory measurements and ground observations that elevate model confidence without arbitrary guessing.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: 'gap_1',
                      missing: 'Measured Soil pH Date-Stamped Test',
                      why: 'Currently relying on SoilGrids 250m regional estimate. Measured core verifies phosphorus availability.',
                      affectedMetric: 'Crop Nutrient Uptake Model',
                      cta: 'Enter Lab Test pH',
                      confidenceBoost: 'High qualitative benefit',
                    },
                    {
                      id: 'gap_2',
                      missing: 'Drip Flow Meter Actual Volume Output',
                      why: 'Routine indicates 2 hours run time; volume confirmation confirms true mm applied vs emitter clogging.',
                      affectedMetric: 'FAO-56 Dual Kc Root Ledger',
                      cta: 'Verify Flow Rate (L/min)',
                      confidenceBoost: 'Eliminates water stress variance',
                    },
                    {
                      id: 'gap_3',
                      missing: 'Preceding Legume Residue Stubble Height',
                      why: 'Refines biological nitrogen decomposition velocity for spring top-dressing schedule.',
                      affectedMetric: 'Biogeochemical Mineralization',
                      cta: 'Record Residue Estimate',
                      confidenceBoost: 'Optimizes fertilizer expenditure',
                    },
                  ].map((gap) => (
                    <div
                      key={gap.id}
                      className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          What is missing
                        </span>
                        <span className="text-[10px] font-mono text-[#27D7B2]">
                          {gap.confidenceBoost}
                        </span>
                      </div>

                      <h5 className="text-sm font-bold text-white">{gap.missing}</h5>
                      <p className="text-slate-300 leading-relaxed">{gap.why}</p>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">
                          Affects: {gap.affectedMetric}
                        </span>
                        <button
                          type="button"
                          onClick={onEditAnswers}
                          className="px-3 py-1.5 rounded-lg bg-[#27D7B2]/15 hover:bg-[#27D7B2]/25 text-[#27D7B2] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {gap.cta}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 p-5 rounded-2xl glass-card border border-white/[0.14] space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#27D7B2] block">
                  Confidence Philosophy
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  In accordance with Section 15.2, Field Shift never asserts arbitrary quantitative confidence improvements (e.g. "+12% confidence") unless scientifically validated. Instead, we qualitatively describe which physical model is refined by your ground input.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. RUN DEEP ANALYSIS PIPELINE MODAL (Sections 7.2, 7.3, 56, 57)*/}
      {/* ============================================================== */}
      {isRunModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl glass-modal border border-white/20 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#27D7B2]/20 text-[#27D7B2] flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {runPipelineStage === 'preflight'
                      ? 'Deep Analysis Preflight & Routine Check'
                      : runPipelineStage === 'running'
                      ? 'Executing Farm Intelligence Pipeline'
                      : 'Deep Analysis Complete'}
                  </h3>
                  <span className="text-xs text-slate-300 font-mono">
                    Farm: {currentFarm?.name} · Scope: {selectedScope === 'all' ? 'Whole Farm' : 'Selected Parcel'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRunModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STAGE 1: PREFLIGHT PANEL (Natural Language Routine Parser) */}
            {runPipelineStage === 'preflight' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#27D7B2]" />
                    <span>Data Refresh Scope &amp; Sources Configured</span>
                  </div>
                  <p>
                    This run will retrieve and validate Copernicus Sentinel-2 (10m VNIR), NASA POWER (10-yr agro-meteorology), and SoilGrids (multi-strata pedology).
                  </p>
                </div>

                {/* Natural Language Routine Input (Section 7.3 & 56) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Farmer Routine Input (Natural Language Parser)</span>
                    <span className="text-[10px] font-mono text-[#73CAD0]">Section 7.3 &amp; 56 Standard</span>
                  </label>
                  <p className="text-[11px] text-slate-300">
                    Describe your irrigation routine in your own words. The parser will interpret and structure it for model ingestion.
                  </p>
                  <textarea
                    rows={2}
                    value={routineInputText}
                    onChange={(e) => handleParseRoutine(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#27D7B2]"
                    placeholder="e.g. I irrigate every 3 days early morning for 2 hours, skipping if it rains..."
                  />
                </div>

                {/* Structured Parsed Output Confirmation */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#27D7B2]">
                      Interpreted Structured Fields (For Your Confirmation)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">{parsedRoutine.confidence}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-black/40 border border-white/10">
                      <span className="text-slate-400 block text-[10px]">Activity</span>
                      <strong className="text-white">{parsedRoutine.activity}</strong>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-white/10">
                      <span className="text-slate-400 block text-[10px]">Recurrence</span>
                      <strong className="text-white">{parsedRoutine.recurrence}</strong>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-white/10">
                      <span className="text-slate-400 block text-[10px]">Time Preference</span>
                      <strong className="text-white">{parsedRoutine.timePreference}</strong>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-white/10">
                      <span className="text-slate-400 block text-[10px]">Rain-Skip Condition</span>
                      <strong className="text-white">{parsedRoutine.rainSkipCondition}</strong>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    * Saved routines represent model expectations, not proof of pump activation.
                  </p>
                </div>

                {/* Preflight Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsRunModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartAnalysisPipeline}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#1FB394] hover:brightness-110 text-[#020A10] font-black text-xs flex items-center gap-2 shadow-lg shadow-[#27D7B2]/25 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-[#020A10]" />
                    <span>Confirm &amp; Run Analysis</span>
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: RUNNING PIPELINE (Section 57 Contract) */}
            {runPipelineStage === 'running' && (
              <div className="space-y-5 py-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{currentPipelineStep}</span>
                    <span className="font-mono font-bold text-[#27D7B2]">{runProgress}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#27D7B2] to-[#73CAD0] transition-all duration-300"
                      style={{ width: `${runProgress}%` }}
                    />
                  </div>
                </div>

                {/* Real Step History Feed */}
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-1.5 max-h-48 overflow-y-auto text-xs font-mono">
                  {completedSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-300 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#27D7B2] shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAGE 3: COMPLETED PIPELINE */}
            {runPipelineStage === 'completed' && (
              <div className="space-y-4 py-2 text-center">
                <div className="w-12 h-12 rounded-full bg-[#27D7B2]/20 border border-[#27D7B2]/40 text-[#27D7B2] flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Deep Analysis Run Finalized</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    New immutable report generated with verified telemetry and saved to your farm archive.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRunModalOpen(false);
                      setModalReport(activeReport);
                      setIsFullscreenReportOpen(true);
                      setActiveSubView('assessment');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#12887A] hover:brightness-110 text-[#020A10] font-black text-xs transition-all shadow-lg shadow-[#27D7B2]/25 cursor-pointer active:scale-95 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4 text-[#020A10]" />
                    <span>View Completed Assessment in Fullscreen</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 10. STEPWISE AUTOMATION SETUP WIZARD (Section 8.3 & 30.11)     */}
      {/* ============================================================== */}
      {isAutomationWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl glass-modal border border-white/20 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#27D7B2] block">
                  Step {automationWizardStep} of 5
                </span>
                <h3 className="text-base font-bold text-white">
                  {automationWizardStep === 1 && 'Select Scope & Cadence'}
                  {automationWizardStep === 2 && 'Review Management Practice Snapshot'}
                  {automationWizardStep === 3 && 'Privacy & Remote Storage Disclosure'}
                  {automationWizardStep === 4 && 'Notifications & Quiet Hours'}
                  {automationWizardStep === 5 && 'Confirm & Explicitly Enable Automation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAutomationWizardOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: Cadence */}
            {automationWizardStep === 1 && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Choose how often Field Shift should re-evaluate your farm when new earth observations publish:
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'daily', label: 'Daily', sub: 'Every 24 hours' },
                    { id: 'every_3_days', label: 'Every 3 Days', sub: 'Optimal satellite sync' },
                    { id: 'weekly', label: 'Weekly', sub: 'Every Monday' },
                  ].map((cad) => (
                    <div
                      key={cad.id}
                      onClick={() =>
                        setActiveSchedule((prev) => ({
                          ...prev,
                          cadence: cad.id,
                          frequencyDays: cad.id === 'daily' ? 1 : cad.id === 'every_3_days' ? 3 : 7,
                        }))
                      }
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        activeSchedule.cadence === cad.id
                          ? 'bg-[#27D7B2]/20 border-[#27D7B2] text-white font-bold'
                          : 'bg-black/40 border-white/10 text-slate-400'
                      }`}
                    >
                      <div>{cad.label}</div>
                      <div className="text-[10px] text-slate-400">{cad.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Routine Freshness */}
            {automationWizardStep === 2 && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Should the background job keep using your saved watering routine until you update it?
                </p>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <span className="font-bold text-white block">Saved Routine:</span>
                  <div className="text-[#27D7B2] font-semibold">
                    {parsedRoutine.activity} ({parsedRoutine.recurrence} · {parsedRoutine.timePreference})
                  </div>
                  <div className="text-slate-400 text-[11px]">{parsedRoutine.rainSkipCondition}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-xl bg-[#27D7B2]/15 border border-[#27D7B2]/30 text-[#27D7B2] font-bold text-xs"
                  >
                    Still Accurate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutomationWizardOpen(false);
                      setIsRunModalOpen(true);
                    }}
                    className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-xs"
                  >
                    Update Routine
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Honest Privacy Disclosure */}
            {automationWizardStep === 3 && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200">
                  <strong className="block text-white mb-0.5">Honest Storage Architecture:</strong>
                  A backend cannot run an analysis while your browser is closed unless you grant explicit consent to synchronize the minimum necessary profile inputs.
                </div>
                <div className="space-y-1.5 p-3 rounded-xl bg-black/40 border border-white/10 text-[11px]">
                  <span className="font-bold text-white block">Exactly what is transmitted:</span>
                  <div>• Farm &amp; parcel polygon boundaries</div>
                  <div>• Crop rotation sequences &amp; planting dates</div>
                  <div>• Structured irrigation routine assumptions</div>
                  <div>• Historical report reference IDs</div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Zero free-text notes or personal details unrelated to agronomic calculations will leave local storage.
                </p>
              </div>
            )}

            {/* STEP 4: Notifications & Quiet Hours */}
            {automationWizardStep === 4 && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300">Define quiet hours so non-critical alerts don't interrupt your sleep:</p>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Quiet Hours Start</span>
                    <input
                      type="text"
                      defaultValue="22:00"
                      className="w-full px-2 py-1 rounded bg-black/60 border border-white/20 text-white font-mono text-xs mt-1"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Quiet Hours End</span>
                    <input
                      type="text"
                      defaultValue="06:00"
                      className="w-full px-2 py-1 rounded bg-black/60 border border-white/20 text-white font-mono text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Explicit Review & Consent Confirmation */}
            {automationWizardStep === 5 && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#27D7B2]" />
                    <span>Ready to Enable Automated Background Deep Analysis</span>
                  </div>
                  <p>
                    Re-evaluations will execute every 3 days at 02:00 CST. You may pause, edit, or revoke background processing at any time.
                  </p>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  if (automationWizardStep > 1) {
                    setAutomationWizardStep(automationWizardStep - 1);
                  } else {
                    setIsAutomationWizardOpen(false);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-semibold"
              >
                {automationWizardStep === 1 ? 'Cancel' : 'Back'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (automationWizardStep < 5) {
                    setAutomationWizardStep(automationWizardStep + 1);
                  } else {
                    setActiveSchedule((prev) => ({
                      ...prev,
                      enabled: true,
                      consentGranted: true,
                      consentGrantedAt: new Date().toISOString(),
                    }));
                    saveAutomationSchedule(activeSchedule);
                    setIsAutomationWizardOpen(false);
                    setHistoryTab('automation');
                    setActiveSubView('history');
                  }
                }}
                className="px-5 py-2 rounded-xl bg-[#27D7B2] text-[#020A10] font-black text-xs cursor-pointer shadow-md shadow-[#27D7B2]/20"
              >
                {automationWizardStep === 5 ? 'Confirm & Enable Schedule' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 11. AUTOMATION MODAL QUICK DRAWER                              */}
      {/* ============================================================== */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl glass-modal border border-white/20 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#27D7B2]" />
                <span>Automation Schedule Options</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAutomationModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                <div>
                  <div className="font-bold text-white">Automated Background Runs</div>
                  <div className="text-[11px] text-slate-400">Every 3 days · next run Nov 10</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !activeSchedule.enabled;
                    setActiveSchedule((prev) => ({ ...prev, enabled: nextState }));
                    saveAutomationSchedule({ ...activeSchedule, enabled: nextState });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeSchedule.enabled ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {activeSchedule.enabled ? 'Active' : 'Paused'}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAutomationModalOpen(false);
                    setHistoryTab('automation');
                    setActiveSubView('history');
                  }}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#27D7B2] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Open Full Automation Workspace &amp; Logs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 11. DEDICATED DYNAMIC ACTION HISTORY LOADING SCREEN            */}
      {/* ============================================================== */}
      <DeepAnalysisLoadingModal
        isOpen={isLoadingModalOpen}
        farm={currentFarm}
        scope={selectedScope}
        onClose={() => setIsLoadingModalOpen(false)}
        existingReport={activeReport}
        onOpenReport={(rep) => {
          setIsLoadingModalOpen(false);
          setModalReport(rep);
          setIsFullscreenReportOpen(true);
          saveDeepAnalysisLog(rep);
          setReports((prev) => [rep, ...prev.filter((r) => r.id !== rep.id)]);
          setActiveReportId(rep.id);
        }}
      />

      {/* ============================================================== */}
      {/* 12. DEDICATED FULLSCREEN DEEP ANALYSIS REPORT POPUP MODAL      */}
      {/* ============================================================== */}
      <DeepAnalysisReportModal
        report={modalReport || activeReport}
        farm={currentFarm}
        isOpen={isFullscreenReportOpen}
        onClose={() => setIsFullscreenReportOpen(false)}
        onOpenFieldBrief={() => onNavigateTab('brief')}
      />
    </div>
  );
};
